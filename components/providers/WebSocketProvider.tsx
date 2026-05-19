"use client";
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

/**
 * WebSocketProvider — butun dastur uchun BITTA WS ulanishi
 * Sidebar ichiga joylangan: login -> ulandi, logout -> uzildi
 */
export default function WebSocketProvider() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const isDestroyedRef = useRef(false);
  const MAX_RECONNECT = 15;

  /**
   * http(s):// -> ws(s)://
   * NEXT_PUBLIC_API_URL yo'q bo'lsa — joriy origin ishlatiladi
   */
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

  // connect useRef bilan saqlash — scheduleReconnect ichida circular dep oldini olish uchun
  const connectRef = useRef<() => void>(() => {});

  const scheduleReconnect = useCallback(() => {
    if (isDestroyedRef.current) return;
    if (reconnectCountRef.current >= MAX_RECONNECT) {
      console.warn("WS: Maksimal urinish tugadi");
      return;
    }
    const delay = Math.min(
      2000 * Math.pow(1.5, reconnectCountRef.current),
      30000,
    );
    reconnectCountRef.current += 1;
    console.log(
      "WS: " +
        Math.round(delay / 1000) +
        "s da qayta uriniladi (" +
        reconnectCountRef.current +
        "/" +
        MAX_RECONNECT +
        ")",
    );
    reconnectTimerRef.current = setTimeout(() => connectRef.current(), delay);
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    if (isDestroyedRef.current) return;

    // Avvalgi ulanishni yopish
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
    } catch (err) {
      console.error("WS: WebSocket yaratishda xato:", err);
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
        const msg = JSON.parse(event.data as string);
        const { type, data } = msg;

        switch (type) {
          case "pong":
          case "connected":
          case "disconnected":
            break;

          case "new_order":
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            if (data?.message) {
              toast.success(data.message, { icon: "🍽️", duration: 4000 });
            }
            break;

          case "qr_order":
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            toast.success(
              "📱 QR buyurtma: " + (data?.items_count ?? "") + " ta mahsulot",
              { duration: 5000 },
            );
            break;

          case "order_ready":
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            toast.success("✅ Buyurtma tayyor!", { duration: 6000 });
            break;

          default:
            console.log("WS: noma'lum event:", type, data);
        }
      } catch (err) {
        console.error("WS: Xabar parse xatosi:", err);
      }
    };

    ws.onclose = (event) => {
      clearInterval((ws as any)._pingInterval);
      if (isDestroyedRef.current) return;
      if (event.code === 1000 || event.code === 1001) return;
      scheduleReconnect();
    };

    ws.onerror = () => {
      // Browser xavfsizlik sababli onerror da ma'lumot bo'lmaydi.
      // Haqiqiy xato onclose da keladi — shu yerda log qilmaymiz.
    };
  }, [buildWsUrl, qc, scheduleReconnect]);

  // connectRef ni yangilab turish
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
