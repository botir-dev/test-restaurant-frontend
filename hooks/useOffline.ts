"use client";
import { useState, useEffect, useCallback } from "react";
import { getPendingCount } from "@/lib/offline-db";
import { startAutoSync, syncPendingActions } from "@/lib/sync";
import toast from "react-hot-toast";

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Pending amallar sonini yangilash
  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  // Qo'lda sync bosish
  const manualSync = useCallback(async () => {
    if (!navigator.onLine) {
      toast.error("Internet yo'q. Ulanishni kuting.");
      return;
    }
    setIsSyncing(true);
    try {
      const result = await syncPendingActions();
      await refreshPendingCount();
      if (result.synced > 0) {
        toast.success(`${result.synced} ta amal muvaffaqiyatli yuborildi!`);
      }
      if (result.failed > 0) {
        toast.error(
          `${result.failed} ta amal yuborilmadi. Qayta urinib ko'ring.`,
        );
      }
      if (result.synced === 0 && result.failed === 0) {
        toast.success("Hamma narsa sync qilingan!");
      }
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Internet ulanish tiklandi!", { icon: "🟢" });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast("Offline rejimda ishlayapsiz", {
        icon: "🔴",
        duration: 4000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Auto sync — internet qaytganda
    const stopAutoSync = startAutoSync(async (result) => {
      await refreshPendingCount();
      if (result.synced > 0) {
        toast.success(`✅ ${result.synced} ta offline amal yuborildi!`);
      }
      if (result.failed > 0) {
        toast.error(`❌ ${result.failed} ta amal yuborilmadi`);
      }
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      stopAutoSync();
    };
  }, [refreshPendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    manualSync,
    refreshPendingCount,
  };
};
