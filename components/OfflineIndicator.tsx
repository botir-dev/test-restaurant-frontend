"use client";
import { useOffline } from "@/hooks/useOffline";
import { Wifi, WifiOff, RefreshCw, Clock } from "lucide-react";
import clsx from "clsx";

export default function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, manualSync } = useOffline();

  // Online va pending yo'q — hech narsa ko'rsatma
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={clsx(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg",
        "text-sm font-semibold transition-all duration-300",
        isOnline
          ? "bg-amber-500 text-white" // Online lekin pending bor
          : "bg-red-500 text-white", // Offline
      )}
    >
      {isOnline ? (
        <Wifi className="w-4 h-4 flex-shrink-0" />
      ) : (
        <WifiOff className="w-4 h-4 flex-shrink-0" />
      )}

      {!isOnline && <span>Offline rejim</span>}

      {pendingCount > 0 && (
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {pendingCount} ta kutmoqda
        </span>
      )}

      {isOnline && pendingCount > 0 && (
        <button
          onClick={manualSync}
          disabled={isSyncing}
          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded-xl px-2 py-1 transition-all"
        >
          <RefreshCw
            className={clsx("w-3.5 h-3.5", isSyncing && "animate-spin")}
          />
          {isSyncing ? "Yuborilmoqda..." : "Yuborish"}
        </button>
      )}
    </div>
  );
}
