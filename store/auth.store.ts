import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Role, ProductType } from "@/types";

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
        localStorage.setItem("access_token", user.access_token);
        localStorage.setItem("refresh_token", user.refresh_token);
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.clear();
        set({ user: null, isAuthenticated: false });
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
