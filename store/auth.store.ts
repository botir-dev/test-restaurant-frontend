import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Role, ProductType } from "@/types";

// ─── Cookie yordamchi funksiyalar ────────────────────────────
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

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  setUser: (user: User) => void;
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
      _hasHydrated: false,

      setHasHydrated: (val) => set({ _hasHydrated: val }),

      setUser: (user) => {
        // Token lар localStorage + cookie ga saqlanadi
        localStorage.setItem("access_token", user.access_token);
        localStorage.setItem("refresh_token", user.refresh_token);

        // Middleware uchun cookie ga role yozamiz
        setCookie("user_role", user.role, 7);
        setCookie("is_authenticated", "true", 7);

        set({ user, isAuthenticated: true });
      },

      logout: async () => {
        try {
          const refresh_token = localStorage.getItem("refresh_token");
          if (refresh_token) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh_token }),
            });
          }
        } catch {
          // Tarmoq xatosida ham tozalanadi
        } finally {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("auth-storage");
          deleteCookie("user_role");
          deleteCookie("is_authenticated");
          set({ user: null, isAuthenticated: false });
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
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
