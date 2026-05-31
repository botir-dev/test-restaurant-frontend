"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";
import {
  Settings,
  Percent,
  Save,
  Loader2,
  Users,
  TrendingUp,
  Receipt,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "@/lib/api";
import { customRoleApi } from "@/lib/services";
import { formatPrice } from "@/lib/utils";

const BASE_COMMISSION_ROLES = [
  "cashier",
  "storekeeper",
  "cook",
  "baker",
  "somsa_maker",
  "grill_master",
  "turkish_cook",
  "bartender",
  "icecream_maker",
  "tea_master",
  "manager",
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-green-500" : "bg-gray-200"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </label>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: customRolesData } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: () => customRoleApi.getAll(),
  });
  const customRoles: any[] = customRolesData?.data?.data || [];
  const COMMISSION_ROLES = [
    ...BASE_COMMISSION_ROLES,
    ...customRoles.map((r: any) => r.key),
  ];

  const ROLE_LABELS: Record<string, string> = {
    ...Object.fromEntries(customRoles.map((r: any) => [r.key, r.name])),
    cashier: "Kassir",
    storekeeper: "Omborchi",
    cook: "Oshpaz",
    baker: "Novvoy",
    somsa_maker: "Somsa ustasi",
    grill_master: "Grill ustasi",
    turkish_cook: "Turk oshpazi",
    bartender: "Barmen",
    icecream_maker: "Muzqaymoq ustasi",
    tea_master: "Choy ustasi",
    manager: "Menejer",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["manager-settings"],
    queryFn: () => api.get("/manager/settings"),
  });

  const settings = data?.data?.data;

  const [serviceFeeEnabled, setServiceFeeEnabled] = useState(false);
  const [serviceFee, setServiceFee] = useState("0");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatPercent, setVatPercent] = useState("12");
  const [waiterCommission, setWaiterCommission] = useState("0");
  const [roleCommissions, setRoleCommissions] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (settings) {
      setServiceFeeEnabled(settings.service_fee_enabled || false);
      setServiceFee(String(settings.service_fee_percent || 0));
      setVatEnabled(settings.vat_enabled || false);
      setVatPercent(String(settings.vat_percent || 12));
      setWaiterCommission(String(settings.waiter_commission_percent || 0));
      const rc = settings.role_commissions || {};
      const mapped: Record<string, string> = {};
      COMMISSION_ROLES.forEach((r) => {
        mapped[r] = rc[r] !== undefined ? String(rc[r]) : "0";
      });
      setRoleCommissions(mapped);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put("/manager/settings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-settings"] });
      toast.success("Sozlamalar saqlandi!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const handleSave = () => {
    const sfp = parseFloat(serviceFee);
    const vp = parseFloat(vatPercent);
    const wcp = parseFloat(waiterCommission);
    if (isNaN(sfp) || sfp < 0 || sfp > 100) {
      toast.error("Xizmat haqi 0-100% orasida bo'lishi kerak");
      return;
    }
    if (isNaN(vp) || vp < 0 || vp > 100) {
      toast.error("QQS 0-100% orasida bo'lishi kerak");
      return;
    }
    const rc: Record<string, number> = {};
    for (const role of COMMISSION_ROLES) {
      const v = parseFloat(roleCommissions[role] || "0");
      if (!isNaN(v) && v >= 0) rc[role] = v;
    }
    updateMutation.mutate({
      service_fee_percent: sfp,
      service_fee_enabled: serviceFeeEnabled,
      vat_percent: vp,
      vat_enabled: vatEnabled,
      waiter_commission_percent: wcp,
      role_commissions: rc,
    });
  };

  // Earnings section
  const today = new Date().toISOString().split("T")[0];
  const [earningsDate, setEarningsDate] = useState(today);
  const [showRoleCommissions, setShowRoleCommissions] = useState(false);

  const { data: earningsData } = useQuery({
    queryKey: ["waiter-earnings", earningsDate],
    queryFn: () =>
      api.get("/manager/waiter-earnings", { params: { date: earningsDate } }),
  });
  const earnings: any[] = earningsData?.data?.data || [];

  if (user?.role !== "manager") {
    return (
      <div className="text-center py-16 text-gray-400">
        <Settings className="w-10 h-10 mx-auto mb-2" />
        <p>Bu sahifa faqat menejer uchun</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-blue-600" />
        </div>
        <h1 className="page-title">Filial sozlamalari</h1>
      </div>

      {/* Foiz sozlamalari */}
      <div className="card space-y-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <Percent className="w-4 h-4 text-blue-600" />
          Foiz sozlamalari
        </h2>

        <div className="space-y-5">
          {/* Xizmat haqi */}
          <div className="space-y-2">
            <Toggle
              checked={serviceFeeEnabled}
              onChange={setServiceFeeEnabled}
              label="Xizmat haqi foizini yoqish"
            />
            <div
              className={
                serviceFeeEnabled ? "" : "opacity-40 pointer-events-none"
              }
            >
              <label className="label">
                Xizmat haqi foizi (%)
                <span className="text-xs text-gray-400 font-normal ml-2">
                  — har bir buyurtma summasiga qo'shiladi
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="input pr-10"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(e.target.value)}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                  %
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Misol: buyurtma 100 000 so'm, xizmat haqi 10% → mijoz 110 000
                so'm to'laydi
              </p>
            </div>
          </div>

          {/* QQS */}
          <div className="space-y-2">
            <Toggle
              checked={vatEnabled}
              onChange={setVatEnabled}
              label="QQS (Qo'shilgan qiymat solig'i) ni yoqish"
            />
            <div className={vatEnabled ? "" : "opacity-40 pointer-events-none"}>
              <label className="label">
                QQS foizi (%)
                <span className="text-xs text-gray-400 font-normal ml-2">
                  — O'zbekiston standart QQS 12%
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="input pr-10"
                  value={vatPercent}
                  onChange={(e) => setVatPercent(e.target.value)}
                  placeholder="12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                  %
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Misol: buyurtma 100 000 so'm, QQS 12% → mijoz 112 000 so'm
                to'laydi. Chekda ko'rsatiladi.
              </p>
            </div>
          </div>

          {/* Ofitsiant komissiyasi */}
          <div>
            <label className="label">
              Ofitsiant komissiyasi (%)
              <span className="text-xs text-gray-400 font-normal ml-2">
                — har kuni ofitsiant maoshiga qo'shiladi
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="input pr-10"
                value={waiterCommission}
                onChange={(e) => setWaiterCommission(e.target.value)}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                %
              </span>
            </div>
          </div>

          {/* Boshqa rollar komissiyasi */}
          <div>
            <button
              type="button"
              onClick={() => setShowRoleCommissions((p) => !p)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
            >
              {showRoleCommissions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Boshqa rollar komissiyasi (%)
            </button>
            {showRoleCommissions && (
              <div className="mt-3 space-y-3 bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">
                  Har bir to'lovdan xodimga % komissiya. Xodimda "foizda
                  hisoblash" yoqilgan bo'lishi kerak.
                </p>
                {COMMISSION_ROLES.map((role) => (
                  <div key={role} className="flex items-center gap-3">
                    <label className="text-sm text-gray-700 w-40 flex-shrink-0">
                      {ROLE_LABELS[role] || role}
                    </label>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        className="input py-1.5 pr-8 text-sm"
                        value={roleCommissions[role] || "0"}
                        onChange={(e) =>
                          setRoleCommissions((p) => ({
                            ...p,
                            [role]: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="btn-primary"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Saqlash
        </button>
      </div>

      {/* Xodimlar maoshi */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            Xodimlar maoshi
          </h2>
          <input
            type="date"
            className="input text-sm py-1.5 w-auto"
            value={earningsDate}
            onChange={(e) => setEarningsDate(e.target.value)}
          />
        </div>

        {earnings.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Bu kunda ma'lumot yo'q</p>
          </div>
        ) : (
          <div className="space-y-2">
            {earnings.map((e: any) => (
              <div
                key={e.user_id || e.waiter_id}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {e.user_name || e.waiter_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {ROLE_LABELS[e.role] || e.role} · {e.total_orders} buyurtma
                    · {formatPrice(e.total_order_amount)} jami savdo ·{" "}
                    {e.commission_percent}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatPrice(e.earned_amount)}
                  </p>
                  <p className="text-xs text-gray-400">komissiya</p>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700">
                Jami komissiya maoshi:
              </span>
              <span className="font-bold text-green-700">
                {formatPrice(
                  earnings.reduce(
                    (s: number, e: any) => s + parseFloat(e.earned_amount || 0),
                    0,
                  ),
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
