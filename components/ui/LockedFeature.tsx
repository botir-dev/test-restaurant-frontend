"use client";

import { Lock } from "lucide-react";
import { useTariff } from "@/hooks/useTariff";

interface LockedFeatureProps {
  featureKey: string;
  featureName?: string;
  children: React.ReactNode;
  /**
   * Qulfli ko'rinishda qanday className ishlatilsin
   * (default: opacity-50 pointer-events-none)
   */
  lockedClassName?: string;
  /**
   * true bo'lsa — kirish mumkin bo'lmasa butunlay yashiradi (ko'rsatmaydi)
   */
  hideIfLocked?: boolean;
}

/**
 * LockedFeature — tarif imkoniyatini tekshiradi.
 *
 * Agar feature mavjud bo'lsa — children ni ko'rsatadi.
 * Agar locked bo'lsa — qulf icon bilan dimmed ko'rinishda ko'rsatadi.
 *
 * Ishlatish:
 *   <LockedFeature featureKey="inventory" featureName="Ombor boshqaruvi">
 *     <InventoryPage />
 *   </LockedFeature>
 */
export const LockedFeature = ({
  featureKey,
  featureName,
  children,
  lockedClassName = "opacity-40 pointer-events-none select-none",
  hideIfLocked = false,
}: LockedFeatureProps) => {
  const { hasFeature, isLoading } = useTariff();

  if (isLoading) return null;

  const enabled = hasFeature(featureKey);

  if (!enabled && hideIfLocked) return null;

  if (!enabled) {
    return (
      <div className="relative">
        {/* Dimmed content */}
        <div className={lockedClassName}>{children}</div>

        {/* Qulf overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg px-6 py-4 flex flex-col items-center gap-2 max-w-xs text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Lock className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {featureName || "Bu funksiya cheklangan"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Bu xizmatdan foydalanish uchun yuqori tarif kerak.
              <br />
              Superadmin bilan bog'laning.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * LockedNavItem — sidebar / nav menuсidagi element uchun
 * Faqat icon va nom — full page emas
 */
interface LockedNavItemProps {
  featureKey: string;
  children: React.ReactNode;
  className?: string;
}

export const LockedNavItem = ({
  featureKey,
  children,
  className = "",
}: LockedNavItemProps) => {
  const { hasFeature, isLoading } = useTariff();

  if (isLoading) return <>{children}</>;

  const enabled = hasFeature(featureKey);

  if (!enabled) {
    return (
      <div className={`relative inline-flex items-center gap-1 ${className}`}>
        <span className="opacity-40">{children}</span>
        <Lock className="w-3 h-3 text-orange-400 flex-shrink-0" />
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * TariffBanner — grace period / not_available holatlarda banner ko'rsatadi
 */
export const TariffStatusBanner = () => {
  const { tariffStatus, tariff } = useTariff();

  if (!tariffStatus || tariffStatus === "active") return null;

  if (tariffStatus === "grace_period") {
    const graceEnd = tariff?.grace_ends_at
      ? new Date(tariff.grace_ends_at).toLocaleString("uz-UZ")
      : "";

    return (
      <div className="w-full bg-orange-500 text-white text-sm px-4 py-2 flex items-center justify-center gap-2 z-50">
        <Lock className="w-4 h-4" />
        <span>
          ⚠️ Tarif muddati tugadi. Grace period: <strong>{graceEnd}</strong>{" "}
          gacha tarifni yangilang!
        </span>
      </div>
    );
  }

  if (tariffStatus === "not_available" || tariffStatus === "expired") {
    return (
      <div className="w-full bg-red-600 text-white text-sm px-4 py-2 flex items-center justify-center gap-2 z-50">
        <Lock className="w-4 h-4" />
        <span>
          🚫 Tarif bloklangan. Tizimdan foydalanish cheklangan. Superadmin bilan
          bog'laning.
        </span>
      </div>
    );
  }

  return null;
};

export default LockedFeature;
