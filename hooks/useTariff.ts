"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyTariff, TariffFeature } from "@/lib/api/tariff";
import { useAuthStore } from "@/store/auth.store";

/**
 * Filial xodimlari uchun — o'z tarif holati va imkoniyatlarini olish.
 * Super admin va owner uchun har doim true qaytaradi.
 */
export const useTariff = () => {
  const { user } = useAuthStore();

  const isAdminOrOwner = user?.role === "super_admin" || user?.role === "owner";

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-tariff", user?.branch_id],
    queryFn: getMyTariff,
    enabled: !!user && !isAdminOrOwner,
    staleTime: 5 * 60 * 1000, // 5 daqiqa cache
    refetchInterval: 10 * 60 * 1000, // 10 daqiqada yangilash
  });

  /**
   * Bitta feature aktiv ekanligini tekshiradi
   * Super admin / owner uchun har doim true
   */
  const hasFeature = (featureKey: string): boolean => {
    if (isAdminOrOwner) return true;
    if (!data) return false;
    const feature = data.features.find(
      (f: TariffFeature) => f.key === featureKey,
    );
    return feature?.enabled === true;
  };

  /**
   * Tarif umuman faol ekanligini qaytaradi
   */
  const isTariffActive = (): boolean => {
    if (isAdminOrOwner) return true;
    return data?.is_active === true;
  };

  return {
    tariff: data?.tariff ?? null,
    features: data?.features ?? [],
    isActive: isTariffActive(),
    hasFeature,
    isLoading: !isAdminOrOwner && isLoading,
    tariffType: data?.tariff?.tariff_type ?? null,
    tariffStatus: data?.tariff?.status ?? null,
  };
};
