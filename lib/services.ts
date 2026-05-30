import api from "./api";
import type {
  User,
  Restaurant,
  Branch,
  Staff,
  Product,
  Table,
  Order,
  OrderItem,
  Reservation,
  ArchiveItem,
  ProductType,
  PaymentType,
  Role,
} from "@/types";

// ─── AUTH ───────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{
      success: boolean;
      data: User & { access_token: string; refresh_token: string };
    }>("/auth/login", { username, password }),

  logout: (refresh_token: string) =>
    api.post("/auth/logout", { refresh_token }),

  changePassword: (old_password: string, new_password: string) =>
    api.put("/auth/change-password", { old_password, new_password }),

  refresh: (refresh_token: string) =>
    api.post("/auth/refresh", { refresh_token }),
};

// ─── ADMIN ──────────────────────────────────────────────
export const adminApi = {
  getRestaurants: () => api.get("/admin/restaurants"),
  createRestaurant: (data: {
    name: string;
    address?: string;
    logo_url?: string;
  }) => api.post("/admin/restaurants", data),
  updateRestaurant: (id: string, data: Partial<Restaurant>) =>
    api.put(`/admin/restaurants/${id}`, data),
  deleteRestaurant: (id: string) => api.delete(`/admin/restaurants/${id}`),

  getBranches: (restaurant_id?: string) =>
    api.get("/admin/branches", { params: { restaurant_id } }),
  createBranch: (data: {
    restaurant_id: string;
    name: string;
    address?: string;
    phone?: string;
  }) => api.post("/admin/branches", data),
  updateBranch: (id: string, data: Partial<Branch>) =>
    api.put(`/admin/branches/${id}`, data),

  getManagers: (restaurant_id?: string) =>
    api.get("/admin/managers", { params: { restaurant_id } }),
  createManager: (data: {
    restaurant_id: string;
    branch_id: string;
    full_name: string;
    username: string;
    phone?: string;
    password: string;
  }) => api.post("/admin/managers", data),
  updateManager: (id: string, data: Partial<Staff & { password?: string }>) =>
    api.put(`/admin/managers/${id}`, data),
  deleteManager: (id: string) => api.delete(`/admin/managers/${id}`),
};

// ─── STAFF ──────────────────────────────────────────────
export const staffApi = {
  getAll: () => api.get("/staff"),
  create: (data: {
    full_name: string;
    username: string;
    phone?: string;
    password: string;
    role: Role;
    extra_permissions?: ProductType[];
  }) => api.post("/staff", data),
  update: (id: string, data: Partial<Staff & { password?: string }>) =>
    api.put(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
};

// ─── PRODUCTS ───────────────────────────────────────────
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

// ─── TABLES ─────────────────────────────────────────────
export const tableApi = {
  getAll: () => api.get("/tables"),
  create: (data: { table_number: number; capacity?: number }) =>
    api.post("/tables", data),
  occupy: (id: string, guest_count: number) =>
    api.patch(`/tables/${id}/occupy`, { guest_count }),
  free: (id: string) => api.patch(`/tables/${id}/free`, {}),

  getReservations: (params?: { date?: string; table_id?: string }) =>
    api.get("/tables/reservations", { params }),
  createReservation: (data: {
    table_id: string;
    full_name: string;
    phone: string;
    reserved_at: string;
    duration_min?: number;
    guest_count?: number;
  }) => api.post("/tables/reservations", data),
  cancelReservation: (id: string) => api.delete(`/tables/reservations/${id}`),
};

// ─── ORDERS ─────────────────────────────────────────────
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

// ─── PAYMENTS ───────────────────────────────────────────
export const paymentApi = {
  process: (orderId: string, payment_type: PaymentType) =>
    api.post(`/payments/${orderId}`, { payment_type }),
  getCheck: (orderId: string) =>
    api.get(`/payments/${orderId}/check`, { responseType: "text" }),
};

// ─── ARCHIVE ────────────────────────────────────────────
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

// ─── DASHBOARD ──────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get("/dashboard"),
};

// ─── CUSTOM ROLES ────────────────────────────────────────
export const customRoleApi = {
  getAll: () => api.get("/manager/custom-roles"),
  create: (data: { key: string; label: string; product_type_key?: string }) =>
    api.post("/manager/custom-roles", data),
  delete: (id: string) => api.delete(`/manager/custom-roles/${id}`),
};

// ─── CUSTOM PRODUCT TYPES ────────────────────────────────
export const customProductTypeApi = {
  getAll: () => api.get("/manager/custom-product-types"),
  create: (data: { key: string; label: string }) =>
    api.post("/manager/custom-product-types", data),
  delete: (id: string) => api.delete(`/manager/custom-product-types/${id}`),
};

// ─── INVENTORY ────────────────────────────────────────────────
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

// ─── MENU ──────────────────────────────────────────────────────
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
