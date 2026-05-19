"use client";
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

type WsEventHandler = (data: any) => void;

interface UseWebSocketOptions {
  /** WebSocket xabar turlari va ularni qayta ishlash handlerlari */
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
 * ```tsx
 * useWebSocket({
 *   handlers: {
 *     new_order: (data) => { queryClient.invalidateQueries(...) },
 *     order_ready: (data) => { toast.success(...) },
 *   }
 * });
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { handlers = {}, reconnect = true, reconnectDelay = 3000 } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);
  const handlersRef = useRef(handlers);

  // Handlerlarni har render da yangilash (stale closure muammosini hal qiladi)
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    // http(s):// -> ws(s):// ga o'girish
    const wsUrl = apiUrl.replace(/^http/, "ws") + `/ws?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WS: Ulandi");
        // Ping/pong uchun interval
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
          const msg = JSON.parse(event.data);
          const { type, data } = msg;

          if (type === "pong" || type === "connected") return;

          const handler = handlersRef.current[type];
          if (handler) {
            handler(data);
          }
        } catch (err) {
          console.error("WS: Xabar parse xatosi", err);
        }
      };

      ws.onclose = (event) => {
        clearInterval((ws as any)._pingInterval);
        if (isUnmountedRef.current) return;

        console.log(`WS: Uzildi (code: ${event.code})`);

        if (reconnect && event.code !== 1000) {
          reconnectTimerRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) {
              console.log("WS: Qayta ulanish...");
              connect();
            }
          }, reconnectDelay);
        }
      };

      ws.onerror = (err) => {
        console.error("WS: Xato", err);
      };
    } catch (err) {
      console.error("WS: Ulanishda xato", err);
    }
  }, [reconnect, reconnectDelay]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        clearInterval((wsRef.current as any)._pingInterval);
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [connect]);

  return wsRef;
}
