/**
 * lib/api/index.ts
 *
 * Barcha API so'rovlar shu fayldan import qilinadi:
 *   import { authApi, orderApi, tableApi } from "@/lib/api"
 *
 * Eski "@/lib/services" import yo'llari ham qo'llab-quvvatlanadi
 * (services.ts endi shu faylni re-export qiladi — breaking change yo'q).
 */
export { default as apiClient } from "./client";

export { authApi } from "./auth";
export { adminApi } from "./admin";
export { staffApi } from "./staff";
export { productApi } from "./products";
export { tableApi } from "./tables";
export { orderApi, cashierOrderApi } from "./orders";
export {
  paymentApi,
  archiveApi,
  dashboardApi,
  restaurantApi,
  customRoleApi,
  customProductTypeApi,
  inventoryApi,
  menuApi,
  settingsApi,
  earningsApi,
  cashierApi,
  reportsApi,
  staffMealApi,
} from "./misc";
