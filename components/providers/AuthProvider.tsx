"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { LoadingScreen } from "@/components/ui";

/** Login/Register kabi public sahifalar — token bo'lsa kirishni bloklash */
const PUBLIC_ONLY_PATHS = ["/login", "/register"];
/** Har kim ko'ra oladigan sahifalar (token tekshirilmaydi) */
const ALWAYS_PUBLIC = ["/menu", "/qr", "/silent-refresh"];

const ROLE_HOME: Record<string, string> = {
  super_admin: "/admin",
  manager: "/dashboard",
  waiter: "/tables",
  cashier: "/cashier",
  storekeeper: "/inventory",
};

/**
 * AuthProvider — 3 ta vazifani bajaradi:
 *
 * 1. Sahifa yangilanganda (Ctrl+R) access_token yo'q bo'lsa,
 *    refresh endpoint orqali tiklab, keyin children render qiladi.
 *    (children bloklanadi — 401 loop yo'q)
 *
 * 2. TOKEN BOR + /login yoki /register ga kirishga urinish →
 *    foydalanuvchini uning role ga mos sahifaga yo'naltiradi.
 *    (Qo'l bilan URL yozib /login ga o'tib bo'lmaydi)
 *
 * 3. Public sahifalar (/menu, /qr) uchun refresh urinilmaydi — tez yuklanadi.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, setAccessToken, logout, user } = useAuthStore();
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const init = async () => {
      const isAlwaysPublic = ALWAYS_PUBLIC.some((p) => pathname.startsWith(p));
      const isPublicOnly = PUBLIC_ONLY_PATHS.some((p) =>
        pathname.startsWith(p),
      );

      // ── Har kim ko'ra oladigan sahifalar — refresh ham shart emas ──
      if (isAlwaysPublic) {
        setReady(true);
        return;
      }

      // ── Token bor ──────────────────────────────────────────────────
      if (accessToken) {
        // /login yoki /register ga token bilan kirmoqchi bo'lsa — yo'naltir
        if (isPublicOnly && user) {
          const home = ROLE_HOME[user.role] ?? "/kitchen";
          router.replace(home);
          return; // ready=false saqlanadi — redirect tugaguncha loading ko'rinadi
        }
        setReady(true);
        return;
      }

      // ── Token yo'q, lekin public-only sahifada — ko'rsatamiz ──────
      if (isPublicOnly) {
        setReady(true);
        return;
      }

      // ── Token yo'q — refresh urinib ko'ramiz ──────────────────────
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
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
          logout();
        }
      } catch {
        logout();
      }

      setReady(true);
    };

    init();
    // pathname o'zgarganda ham qayta ishga tushirish kerak
    // (masalan, /login ga manual navigate qilinsa)
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <LoadingScreen />;

  return <>{children}</>;
}
