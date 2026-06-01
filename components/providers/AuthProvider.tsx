"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";

/**
 * AuthProvider — Ctrl+R da sahifa qayta yuklanganida
 * access_token memory da yo'q bo'lsa, refresh orqali tiklab,
 * keyin children ni render qiladi.
 *
 * Bu komponent children ni BLOKLAYDI — token tiklanmaguncha
 * hech bir sahifa component mount bo'lmaydi →
 * API so'rovlari ham ketmaydi → 401 loop yo'q!
 *
 * MUHIM: isAuthenticated (localStorage) ga emas, har doim refresh
 * urinib ko'ramiz. Chunki:
 * - isAuthenticated false bo'lib qolishi mumkin (boshqa tab, clear storage)
 * - Lekin refresh_token cookie (HttpOnly, SameSite=None) hali amal qilayotgan bo'lishi mumkin
 * - Agar refresh_token yo'q bo'lsa, backend 401 qaytaradi — logout.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, setAccessToken, logout } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // 1) accessToken memory da bor — hech narsa kerak emas
      if (accessToken) {
        setReady(true);
        return;
      }

      // 2) Token yo'q — refresh urinib ko'ramiz (har doim).
      //    isAuthenticated tekshirmaymiz — cross-site cookie (SameSite=None)
      //    bilan refresh_token mavjudligini faqat backend biladi.
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // refresh_token HttpOnly cookie avtomatik
            body: JSON.stringify({}),
          },
        );

        if (res.ok) {
          const data = await res.json();
          if (data?.data?.access_token) {
            setAccessToken(data.data.access_token);
          } else {
            logout();
          }
        } else {
          // 401 — foydalanuvchi tizimga kirmagan yoki token muddati o'tgan
          logout();
        }
      } catch {
        // Tarmoq xatosi — logout qilamiz
        logout();
      }

      // 3) Hammasi bo'ldi — children ni ko'rsatish mumkin
      setReady(true);
    };

    init();
  }, []); // faqat bir marta — mount da

  // Token tiklanguncha loading ko'rsatamiz
  // Bu sahifa komponentlarining mount bo'lishini to'xtatadi
  // → useQuery lar ishlamaydi → 401 so'rovlar ketmaydi
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
