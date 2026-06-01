"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

/**
 * Silent Refresh sahifasi
 *
 * Maqsad: Ctrl+R bosqanda access_token cookie o'chib qolsa,
 * refresh_token (HttpOnly cookie) orqali yangi access_token olish va
 * foydalanuvchini kerakli sahifaga yo'naltirish.
 *
 * Oqim:
 *   middleware → /silent-refresh?from=/dashboard
 *       → /auth/refresh → yangi access_token
 *       → cookie ga o'rnatiladi
 *       → /dashboard ga redirect
 */
export default function SilentRefreshPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAccessToken, logout } = useAuthStore();

  useEffect(() => {
    const from = searchParams.get("from") || "/";

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // refresh_token HttpOnly cookie avtomatik ketadi
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.access_token) {
          // Yangi access_token — store va cookie ga
          setAccessToken(data.data.access_token);
          // Asl sahifaga qaytish
          router.replace(from);
        } else {
          // Refresh token ham yaroqsiz — login
          logout();
          router.replace("/login");
        }
      })
      .catch(() => {
        logout();
        router.replace("/login");
      });
  }, []);

  // Foydalanuvchi bu sahifani ko'rmaydi — faqat loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Yuklanmoqda...</p>
      </div>
    </div>
  );
}
