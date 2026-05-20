"use client";
import { useState } from "react";
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
} from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["manager-settings"],
    queryFn: () => api.get("/manager/settings"),
  });

  const settings = data?.data?.data;
  const [serviceFee, setServiceFee] = useState("");
  const [waiterCommission, setWaiterCommission] = useState("");

  // settings yuklanganda inputlarni to'ldirish
  useState(() => {
    if (settings) {
      setServiceFee(String(settings.service_fee_percent || 0));
      setWaiterCommission(String(settings.waiter_commission_percent || 0));
    }
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put("/manager/settings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-settings"] });
      qc.invalidateQueries({ queryKey: ["branch-settings"] });
      toast.success("Sozlamalar saqlandi!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const handleSave = () => {
    const sfp = parseFloat(serviceFee);
    const wcp = parseFloat(waiterCommission);
    if (isNaN(sfp) || sfp < 0 || sfp > 100) {
      toast.error("Xizmat haqi 0-100% orasida bo'lishi kerak");
      return;
    }
    if (isNaN(wcp) || wcp < 0 || wcp > 100) {
      toast.error("Ofitsiant komissiyasi 0-100% orasida bo'lishi kerak");
      return;
    }
    updateMutation.mutate({
      service_fee_percent: sfp,
      waiter_commission_percent: wcp,
    });
  };

  // Ofitsiant maoshlari
  const today = new Date().toISOString().split("T")[0];
  const [earningsDate, setEarningsDate] = useState(today);

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

        <div className="space-y-4">
          <div>
            <label className="label">
              Xizmat haqi foizi (%)
              <span className="text-xs text-gray-400 font-normal ml-2">
                — har bir buyurtma summasiga qo'shiladi
              </span>
            </label>
            {isLoading ? (
              <div className="input animate-pulse bg-gray-100" />
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="input pr-10"
                  value={
                    serviceFee || String(settings?.service_fee_percent || 0)
                  }
                  onChange={(e) => setServiceFee(e.target.value)}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                  %
                </span>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Misol: buyurtma 100 000 so'm, xizmat haqi 10% → mijoz 110 000 so'm
              to'laydi
            </p>
          </div>

          <div>
            <label className="label">
              Ofitsiant komissiyasi (%)
              <span className="text-xs text-gray-400 font-normal ml-2">
                — har kuni ofitsiant maoshiga qo'shiladi
              </span>
            </label>
            {isLoading ? (
              <div className="input animate-pulse bg-gray-100" />
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="input pr-10"
                  value={
                    waiterCommission ||
                    String(settings?.waiter_commission_percent || 0)
                  }
                  onChange={(e) => setWaiterCommission(e.target.value)}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                  %
                </span>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Misol: buyurtma 100 000 so'm, komissiya 5% → ofitsiant 5 000 so'm
              ishlaydi
            </p>
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

      {/* Ofitsiantlar maoshi */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            Ofitsiantlar maoshi
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
                key={e.waiter_id}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {e.waiter_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {e.total_orders} buyurtma ·{" "}
                    {formatPrice(e.total_order_amount)} jami savdo ·{" "}
                    {e.commission_percent}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatPrice(e.earned_amount)}
                  </p>
                  <p className="text-xs text-gray-400">maosh</p>
                </div>
              </div>
            ))}

            {earnings.length > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-700">
                  Jami ofitsiantlar maoshi:
                </span>
                <span className="font-bold text-green-700">
                  {formatPrice(
                    earnings.reduce(
                      (s: number, e: any) =>
                        s + parseFloat(e.earned_amount || 0),
                      0,
                    ),
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
