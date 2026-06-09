import apiClient from "./client";

export interface TariffFeature {
  key: string;
  label: string;
  enabled: boolean;
  locked: boolean;
}

export interface BranchTariff {
  id: string;
  branch_id: string;
  tariff_type: "light" | "standard" | "premium" | null;
  status:
    | "active"
    | "grace_period"
    | "expired"
    | "not_available"
    | "pending"
    | null;
  starts_at: string | null;
  expires_at: string | null;
  grace_ends_at: string | null;
  note: string | null;
  updated_at: string;
  branch_name?: string;
  restaurant_name?: string;
  definition_name?: string;
  assigned_by_name?: string;
}

export interface MyTariffResponse {
  tariff: BranchTariff | null;
  features: TariffFeature[];
  is_active: boolean;
}

export interface TariffLog {
  id: string;
  target_type: string;
  target_id: string;
  action: string;
  old_tariff: string | null;
  new_tariff: string | null;
  old_status: string | null;
  new_status: string | null;
  old_expires_at: string | null;
  new_expires_at: string | null;
  performed_by_name: string | null;
  note: string | null;
  created_at: string;
}

// ─── FILIAL: O'z tarif holati ────────────────────────────────
export const getMyTariff = async (): Promise<MyTariffResponse> => {
  const res = await apiClient.get("/tariffs/my");
  return res.data.data;
};

// ─── SUPERADMIN: Kalit boshqaruvi ────────────────────────────
export const getTariffConfig = async () => {
  const res = await apiClient.get("/tariffs/config");
  return res.data.data;
};

export const setTariffConfig = async (payload: {
  new_secret_key: string;
  current_secret_key?: string;
}) => {
  const res = await apiClient.post("/tariffs/config", payload);
  return res.data;
};

// ─── SUPERADMIN: Filial tariflari ────────────────────────────
export const getBranchTariffs = async (restaurant_id?: string) => {
  const res = await apiClient.get("/tariffs/branches", {
    params: restaurant_id ? { restaurant_id } : undefined,
  });
  return res.data.data as BranchTariff[];
};

export const getBranchTariffDetail = async (branchId: string) => {
  const res = await apiClient.get(`/tariffs/branches/${branchId}`);
  return res.data.data as {
    tariff: BranchTariff | null;
    features: TariffFeature[];
  };
};

export const assignBranchTariff = async (
  branchId: string,
  payload: {
    tariff_type: "light" | "standard";
    expires_at?: string | null;
    secret_key: string;
    note?: string;
  },
) => {
  const res = await apiClient.post(
    `/tariffs/branches/${branchId}/assign`,
    payload,
  );
  return res.data;
};

export const extendBranchTariff = async (
  branchId: string,
  payload: { new_expires_at: string; secret_key: string; note?: string },
) => {
  const res = await apiClient.put(
    `/tariffs/branches/${branchId}/extend`,
    payload,
  );
  return res.data;
};

export const revokeBranchTariff = async (
  branchId: string,
  payload: { secret_key: string; note?: string },
) => {
  const res = await apiClient.delete(`/tariffs/branches/${branchId}/revoke`, {
    data: payload,
  });
  return res.data;
};

// ─── SUPERADMIN: Restoran tariflari (premium) ─────────────────
export const getRestaurantTariff = async (restaurantId: string) => {
  const res = await apiClient.get(`/tariffs/restaurants/${restaurantId}`);
  return res.data.data;
};

export const assignRestaurantPremium = async (
  restaurantId: string,
  payload: { expires_at?: string | null; secret_key: string; note?: string },
) => {
  const res = await apiClient.post(
    `/tariffs/restaurants/${restaurantId}/assign`,
    payload,
  );
  return res.data;
};

export const extendRestaurantTariff = async (
  restaurantId: string,
  payload: { new_expires_at: string; secret_key: string; note?: string },
) => {
  const res = await apiClient.put(
    `/tariffs/restaurants/${restaurantId}/extend`,
    payload,
  );
  return res.data;
};

// ─── Loglar ──────────────────────────────────────────────────
export const getTariffLogs = async (params?: {
  target_id?: string;
  target_type?: string;
  limit?: number;
}) => {
  const res = await apiClient.get("/tariffs/logs", { params });
  return res.data.data as TariffLog[];
};
