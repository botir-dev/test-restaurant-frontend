"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { archiveApi } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { ArchiveItem } from "@/types";
import { Archive, Loader2, TrendingUp, Search, Filter } from "lucide-react";
import clsx from "clsx";
import { LockedFeature } from "@/components/ui/LockedFeature";

const PERIODS = [
  { key: "daily", label: "Bugun" },
  { key: "weekly", label: "Haftalik" },
  { key: "monthly", label: "Oylik" },
  { key: "yearly", label: "Yillik" },
];

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Naqd",
  card: "Karta",
  qr_payment: "QR",
};
const PAYMENT_COLORS: Record<string, string> = {
  cash: "bg-green-100 text-green-700",
  card: "bg-blue-100 text-blue-700",
  qr_payment: "bg-purple-100 text-purple-700",
};

export default function ArchivePage() {
  const [period, setPeriod] = useState("daily");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    waiter: "",
    cashier: "",
    table_number: "",
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: archiveData, isLoading } = useQuery({
    queryKey: ["archive", period, page, filters],
    queryFn: () =>
      archiveApi.getAll({
        period: dateFrom || dateTo ? undefined : period,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        page,
        limit: 15,
        waiter: filters.waiter || undefined,
        cashier: filters.cashier || undefined,
        table_number: filters.table_number
          ? Number(filters.table_number)
          : undefined,
      }),
  });

  const { data: revenueData } = useQuery({
    queryKey: ["revenue", period, dateFrom, dateTo],
    queryFn: () =>
      archiveApi.getRevenue({
        period: dateFrom || dateTo ? undefined : period,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      }),
  });

  const items: ArchiveItem[] = archiveData?.data?.data || [];
  const pagination = archiveData?.data?.pagination;
  const revenue = revenueData?.data?.data;

  return (
    <LockedFeature
      featureKey="advanced_reports"
      featureName="Arxiv va Hisobotlar"
    >
      <div className="space-y-5 animate-fadeIn">
        <h1 className="page-title">Arxiv va Hisobotlar</h1>

        {/* Period filter */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setPeriod(p.key);
                setPage(1);
              }}
              className={clsx(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                period === p.key
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-500",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Revenue cards */}
        {revenue && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Jami daromad",
                value: formatPrice(revenue.total_revenue || 0),
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                label: "Buyurtmalar",
                value: revenue.total_orders || 0,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "O'rtacha chek",
                value: formatPrice(revenue.avg_order || 0),
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "Naqd pul",
                value: formatPrice(revenue.cash_revenue || 0),
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
            ].map((s, i) => (
              <div key={i} className="card">
                <div
                  className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center mb-2`}
                >
                  <TrendingUp className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <p className="font-semibold text-gray-700 text-sm">Filtr</p>
          </div>
          {/* Sana oralig'i */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="label text-xs">Dan</label>
              <input
                type="date"
                className="input text-sm"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label className="label text-xs">Gacha</label>
              <input
                type="date"
                className="input text-sm"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
              className="text-xs text-red-500 hover:text-red-700 mb-2 flex items-center gap-1"
            >
              ✕ Sana filtrini tozalash
            </button>
          )}
          <div className="grid grid-cols-3 gap-2">
            <input
              className="input text-sm"
              placeholder="Ofitsiant"
              value={filters.waiter}
              onChange={(e) => {
                setFilters((p) => ({ ...p, waiter: e.target.value }));
                setPage(1);
              }}
            />
            <input
              className="input text-sm"
              placeholder="Kassir"
              value={filters.cashier}
              onChange={(e) => {
                setFilters((p) => ({ ...p, cashier: e.target.value }));
                setPage(1);
              }}
            />
            <input
              className="input text-sm"
              type="number"
              placeholder="Stol №"
              value={filters.table_number}
              onChange={(e) => {
                setFilters((p) => ({ ...p, table_number: e.target.value }));
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Archive list */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Bu davrda yopilgan buyurtma yo'q</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">
                        {item.order_type === "takeaway"
                          ? "🛍 Saboy"
                          : item.order_type === "delivery"
                            ? "🚚 Dostavka"
                            : `${item.table_number}-stol`}
                      </span>
                      {item.is_from_qr && (
                        <span className="badge bg-purple-100 text-purple-700 text-xs">
                          QR
                        </span>
                      )}
                      {item.order_type === "takeaway" && (
                        <span className="badge bg-orange-100 text-orange-700 text-xs">
                          Saboy
                        </span>
                      )}
                      {item.order_type === "delivery" && (
                        <span className="badge bg-blue-100 text-blue-700 text-xs">
                          Dostavka
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">
                      {formatPrice(
                        Number(item.grand_total) || Number(item.total_amount),
                      )}
                    </p>
                    <span
                      className={clsx(
                        "badge text-xs",
                        PAYMENT_COLORS[item.payment_type] ||
                          "bg-gray-100 text-gray-600",
                      )}
                    >
                      {PAYMENT_LABELS[item.payment_type] || item.payment_type}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mb-2">
                  {item.items.slice(0, 3).map((i, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {i.name} x{i.quantity}
                      </span>
                      <span className="text-gray-700">
                        {formatPrice(i.price * i.quantity)}
                      </span>
                    </div>
                  ))}
                  {item.items.length > 3 && (
                    <p className="text-xs text-gray-400">
                      +{item.items.length - 3} ta mahsulot
                    </p>
                  )}
                </div>

                {/* Xizmat haqi breakdown */}
                <div className="border-t border-gray-100 pt-2 mb-2 space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Mahsulotlar</span>
                    <span>{formatPrice(Number(item.total_amount))}</span>
                  </div>
                  {Number(item.service_fee_percent) > 0 && (
                    <div className="flex justify-between text-xs text-amber-600 font-semibold">
                      <span>Xizmat haqi ({item.service_fee_percent}%)</span>
                      <span>
                        + {formatPrice(Number(item.service_fee_amount))}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
                  <span>👨‍🍳 {item.waiter_name || "-"}</span>
                  <span>💰 {item.cashier_name || "-"}</span>
                  <span className="ml-auto">{item.guest_count} mehmon</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-1.5 px-4 text-sm"
            >
              ← Oldingi
            </button>
            <span className="text-sm text-gray-600 font-semibold">
              {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="btn-secondary py-1.5 px-4 text-sm"
            >
              Keyingi →
            </button>
          </div>
        )}
      </div>
    </LockedFeature>
  );
}
