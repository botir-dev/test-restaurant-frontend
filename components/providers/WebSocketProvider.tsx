"use client";
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

// Web Speech API orqali xabarni o'qib berish
const speak = (text: string) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  // Avvalgi ovozni to'xtatish
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "uz-UZ";
  utter.rate = 0.95;
  utter.pitch = 1;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
};

export default function WebSocketProvider() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const isDestroyedRef = useRef(false);
  const MAX_RECONNECT = 15;

  const buildWsUrl = useCallback((token: string): string => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    if (apiUrl) {
      return (
        apiUrl.replace(/^https?/, (m) => (m === "https" ? "wss" : "ws")) +
        "/ws?token=" +
        token
      );
    }
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return proto + "://" + window.location.host + "/ws?token=" + token;
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

    const token = localStorage.getItem("access_token");
    if (!token) return;

    let ws: WebSocket;
    try {
      ws = new WebSocket(buildWsUrl(token));
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
            {
              const msg = data?.message || "Yangi buyurtma keldi";
              toast.success(msg, { icon: "🍽️", duration: 4000 });
              speak(msg);
            }
            break;

          case "qr_order":
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            {
              const msg =
                "QR buyurtma keldi, " +
                (data?.items_count ?? "") +
                " ta mahsulot";
              toast.success(msg, { icon: "📱", duration: 5000 });
              speak(msg);
            }
            break;

          case "order_ready":
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            {
              const msg = "Buyurtma tayyor! Stolga olib boring.";
              toast.success(msg, { icon: "✅", duration: 6000 });
              speak(msg);
            }
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

  useEffect(() => {
    isDestroyedRef.current = false;
    if (isAuthenticated) {
      reconnectCountRef.current = 0;
      connect();
    } else {
      disconnect();
    }
    return () => {
      isDestroyedRef.current = true;
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  return null;
}
