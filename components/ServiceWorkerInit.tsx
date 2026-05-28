"use client";
import { useServiceWorker } from "@/hooks/useServiceWorker";

// Server component bo'lgan layout.tsx da hook ishlatib bo'lmaydi
// Shuning uchun alohida client component
export default function ServiceWorkerInit() {
  useServiceWorker();
  return null;
}
