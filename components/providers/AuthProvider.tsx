"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";

/**
 * AuthProvider — faqat accessToken memory ga tiklanganligini ta'minlaydi.
 *
 * Silent refresh endi middleware → /silent-refresh sahifasi orqali ishlaydi.
 * Bu provider faqat: store da accessToken yo'q bo'lsa cookie dan oladi.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // accessToken memory da bor — hech narsa qilmaymiz
    // accessToken yo'q va isAuthenticated ham yo'q — silent-refresh sahifasi handle qilgan
    // Bu provider faqat log/monitoring uchun qoldirilgan
  }, []);

  return <>{children}</>;
}
