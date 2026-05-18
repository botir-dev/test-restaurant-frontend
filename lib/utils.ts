import type { Role, ProductType, OrderStatus } from "@/types";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  manager: "Menejer",
  waiter: "Ofitsiant",
  cashier: "Kassir",
  storekeeper: "Omborchi",
  cook: "Oshpaz",
  baker: "Nonchi",
  somsa_maker: "Somsachi",
  grill_master: "Shashlikchi",
  turkish_cook: "Turk taomlari oshpazi",
  bartender: "Barmen",
  icecream_maker: "Muzqaymoqchi",
  tea_master: "Choychi",
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  food: "Taom",
  bread: "Non",
  somsa: "Somsa",
  grill: "Grill",
  turkish: "Turk taomlari",
  drink: "Ichimlik",
  icecream: "Muzqaymoq",
  tea: "Choy/Qahva",
  other: "Boshqa",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Kutilmoqda",
  preparing: "Tayyorlanmoqda",
  ready_to_serve: "Tayyor",
  payment_pending: "To'lov kutilmoqda",
  paid: "To'landi",
  cancelled: "Bekor qilindi",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  preparing: "bg-blue-100 text-blue-700",
  ready_to_serve: "bg-green-100 text-green-700",
  payment_pending: "bg-purple-100 text-purple-700",
  paid: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

export const formatDate = (date: string) =>
  new Date(date).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const PREPARER_ROLES: Role[] = [
  "cook",
  "baker",
  "somsa_maker",
  "grill_master",
  "turkish_cook",
  "bartender",
  "icecream_maker",
  "tea_master",
];

export const isPreparerRole = (role: Role) => PREPARER_ROLES.includes(role);

export const ROLE_PRODUCT_MAP: Record<string, string> = {
  cook: "food",
  baker: "bread",
  somsa_maker: "somsa",
  grill_master: "grill",
  turkish_cook: "turkish",
  bartender: "drink",
  icecream_maker: "icecream",
  tea_master: "tea",
};
