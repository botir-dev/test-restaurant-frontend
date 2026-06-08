"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, archiveApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { formatPrice } from "@/lib/utils";
import {
  TrendingUp,
  ShoppingBag,
  Table2,
  Users,
  Star,
  ChefHat,
  Clock,
} from "lucide-react";

// Soat bo'yicha statistika hisoblash
function getHourlyStats(revenueChart: any[]) {
  const hourly: Record<number, { orders: number; guests: number }> = {};
  for (let h = 0; h < 24; h++) hourly[h] = { orders: 0, guests: 0 };
  revenueChart.forEach((r: any) => {
    // date = "2026-05-18" formatida keladi, soat yo'q
    // Shuning uchun orders ni 8-22 oralig'iga teng taqsimlash
    const orderCount = Number(r.orders || 0);
    const peakHours = [12, 13, 14, 18, 19, 20];
    peakHours.forEach((h) => {
      hourly[h].orders += Math.round(orderCount * 0.15);
    });
    [11, 15, 17, 21].forEach((h) => {
      hourly[h].orders += Math.round(orderCount * 0.08);
    });
    [10, 16].forEach((h) => {
      hourly[h].orders += Math.round(orderCount * 0.05);
    });
  });
  return hourly;
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: dash } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get(),
    enabled: user?.role === "manager",
  });

  const { data: revenueDaily } = useQuery({
    queryKey: ["revenue", "daily"],
    queryFn: () => archiveApi.getRevenue({ period: "daily" }),
    enabled: user?.role === "manager",
  });

  const { data: revenueMonthly } = useQuery({
    queryKey: ["revenue", "monthly"],
    queryFn: () => archiveApi.getRevenue({ period: "monthly" }),
    enabled: user?.role === "manager",
  });

  const d = dash?.data?.data;
  const rev = revenueDaily?.data?.data;
  const revMonthly = revenueMonthly?.data?.data;

  if (user?.role !== "manager") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <ChefHat className="w-12 h-12 text-green-600" />
        <h2 className="text-lg font-bold text-gray-800">
          Xush kelibsiz, {user?.full_name}!
        </h2>
        <p className="text-gray-500 text-sm">Chap menyudan bo'limni tanlang</p>
      </div>
    );
  }

  const revenueChart = d?.revenue_chart || [];

  // Soat bo'yicha tashrif statistikasi
  const BUSINESS_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const totalMonthlyOrders = Number(revMonthly?.total_orders || 0);
  const hourWeights: Record<number, number> = {
    10: 0.04,
    11: 0.06,
    12: 0.12,
    13: 0.13,
    14: 0.08,
    15: 0.05,
    16: 0.05,
    17: 0.07,
    18: 0.13,
    19: 0.12,
    20: 0.09,
    21: 0.05,
    22: 0.01,
  };
  const maxWeight = Math.max(...Object.values(hourWeights));

  // Soat bo'yicha top mahsulot (simulyatsiya)
  const topProductsByHour: Record<string, string> = {
    "10-12": "Choy / Non",
    "12-15": "Lag'mon / Manti",
    "15-18": "Ichimliklar",
    "18-22": "Grill / Shashlik",
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="page-title">Bosh sahifa</h1>

      {/* Kunlik stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Bugungi daromad",
            value: formatPrice(rev?.total_revenue || 0),
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Bugungi buyurtmalar",
            value: rev?.total_orders || 0,
            icon: ShoppingBag,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Band stollar",
            value: `${d?.table_overview?.occupied || 0}/${d?.table_overview?.total || 0}`,
            icon: Table2,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "O'rtacha chek",
            value: formatPrice(Math.round(rev?.avg_order) || 0),
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((s, i) => (
          <div key={i} className="card">
            <div
              className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}
            >
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Soat bo'yicha tashrif statistikasi */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-blue-500" />
          <h2 className="section-title">Kun davomida tashrif vaqti</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Oylik ma'lumotlar asosida hisoblangan taxminiy ko'rsatkich
        </p>

        {/* Soat grafigi */}
        <div className="relative flex items-end gap-1 mb-2 h-24">
          {BUSINESS_HOURS.map((h) => {
            const weight = hourWeights[h] || 0;
            const heightPct = Math.max(
              Math.round((weight / maxWeight) * 100),
              4,
            );
            const orders = Math.round(totalMonthlyOrders * weight);
            const pct = Math.round(weight * 100);
            const isEmpty = totalMonthlyOrders === 0;
            const fakeH = [20, 30, 55, 70, 45, 25, 30, 50, 75, 85, 65, 35, 10];
            const idx = BUSINESS_HOURS.indexOf(h);
            return (
              <div
                key={h}
                className="flex-1 flex flex-col justify-end group relative"
                style={{ height: "100%" }}
              >
                <div
                  className={`w-full rounded-t-sm transition-all ${isEmpty ? "bg-blue-100 animate-pulse" : "bg-blue-400 hover:bg-blue-500 cursor-pointer"}`}
                  style={{ height: `${isEmpty ? fakeH[idx] : heightPct}%` }}
                />
                {!isEmpty && (
                  <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10 left-1/2 -translate-x-1/2">
                    {h}:00 — {pct}% ({orders} ta)
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Vaqt bo'yicha top mahsulotlar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {Object.entries(topProductsByHour).map(([time, product]) => (
            <div key={time} className="bg-blue-50 rounded-xl p-2.5 text-center">
              <p className="text-xs font-bold text-blue-700">{time}</p>
              <p className="text-xs text-blue-600 mt-0.5">{product}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top mahsulotlar */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="section-title">Eng ko'p sotilgan (oylik)</h2>
          </div>
          <div className="space-y-2">
            {(d?.top_products || []).slice(0, 7).map((p: any, i: number) => {
              const maxSold = d.top_products[0]?.total_sold || 1;
              const pct = Math.round((p.total_sold / maxSold) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-800">{p.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">
                      {p.total_sold} ta
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!d?.top_products || d.top_products.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">
                Ma'lumot yo'q
              </p>
            )}
          </div>
        </div>

        {/* Top ofitsiantlar */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-500" />
            <h2 className="section-title">Eng faol ofitsiantlar</h2>
          </div>
          <div className="space-y-2">
            {(d?.top_waiters || []).slice(0, 7).map((w: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-800">{w.waiter_name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-800">
                    {formatPrice(w.total_revenue)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {w.orders_served} buyurtma
                  </p>
                </div>
              </div>
            ))}
            {(!d?.top_waiters || d.top_waiters.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">
                Ma'lumot yo'q
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Kunlik daromad grafigi */}
      {revenueChart.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">Oxirgi 30 kunlik daromad</h2>
          {revenueChart.length > 0 ? (
            <>
              <div className="relative flex items-end gap-0.5 h-32">
                {(() => {
                  const max = Math.max(
                    ...revenueChart.map((r: any) => Number(r.revenue)),
                    1,
                  );
                  return revenueChart.map((r: any, i: number) => {
                    const heightPct = Math.max(
                      (Number(r.revenue) / max) * 100,
                      3,
                    );
                    const dateStr =
                      typeof r.date === "string"
                        ? r.date.slice(5, 10)
                        : new Date(r.date).toLocaleDateString("uz", {
                            month: "2-digit",
                            day: "2-digit",
                          });
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col justify-end group relative"
                        style={{ height: "100%" }}
                      >
                        <div
                          className="w-full bg-green-500 hover:bg-green-600 rounded-t-sm transition-all cursor-pointer"
                          style={{ height: `${heightPct}%` }}
                        />
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                          {dateStr} — {formatPrice(r.revenue)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="flex justify-between text-xs text-gray-400 px-0.5 mt-1">
                {[
                  0,
                  Math.floor(revenueChart.length / 2),
                  revenueChart.length - 1,
                ].map((i) => {
                  const r = revenueChart[i];
                  const d =
                    typeof r?.date === "string"
                      ? r.date.slice(5, 10)
                      : new Date(r?.date).toLocaleDateString("uz", {
                          month: "2-digit",
                          day: "2-digit",
                        });
                  return <span key={i}>{d}</span>;
                })}
              </div>
            </>
          ) : (
            <>
              <div className="relative flex items-end gap-0.5 h-32">
                {Array.from({ length: 30 }).map((_, i) => {
                  const fakeH = [
                    12, 18, 8, 22, 15, 30, 25, 10, 35, 28, 14, 40, 32, 20, 45,
                    38, 16, 42, 33, 22, 50, 44, 18, 55, 48, 24, 38, 30, 20, 42,
                  ];
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col justify-end"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="w-full bg-gray-100 rounded-t-sm"
                        style={{ height: `${fakeH[i] || 10}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                Ma'lumot yo'q
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
