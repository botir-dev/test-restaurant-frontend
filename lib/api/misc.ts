import api from "./client";
import type { PaymentType } from "@/types";

// ─── PAYMENTS ───────────────────────────────────────────────────
export const paymentApi = {
  process: (orderId: string, payment_type: PaymentType) =>
    api.post(`/payments/${orderId}`, { payment_type }),
  getCheck: (orderId: string) =>
    api.get(`/payments/${orderId}/check`, { responseType: "text" }),
};

// ─── ARCHIVE ────────────────────────────────────────────────────
export const archiveApi = {
  getAll: (params?: {
    period?: string;
    from?: string;
    to?: string;
    waiter?: string;
    cashier?: string;
    table_number?: number;
    page?: number;
    limit?: number;
  }) => api.get("/archive", { params }),
  getRevenue: (params?: { period?: string; from?: string; to?: string }) =>
    api.get("/archive/revenue", { params }),
};

// ─── DASHBOARD ──────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get("/dashboard"),
};

// ─── RESTAURANT ─────────────────────────────────────────────────
export const restaurantApi = {
  getMe: () => api.get("/restaurants/me"),
};

// ─── CUSTOM ROLES ────────────────────────────────────────────────
export const customRoleApi = {
  getAll: () => api.get("/manager/custom-roles"),
  create: (data: { key: string; label: string; product_type_key?: string }) =>
    api.post("/manager/custom-roles", data),
  delete: (id: string) => api.delete(`/manager/custom-roles/${id}`),
};

// ─── CUSTOM PRODUCT TYPES ────────────────────────────────────────
export const customProductTypeApi = {
  getAll: () => api.get("/manager/custom-product-types"),
  create: (data: { key: string; label: string }) =>
    api.post("/manager/custom-product-types", data),
  delete: (id: string) => api.delete(`/manager/custom-product-types/${id}`),
};

// ─── INVENTORY ───────────────────────────────────────────────────
export const inventoryApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get("/inventory", { params }),
  create: (data: {
    name: string;
    unit: string;
    custom_unit?: string;
    quantity?: number;
    min_quantity?: number;
    image_url?: string;
    cost_price?: number | null;
  }) => api.post("/inventory", data),
  update: (
    id: string,
    data: {
      name?: string;
      unit?: string;
      custom_unit?: string;
      quantity?: number;
      min_quantity?: number;
      image_url?: string;
      cost_price?: number | null;
    },
  ) => api.put(`/inventory/${id}`, data),
  addStock: (id: string, amount: number, cost_price?: number | null) =>
    api.patch(`/inventory/${id}/add`, { amount, cost_price }),
  delete: (id: string) => api.delete(`/inventory/${id}`),
  getLogs: (params?: { item_id?: string; page?: number; limit?: number }) =>
    api.get("/inventory/logs", { params }),
};

// ─── MENU ────────────────────────────────────────────────────────
export const menuApi = {
  getAll: (params?: {
    type?: string;
    is_available?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get("/menu", { params }),
  create: (data: {
    name: string;
    price: number;
    type: string;
    image_url?: string;
    is_available?: boolean;
    recipe?: { inventory_item_id: string; quantity: number }[];
  }) => api.post("/menu", data),
  update: (
    id: string,
    data: {
      name?: string;
      price?: number;
      type?: string;
      image_url?: string;
      is_available?: boolean;
      recipe?: { inventory_item_id: string; quantity: number }[];
    },
  ) => api.put(`/menu/${id}`, data),
  delete: (id: string) => api.delete(`/menu/${id}`),
  toggleAvailability: (id: string, is_available: boolean) =>
    api.patch(`/menu/${id}/availability`, { is_available }),
};

// ─── SETTINGS ────────────────────────────────────────────────────
export const settingsApi = {
  get: () => api.get("/manager/settings"),
  update: (body: Record<string, unknown>) => api.put("/manager/settings", body),
  getBranchSettings: () => api.get("/branches/me/settings"),
};

// ─── EARNINGS ────────────────────────────────────────────────────
export const earningsApi = {
  getMyEarnings: (date?: string) =>
    api.get("/branches/me/earnings", { params: { date } }),
  getWaiterEarnings: (date?: string) =>
    api.get("/manager/waiter-earnings", { params: { date: date } }),
};

// ─── CASHIER ─────────────────────────────────────────────────────
export const cashierApi = {
  getOrders: () => api.get("/orders/cashier"),
};

// ─── REPORTS ─────────────────────────────────────────────────────
export const reportsApi = {
  get: (type: string, params = "") =>
    api.get(`/archive/reports/${type}${params}`).then((r) => r.data.data),
  getExpenses30: (query: string) =>
    api.get(`/archive/reports/expenses-30${query}`).then((r) => r.data.data),
  getLast30Extended: () =>
    api.get(`/archive/reports/last-30-extended`).then((r) => r.data.data),
};

// ─── STAFF MEALS ─────────────────────────────────────────────────
export const staffMealApi = {
  getAll: (params?: {
    from?: string;
    to?: string;
    menu_item_id?: string;
    page?: number;
    limit?: number;
  }) => api.get("/staff-meals", { params }),
  create: (data: { menu_item_id: string; quantity: number; note?: string }) =>
    api.post("/staff-meals", data),
  delete: (id: string) => api.delete(`/staff-meals/${id}`),
  getReport: (params?: { from?: string; to?: string }) =>
    api.get("/staff-meals/report", { params }).then((r) => r.data.data),
};
