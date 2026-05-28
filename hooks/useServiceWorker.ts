"use client";
import { useEffect } from "react";

export const useServiceWorker = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Yangilash tekshiruvi
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Yangi versiya bor — sahifani yangilash taklif qilish mumkin
              console.log("[SW] Yangi versiya tayyor");
            }
          });
        });

        // SW dan kelgan xabarlarni tinglash (sync signal)
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "sync-requested") {
            // lib/sync.ts dagi syncPendingActions ni chaqirish
            import("@/lib/sync").then(({ syncPendingActions }) => {
              syncPendingActions();
            });
          }
        });
      } catch (err) {
        console.warn("[SW] Ro'yxatdan o'tkazishda xato:", err);
      }
    };

    // Sahifa yuklangandan keyin ro'yxatdan o'tkazish
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);
};
