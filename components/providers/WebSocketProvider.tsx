"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

// ─── TOVUSH SOZLAMASI ─────────────────────────────────────
// localStorage dan o'qiladi: 'speech' | 'notification'
const getSoundPref = (): "speech" | "notification" =>
  typeof window !== "undefined"
    ? (localStorage.getItem("notify_sound") as any) || "notification"
    : "notification";

// ─── WEB SPEECH API ───────────────────────────────────────
const speak = (text: string) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  // Tizimda mavjud eng yaxshi ovoz
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang.startsWith("uz")) ||
    voices.find((v) => v.lang.startsWith("ru")) ||
    voices[0];
  if (preferred) utter.voice = preferred;
  utter.rate = 0.9;
  utter.pitch = 1;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
};

// ─── WEB NOTIFICATION API (telefon default tovushi) ───────
const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window))
    return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

const showNativeNotification = (title: string, body: string) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  // Brauzer o'zi telefon default bildirishnoma tovushini chiqaradi
  const n = new Notification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    // silent: false — default: telefon tovushi chiqadi
  });
  // 6 soniyadan keyin avtomatik yopiladi
  setTimeout(() => n.close(), 6000);
};

// ─── VIBRATSIYA ────────────────────────────────────────────
const vibrate = (pattern: number[]) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// ─── ASOSIY NOTIFY FUNKSIYA ────────────────────────────────
const notify = (msg: string, icon: string, duration: number) => {
  const pref = getSoundPref();

  // Toast har doim chiqadi
  toast.success(msg, { icon, duration });

  // Vibratsiya: qisqa-qisqa-uzun
  vibrate([200, 100, 200, 100, 400]);

  if (pref === "speech") {
    // Xabarni ovozda o'qib berish
    speak(msg);
  } else {
    // Telefon default bildirishnoma tovushi
    showNativeNotification("Restoran tizimi", msg);
  }
};

// ─── TOVUSH TANLASH MODAL ──────────────────────────────────
export function SoundSettingsButton() {
  const [pref, setPref] = useState<"speech" | "notification">(getSoundPref);
  const [permDenied, setPermDenied] = useState(false);

  const handleChange = async (val: "speech" | "notification") => {
    if (val === "notification") {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermDenied(true);
        return;
      }
      setPermDenied(false);
    }
    setPref(val);
    localStorage.setItem("notify_sound", val);

    // Test
    if (val === "speech") {
      speak("Bildirishnoma tovushi tanlandi");
    } else {
      showNativeNotification("Test", "Bildirishnoma tovushi tanlandi");
    }
  };

  return (
    <div className="px-3 py-2 border-t border-gray-100 mt-1">
      <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">
        Bildirishnoma tovushi
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handleChange("notification")}
          className={`flex-1 text-xs py-2 px-2 rounded-xl border-2 font-semibold transition-all ${
            pref === "notification"
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          🔔 Default tovush
        </button>
        <button
          onClick={() => handleChange("speech")}
          className={`flex-1 text-xs py-2 px-2 rounded-xl border-2 font-semibold transition-all ${
            pref === "speech"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          🗣️ Xabar o'qish
        </button>
      </div>
      {permDenied && (
        <p className="text-xs text-red-500 mt-1.5">
          Bildirishnoma ruxsati rad etilgan. Brauzer sozlamalaridan ruxsat
          bering.
        </p>
      )}
    </div>
  );
}

// ─── WEBSOCKET PROVIDER ────────────────────────────────────
export default function WebSocketProvider() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const isDestroyedRef = useRef(false);
  const MAX_RECONNECT = 15;

  // Sahifa ochilganda notification ruxsatini so'rash
  useEffect(() => {
    if (isAuthenticated && getSoundPref() === "notification") {
      requestNotificationPermission();
    }
  }, [isAuthenticated]);

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
            notify(data?.message || "Yangi buyurtma keldi", "🍽️", 4000);
            break;

          case "qr_order":
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            notify(
              "QR buyurtma keldi: " +
                (data?.items_count ?? "") +
                " ta mahsulot",
              "📱",
              5000,
            );
            break;

          case "order_ready":
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            notify("Buyurtma tayyor! Stolga olib boring.", "✅", 6000);
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
