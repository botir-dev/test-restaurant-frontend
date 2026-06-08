import api from "./client";
import type { OrderItem } from "@/types";

export const orderApi = {
  getAll: (params?: { status?: string }) => api.get("/orders", { params }),
  create: (data: {
    table_id: string;
    guest_count?: number;
    items: { product_id: string; quantity: number }[];
    waiter_id?: string;
    is_from_qr?: boolean;
  }) => api.post("/orders", data),
  update: (id: string, data: { items?: OrderItem[]; guest_count?: number }) =>
    api.put(`/orders/${id}`, data),
  sendToKitchen: (id: string) => api.patch(`/orders/${id}/send`, {}),
  complete: (id: string) => api.patch(`/orders/${id}/complete`, {}),
  prepareItem: (orderId: string, itemId: string) =>
    api.patch(`/orders/${orderId}/items/${itemId}/prepare`, {}),
  cancel: (id: string) => api.delete(`/orders/${id}`),

  // QR orqali buyurtma (public)
  createQrOrder: (data: {
    branch_id: string;
    table_id: string;
    waiter_id: string;
    items: { product_id: string; quantity: number }[];
    guest_count?: number;
  }) => api.post("/public/orders", data),

  getPublicWaiters: (branch_id: string) =>
    api.get(`/public/waiters/${branch_id}`),
};

export const cashierOrderApi = {
  create: (data: {
    items: { product_id: string; quantity: number }[];
    order_type: "takeaway" | "delivery";
    guest_count?: number;
    note?: string;
  }) => api.post("/orders/cashier", data),
};
