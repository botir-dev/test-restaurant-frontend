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

export interface User {
  user_id: string;
  full_name: string;
  role: Role;
  restaurant_id: string | null;
  branch_id: string | null;
  extra_permissions: ProductType[];
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
  payment_type: PaymentType;
  is_from_qr: boolean;
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
