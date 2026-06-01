"use client";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, setAccessToken, logout } = useAuthStore();
  const didRefresh = useRef(false);

  useEffect(() => {
    // Faqat bir marta — sahifa yuklanganda
    if (didRefresh.current) return;
    didRefresh.current = true;

    // isAuthenticated bor lekin accessToken yo'q — sahifa yangilangan
    const accessToken = useAuthStore.getState().accessToken;
    if (isAuthenticated && !accessToken) {
      // Silent refresh — refresh_token cookie avtomatik ketadi
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.access_token) {
            setAccessToken(data.data.access_token);
          } else {
            logout();
          }
        })
        .catch(() => logout());
    }
  }, []);

  return <>{children}</>;
}
