"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/lib/services";
import { useAuthStore } from "@/store/auth.store";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  formatPrice,
  formatDate,
} from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import {
  ShoppingBag,
  Loader2,
  Send,
  CreditCard,
  X,
  CheckCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import clsx from "clsx";

const STATUS_FILTERS = [
  { key: "all", label: "Hammasi" },
  { key: "pending", label: "Kutilmoqda" },
  { key: "preparing", label: "Tayyorlanmoqda" },
  { key: "ready_to_serve", label: "Tayyor" },
  { key: "payment_pending", label: "To'lov" },
];

export default function OrdersPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [tableNum, setTableNum] = useState("");
  const [waiterName, setWaiterName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["orders", statusFilter],
    queryFn: () =>
      orderApi.getAll(
        statusFilter !== "all" ? { status: statusFilter } : undefined,
      ),
  });

  const allOrders: Order[] = data?.data?.data || [];

  // Frontend filter
  const orders = allOrders.filter((o) => {
    if (tableNum && (o as any).table_number !== Number(tableNum)) return false;
    if (dateFrom) {
      const orderDate = new Date(o.created_at);
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (orderDate < from) return false;
    }
    if (dateTo) {
      const orderDate = new Date(o.created_at);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (orderDate > to) return false;
    }
    return true;
  });

  const activeFilters = [tableNum, dateFrom, dateTo].filter(Boolean).length;

  const sendMutation = useMutation({
    mutationFn: (id: string) => orderApi.sendToKitchen(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Oshxonaga yuborildi!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => orderApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Kassaga yuborildi!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => orderApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Bekor qilindi");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const clearFilters = () => {
    setTableNum("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Buyurtmalar</h1>
        <button
          onClick={() => setShowFilters((p) => !p)}
          className={clsx(
            "btn-secondary text-sm py-2 px-3 relative",
            activeFilters > 0 ? "border-green-400 text-green-700" : "",
          )}
        >
          <Filter className="w-4 h-4" />
          Filtr
          {activeFilters > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilters}
            </span>
          )}
          {showFilters ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Kengaytirilgan filtr */}
      {showFilters && (
        <div className="card animate-fadeIn space-y-3">
          <p className="text-sm font-semibold text-gray-700">Filtrlash</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label text-xs">Dan (sana)</label>
              <input
                type="date"
                className="input text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="label text-xs">Gacha (sana)</label>
              <input
                type="date"
                className="input text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label text-xs">Stol raqami</label>
            <input
              type="number"
              className="input text-sm"
              placeholder="1"
              value={tableNum}
              onChange={(e) => setTableNum(e.target.value)}
            />
          </div>
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Filtrni tozalash
            </button>
          )}
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={clsx(
              "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
              statusFilter === f.key
                ? "bg-green-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-green-300",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Buyurtma yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const total = order.items.reduce(
              (s, i) => s + i.price * i.quantity,
              0,
            );
            return (
              <div key={order.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        {(order as any).table_number
                          ? `${(order as any).table_number}-stol`
                          : "Stol"}
                      </span>
                      {order.is_from_qr && (
                        <span className="badge bg-purple-100 text-purple-700 text-xs">
                          QR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span
                    className={clsx("badge", ORDER_STATUS_COLORS[order.status])}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {item.is_prepared ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">{item.name}</span>
                        <span className="text-gray-400">x{item.quantity}</span>
                      </div>
                      <span className="text-gray-600">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center py-2 border-t border-gray-100 mb-3">
                  <span className="text-sm text-gray-500">
                    {order.guest_count} mehmon
                  </span>
                  <span className="font-bold text-green-600">
                    {formatPrice(total)}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {(order.status === "pending" ||
                    order.status === "preparing") && (
                    <Link
                      href={`/orders/${order.id}/add`}
                      className="flex-1 flex items-center justify-center gap-1 border border-green-200 text-green-700 text-xs font-semibold py-2 rounded-xl hover:bg-green-50 transition-all"
                    >
                      + Qo'shish
                    </Link>
                  )}
                  {order.status === "pending" && (
                    <button
                      onClick={() => sendMutation.mutate(order.id)}
                      disabled={sendMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white text-xs font-semibold py-2 rounded-xl hover:bg-blue-700 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Yuborish
                    </button>
                  )}
                  {order.status === "ready_to_serve" && (
                    <button
                      onClick={() => completeMutation.mutate(order.id)}
                      disabled={completeMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1 bg-amber-500 text-white text-xs font-semibold py-2 rounded-xl hover:bg-amber-600 transition-all"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Kassaga
                    </button>
                  )}
                  {["pending", "preparing"].includes(order.status) &&
                    user?.role === "manager" && (
                      <button
                        onClick={() => cancelMutation.mutate(order.id)}
                        className="w-9 h-9 flex items-center justify-center border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
