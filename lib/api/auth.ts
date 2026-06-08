import api from "./client";
import type { User } from "@/types";

export const authApi = {
  login: (username: string, password: string, device_token?: string) =>
    api.post<{
      success: boolean;
      data: User & {
        access_token: string;
        refresh_token: string;
        requires_2fa?: boolean;
        user_id?: string;
      };
    }>("/auth/login", { username, password, device_token }),

  verifyOtp: (user_id: string, code: string, trust_device: boolean) =>
    api.post<{
      success: boolean;
      data: User & { access_token: string; device_token?: string };
    }>("/auth/verify-otp", { user_id, code, trust_device }),

  logout: (refresh_token: string) =>
    api.post("/auth/logout", { refresh_token }),

  changePassword: (old_password: string, new_password: string) =>
    api.put("/auth/change-password", { old_password, new_password }),

  refresh: () => api.post("/auth/refresh", {}),
};
