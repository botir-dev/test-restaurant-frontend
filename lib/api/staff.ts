import api from "./client";
import type { Staff, Role, ProductType } from "@/types";

export const staffApi = {
  getAll: () => api.get("/staff"),
  create: (data: {
    full_name: string;
    username: string;
    phone?: string;
    password: string;
    role: Role;
    extra_permissions?: ProductType[];
    telegram_chat_id?: string | null;
  }) => api.post("/staff", data),
  update: (id: string, data: Partial<Staff & { password?: string }>) =>
    api.put(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
};
