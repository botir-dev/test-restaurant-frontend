/**
 * lib/query-keys.ts
 *
 * React Query cache kalitlari — bitta joyda.
 *
 * Afzalliklari:
 * - Typo xatolari yo'q (string o'rniga const)
 * - Invalidate qilish oson — qaysi sahifada ishlatilganini qidirish shart emas
 * - Prefetch va optimistic update da ham ishlatsa bo'ladi
 *
 * @example
 * import { QK } from "@/lib/query-keys";
 * useQuery({ queryKey: QK.tables })
 * queryClient.invalidateQueries({ queryKey: QK.tables })
 */

export const QK = {
  // Auth / Restaurant
  restaurantMe: ["restaurant-me"] as const,

  // Tables
  tables: ["tables"] as const,
  reservations: (params?: object) =>
    params ? ["reservations", params] : ["reservations"],

  // Orders
  orders: (params?: object) =>
    params ? ["orders", params] : (["orders"] as const),
  order: (id: string) => ["order", id] as const,

  // Kitchen
  kitchen: ["kitchen-orders"] as const,

  // Products / Menu
  products: (params?: object) =>
    params ? ["products", params] : (["products"] as const),
  menu: (params?: object) => (params ? ["menu", params] : (["menu"] as const)),
  publicMenu: (branchId: string, params?: object) =>
    params ? ["public-menu", branchId, params] : ["public-menu", branchId],

  // Staff
  staff: ["staff"] as const,
  customRoles: ["custom-roles"] as const,
  customProductTypes: ["custom-product-types"] as const,

  // Dashboard & Reports
  dashboard: ["dashboard"] as const,
  revenue: (period: string) => ["revenue", period] as const,
  archive: (params?: object) =>
    params ? ["archive", params] : (["archive"] as const),
  reports: (type: string, params?: string) =>
    params ? ["reports", type, params] : ["reports", type],

  // Inventory
  inventory: (params?: object) =>
    params ? ["inventory", params] : (["inventory"] as const),
  inventoryLogs: (params?: object) =>
    params ? ["inventory-logs", params] : (["inventory-logs"] as const),

  // Settings
  settings: ["settings"] as const,
  branchSettings: ["branch-settings"] as const,

  // Earnings
  earnings: (date?: string) =>
    date ? ["earnings", date] : (["earnings"] as const),
  waiterEarnings: (date?: string) =>
    date ? ["waiter-earnings", date] : (["waiter-earnings"] as const),
  cashierOrders: ["cashier-orders"] as const,

  // QR / Public
  publicWaiters: (branchId: string) => ["public-waiters", branchId] as const,
} as const;
