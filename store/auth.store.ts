import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Role, ProductType } from "@/types";

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict${secure}`;
};

const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  canPrepare: (type: ProductType) => boolean;
}

const ROLE_PRODUCT_MAP: Record<string, ProductType> = {
  cook: "food",
  baker: "bread",
  somsa_maker: "somsa",
  grill_master: "grill",
  turkish_cook: "turkish",
  bartender: "drink",
  icecream_maker: "icecream",
  tea_master: "tea",
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,

      setUser: (user) => {
        // access_token — memory + cookie (middleware JWT verify uchun)
        setCookie("access_token", user.access_token, 1); // 1 kun — qisqa muddat
        setCookie("refresh_token", user.refresh_token, 7);
        setCookie("user_role", user.role, 7);
        setCookie("is_authenticated", "true", 7);

        // localStorage dan tozalash (eski versiya qoldig'i)
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }

        set({ user, isAuthenticated: true, accessToken: user.access_token });
      },

      setAccessToken: (token) => {
        // Memory + cookie ga yangilash — middleware uchun
        setCookie("access_token", token, 1);
        set({ accessToken: token });
      },

      logout: async () => {
        try {
          const refreshToken = getCookie("refresh_token");
          if (refreshToken) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ refresh_token: refreshToken }),
            });
          }
        } catch {
          // Tarmoq xatosida ham tozalanadi
        } finally {
          deleteCookie("access_token");
          deleteCookie("refresh_token");
          deleteCookie("user_role");
          deleteCookie("is_authenticated");
          localStorage.removeItem("auth-storage");
          set({ user: null, isAuthenticated: false, accessToken: null });
        }
      },

      hasRole: (...roles) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },

      canPrepare: (type) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === "manager") return true;
        const mainType = ROLE_PRODUCT_MAP[user.role];
        return (
          mainType === type || (user.extra_permissions || []).includes(type)
        );
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // accessToken persist QILINMAYDI — sahifa yangilanganda refresh orqali tiklanadi
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
