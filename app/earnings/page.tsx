"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { formatPrice } from "@/lib/utils";
import {
  TrendingUp,
  CalendarDays,
  ShoppingBag,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";

export default function EarningsPage() {
  const { user } = useAuthStore();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ["my-earnings", date],
    queryFn: () => api.get("/branches/me/earnings", { params: { date } }),
    enabled: user?.role === "waiter",
  });

  const d = data?.data?.data;
  const todayData = d?.today;
  const monthData = d?.month;
  const monthLabel = d?.month_label;

  // Sana navigatsiyasi
  const changeDate = (delta: number) => {
    const dt = new Date(date);
    dt.setDate(dt.getDate() + delta);
    setDate(dt.toISOString().split("T")[0]);
  };

  const formatDate = (str: string) =>
    new Date(str).toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  if (user?.role !== "waiter") {
    return (
      <div className="text-center py-16 text-gray-400">
        <Wallet className="w-10 h-10 mx-auto mb-2" />
        <p>Bu sahifa faqat ofitsiantlar uchun</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn max-w-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Wallet className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="page-title">Mening maoshim</h1>
          <p className="text-sm text-gray-500">{user?.full_name}</p>
        </div>
      </div>

      {/* Sana tanlash */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 p-2">
        <button
          onClick={() => changeDate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <input
          type="date"
          className="flex-1 text-center text-sm font-semibold text-gray-800 border-none outline-none bg-transparent"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          onClick={() => changeDate(1)}
          disabled={date >= today}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-50" />
          ))}
        </div>
      ) : (
        <>
          {/* Kunlik statistika */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">
                {date === today ? "🟢 Bugun" : formatDate(date)}
              </h2>
              {todayData?.commission_percent > 0 && (
                <span className="badge bg-green-100 text-green-700 text-xs">
                  {todayData.commission_percent}% komissiya
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <ShoppingBag className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="font-bold text-gray-900 text-lg">
                  {todayData?.total_orders ?? 0}
                </p>
                <p className="text-xs text-gray-500">Buyurtma</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="font-bold text-gray-900 text-sm leading-tight mt-1">
                  {formatPrice(todayData?.total_order_amount ?? 0)}
                </p>
                <p className="text-xs text-gray-500">Savdo</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <Wallet className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="font-bold text-green-700 text-sm leading-tight mt-1">
                  {formatPrice(todayData?.earned_amount ?? 0)}
                </p>
                <p className="text-xs text-gray-500">Maosh</p>
              </div>
            </div>

            {(todayData?.earned_amount ?? 0) === 0 && (
              <p className="text-center text-sm text-gray-400 mt-4">
                {date === today
                  ? "Hali buyurtma yo'q"
                  : "Bu kunda buyurtma bo'lmagan"}
              </p>
            )}
          </div>

          {/* Oylik statistika */}
          {monthData && (
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-green-600" />
                  {monthLabel} — oylik jami
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Ishlagan kunlar</p>
                  <p className="font-bold text-gray-900 text-2xl">
                    {monthData.days_worked}
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Jami buyurtmalar</p>
                  <p className="font-bold text-gray-900 text-2xl">
                    {monthData.total_orders}
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Jami savdo</p>
                  <p className="font-bold text-gray-800">
                    {formatPrice(monthData.total_order_amount ?? 0)}
                  </p>
                </div>
                <div className="bg-green-600 rounded-xl p-3">
                  <p className="text-xs text-green-100 mb-1">Oylik maosh</p>
                  <p className="font-bold text-white text-lg">
                    {formatPrice(monthData.total_earned ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
