import api from "./client";
import type { Product, ProductType } from "@/types";

export const productApi = {
  getAll: (params?: {
    type?: ProductType;
    is_available?: boolean;
    page?: number;
    limit?: number;
  }) => api.get("/products", { params }),
  create: (data: {
    name: string;
    price: number;
    type: ProductType;
    image_url?: string;
  }) => api.post("/products", data),
  update: (id: string, data: Partial<Product>) =>
    api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  toggleAvailability: (id: string, is_available: boolean) =>
    api.patch(`/products/${id}/availability`, { is_available }),
  getPublicMenu: (
    branch_id: string,
    params?: { type?: string; page?: number; limit?: number },
  ) => api.get(`/public/menu/${branch_id}`, { params }),
  getPublicMenuItems: (branch_id: string, params?: { type?: string }) =>
    api.get(`/public/menu-items/${branch_id}`, { params }),
};
