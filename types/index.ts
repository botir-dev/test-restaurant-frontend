export type Role =
  | "super_admin"
  | "manager"
  | "waiter"
  | "cashier"
  | "storekeeper"
  | "cook"
  | "baker"
  | "somsa_maker"
  | "grill_master"
  | "turkish_cook"
  | "bartender"
  | "icecream_maker"
  | "tea_master"
  | (string & {}); // Dinamik rollar uchun

export type ProductType =
  | "food"
  | "bread"
  | "somsa"
  | "grill"
  | "turkish"
  | "drink"
  | "icecream"
  | "tea"
  | "other"
  | (string & {}); // Dinamik turlar uchun

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready_to_serve"
  | "payment_pending"
  | "paid"
  | "cancelled";

export type PaymentType = "cash" | "card" | "qr_payment";

export type OrderType = "table" | "takeaway" | "delivery";

export interface User {
  user_id: string;
  full_name: string;
  role: Role;
  restaurant_id: string | null;
  branch_id: string | null;
  extra_permissions: ProductType[];
  product_type_key?: string; // Custom rol uchun — DB dan olinadi
  access_token: string;
  refresh_token: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Branch {
  id: string;
  restaurant_id: string;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
}

export interface Staff {
  id: string;
  full_name: string;
  username: string;
  phone: string;
  role: Role;
  extra_permissions: ProductType[];
  is_active: boolean;
  monthly_salary?: number | null;
  use_commission?: boolean;
  telegram_chat_id?: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  type: ProductType;
  is_available: boolean;
  image_url: string;
  created_at: string;
}

export interface Table {
  id: string;
  table_number: number;
  capacity: number;
  is_occupied: boolean;
  is_virtual: boolean;
  current_order_id: string | null;
  next_reservation?: {
    id: string;
    full_name: string;
    phone: string;
    reserved_at: string;
    duration_min: number;
  } | null;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  type: ProductType;
  quantity: number;
  is_prepared: boolean;
}

export interface Order {
  id: string;
  table_id: string;
  table_number?: number;
  waiter_id: string;
  guest_count: number;
  status: OrderStatus;
  is_from_qr: boolean;
  order_type: OrderType;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  sent_to_kitchen_at: string | null;
  paid_at: string | null;
}

export interface Reservation {
  id: string;
  table_id: string;
  table_number?: number;
  full_name: string;
  phone: string;
  reserved_at: string;
  duration_min: number;
  guest_count: number;
  status: string;
  created_by_name?: string;
}

export interface ArchiveItem {
  id: string;
  order_id: string;
  table_number: number;
  waiter_name: string;
  cashier_name: string;
  guest_count: number;
  items: OrderItem[];
  total_amount: number;
  service_fee_percent: number;
  service_fee_amount: number;
  grand_total: number;
  payment_type: PaymentType;
  is_from_qr: boolean;
  order_type: OrderType;
  service_started: string;
  service_ended: string;
  created_at: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface CustomRole {
  id: string;
  key: string;
  label: string;
  product_type_key?: string;
  created_at: string;
}

export interface CustomProductType {
  id: string;
  key: string;
  label: string;
  created_at: string;
}

export type InventoryUnit = "kg" | "L" | "dona" | "g" | "ml" | "custom";

export interface InventoryItem {
  id: string;
  name: string;
  unit: InventoryUnit;
  custom_unit?: string | null;
  quantity: number;
  min_quantity: number;
  image_url?: string | null;
  cost_price?: number | null;
  total_cost?: number | null;
  purchased_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeLine {
  id?: string;
  inventory_item_id: string;
  inventory_name?: string;
  inventory_unit?: string;
  inventory_custom_unit?: string | null;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  type: string;
  is_available: boolean;
  image_url?: string | null;
  recipe: RecipeLine[];
  created_at: string;
  updated_at: string;
}
