"use client";
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

// ─── AudioContext unlock (iOS/Android birinchi tap keyin ishlaydi) ──
let audioCtxUnlocked = false;
const unlockAudio = () => {
  if (audioCtxUnlocked) return;
  audioCtxUnlocked = true;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    setTimeout(() => ctx.close(), 200);
  } catch (_) {}
};

// ─── RINGTONE ────────────────────────────────────────────────────────
const playSound = () => {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();

    const note = (
      freq: number,
      start: number,
      duration: number,
      vol = 0.45,
      type: OscillatorType = "sine",
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration + 0.01);
    };

    const t = ctx.currentTime;
    note(1046.5, t + 0.0, 0.25);
    note(784.0, t + 0.28, 0.35);
    note(880.0, t + 0.7, 0.2);
    note(1046.5, t + 0.93, 0.35);

    setTimeout(() => {
      try {
        ctx.close();
      } catch (_) {}
    }, 2000);
  } catch (_) {}
};

// ─── VIBRATSIYA ──────────────────────────────────────────────────────
const vibrate = () => {
  try {
    navigator.vibrate?.([150, 80, 150, 80, 300]);
  } catch (_) {}
};

// ─── ASOSIY NOTIFY ───────────────────────────────────────────────────
const notify = (msg: string, icon: string, duration: number) => {
  toast.success(msg, { icon, duration });
  playSound();
  vibrate();
};

// ─── WEBSOCKET PROVIDER ──────────────────────────────────────────────
export default function WebSocketProvider() {
  const { isAuthenticated, accessToken } = useAuthStore(); // ← accessToken qo'shildi
  const qc = useQueryClient();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const isDestroyedRef = useRef(false);
  const MAX_RECONNECT = 15;

  useEffect(() => {
    document.addEventListener("click", unlockAudio, { once: true });
    document.addEventListener("touchstart", unlockAudio, { once: true });
    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  const buildWsUrl = useCallback((): string => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    if (apiUrl) {
      return (
        apiUrl.replace(/^https?/, (m) => (m === "https" ? "wss" : "ws")) + "/ws"
      );
    }
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return proto + "://" + window.location.host + "/ws";
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      clearInterval((wsRef.current as any)._pingInterval);
      try {
        wsRef.current.close(1000, "disconnect");
      } catch (_) {}
      wsRef.current = null;
    }
  }, []);

  const connectRef = useRef<() => void>(() => {});

  const scheduleReconnect = useCallback(() => {
    if (isDestroyedRef.current) return;
    if (reconnectCountRef.current >= MAX_RECONNECT) return;
    const delay = Math.min(
      2000 * Math.pow(1.5, reconnectCountRef.current),
      30000,
    );
    reconnectCountRef.current += 1;
    reconnectTimerRef.current = setTimeout(() => connectRef.current(), delay);
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    if (isDestroyedRef.current) return;

    if (wsRef.current) {
      clearInterval((wsRef.current as any)._pingInterval);
      try {
        wsRef.current.close(1000, "reconnecting");
      } catch (_) {}
      wsRef.current = null;
    }

    // ← O'zgarish shu yerda: localStorage emas, store dan
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    let ws: WebSocket;
    try {
      ws = new WebSocket(buildWsUrl(), [`bearer.${token}`]);
    } catch {
      scheduleReconnect();
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      reconnectCountRef.current = 0;
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        } else {
          clearInterval(pingInterval);
        }
      }, 25000);
      (ws as any)._pingInterval = pingInterval;
    };

    ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data as string);
        switch (type) {
          case "pong":
          case "connected":
          case "disconnected":
            break;
          case "new_order":
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            notify(data?.message || "Yangi buyurtma keldi!", "🍽️", 5000);
            break;
          case "qr_order":
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            notify(
              "QR buyurtma: " + (data?.items_count ?? "") + " ta mahsulot",
              "📱",
              5000,
            );
            break;
          case "order_ready":
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            notify("Buyurtma tayyor! Stolga olib boring.", "✅", 6000);
            break;
          case "item_ready":
            qc.invalidateQueries({ queryKey: ["orders"] });
            notify(data?.message || "Mahsulot tayyor!", "🔔", 4000);
            break;
          default:
            break;
        }
      } catch (_) {}
    };

    ws.onclose = (event) => {
      clearInterval((ws as any)._pingInterval);
      if (isDestroyedRef.current) return;
      if (event.code === 1000 || event.code === 1001) return;
      scheduleReconnect();
    };

    ws.onerror = () => {};
  }, [buildWsUrl, qc, scheduleReconnect]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // ← accessToken ham dependency ga qo'shildi
  // Token yangilanganda (refresh dan keyin) WS qayta ulanadi
  useEffect(() => {
    isDestroyedRef.current = false;
    if (isAuthenticated && accessToken) {
      reconnectCountRef.current = 0;
      connect();
    } else {
      disconnect();
    }
    return () => {
      isDestroyedRef.current = true;
      disconnect();
    };
  }, [isAuthenticated, accessToken, connect, disconnect]);

  return null;
}
