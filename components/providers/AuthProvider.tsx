"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { LoadingScreen } from "@/components/ui";
import { getHome } from "@/lib/auth-constants";

const PUBLIC_ONLY_PATHS = ["/login", "/register"];

const ALWAYS_PUBLIC = ["/menu", "/qr", "/silent-refresh"];
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

      if (isAlwaysPublic) {
        setReady(true);
        return;
      }

      if (accessToken) {
        if (isPublicOnly && user) {
          router.replace(getHome(user.role));
        }
        setReady(true);
        return;
      }

      if (isPublicOnly) {
        setReady(true);
        return;
      }

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
  }, [pathname]);

  if (!ready) return <LoadingScreen />;

  return <>{children}</>;
}
