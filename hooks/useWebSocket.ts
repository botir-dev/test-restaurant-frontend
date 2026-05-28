"use client";
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

type WsEventHandler = (data: any) => void;

interface UseWebSocketOptions {
  handlers?: Record<string, WsEventHandler>;
  /** Avtomatik qayta ulanish (default: true) */
  reconnect?: boolean;
  /** Qayta ulanish orasidagi vaqt ms (default: 3000) */
  reconnectDelay?: number;
}

/**
 * Markaziy WebSocket hook
 *
 * Ishlatish:
 * useWebSocket({
 *   handlers: {
 *     new_order: (data) => { queryClient.invalidateQueries(...) },
 *     order_ready: (data) => { toast.success(...) },
 *   }
 * });
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { handlers = {}, reconnect = true, reconnectDelay = 3000 } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);
  const handlersRef = useRef(handlers);
  const reconnectCountRef = useRef(0);
  const MAX_RECONNECT = 10;

  // Handlerlarni har render da yangilash (stale closure muammosini hal qiladi)
  useEffect(() => {
    handlersRef.current = handlers;
  });

  /**
   * API URL dan WS URL tuzish
   * NEXT_PUBLIC_API_URL = "http://localhost:3000" -> "ws://localhost:3000"
   * NEXT_PUBLIC_API_URL = "https://api.example.com" -> "wss://api.example.com"
   * NEXT_PUBLIC_API_URL bo'sh bo'lsa — joriy origin ishlatiladi
   */
  const buildWsUrl = useCallback((): string => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    if (apiUrl) {
      return (
        apiUrl.replace(/^https?/, (m) => (m === "https" ? "wss" : "ws")) + "/ws"
      );
    }

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${window.location.host}/ws`;
  }, []);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    if (isUnmountedRef.current) return;

    // Eski ulanishni yopish
    if (wsRef.current) {
      const old = wsRef.current;
      wsRef.current = null;
      try {
        old.close(1000, "reconnecting");
      } catch (_) {}
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    let wsUrl: string;
    try {
      wsUrl = buildWsUrl();
    } catch (err) {
      console.error("WS: URL tuzishda xato:", err);
      return;
    }

    // Token subprotocol orqali yuboriladi — URL da ko'rinmaydi
    // Backend ws.routes.js da: request.headers['sec-websocket-protocol'] dan o'qiladi
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl, [`bearer.${token}`]);
    } catch (err) {
      console.error("WS: WebSocket yaratishda xato:", err);
      scheduleReconnect();
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      reconnectCountRef.current = 0;

      // Ping/pong — ulanish tirik ekanligini tekshirish (25s)
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

        if (type === "pong" || type === "connected") return;

        if (type === "disconnected") {
          // Server bizni yangi ulanish sababli uzdi — qayta ulanmaymiz
          return;
        }

        const handler = handlersRef.current[type];
        if (handler) {
          handler(data);
        }
      } catch (err) {
        console.error("WS: Xabar parse xatosi:", err);
      }
    };

    ws.onclose = (event) => {
      clearInterval((ws as any)._pingInterval);
      if (isUnmountedRef.current) return;

      // 1000 = normal yopilish, 1001 = sahifa yopildi
      if (!reconnect || event.code === 1000 || event.code === 1001) return;

      scheduleReconnect();
    };

    ws.onerror = () => {
      // onerror event objecti ma'lumot bermaydi (xavfsizlik sababi)
      // Kerakli ma'lumot onclose da keladi
      // Faqat oddiy log, stack trace yo'q
      console.warn(
        "WS: Ulanish xatosi yuz berdi. onclose da batafsil ma'lumot chiqadi.",
      );
    };
  }, [reconnect, reconnectDelay, buildWsUrl]);

  const scheduleReconnect = useCallback(() => {
    if (!reconnect) return;
    if (reconnectCountRef.current >= MAX_RECONNECT) {
      console.warn(`WS: ${MAX_RECONNECT} marta urinib ko'rildi, to'xtatildi`);
      return;
    }

    // Eksponensial backoff: 3s, 6s, 9s, ...max 30s
    const delay = Math.min(
      reconnectDelay * (reconnectCountRef.current + 1),
      30000,
    );
    reconnectCountRef.current += 1;

    reconnectTimerRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) connect();
    }, delay);
  }, [reconnect, reconnectDelay, connect]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        clearInterval((wsRef.current as any)._pingInterval);
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [connect]);

  return wsRef;
}
