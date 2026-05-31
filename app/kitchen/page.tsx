"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/lib/services";
import { prepareItemOffline } from "@/lib/offline-actions";
import { useAuthStore } from "@/store/auth.store";
import type { Order, OrderItem } from "@/types";
import { ROLE_PRODUCT_MAP, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { ChefHat, CheckCircle, Clock, Loader2, WifiOff } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

export default function KitchenPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [preparingIds, setPreparingIds] = useState<Set<string>>(new Set());
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  const getAllowedTypes = (): string[] => {
    if (!user) return [];
    if (user.role === "manager") return [];
    const types = new Set<string>(user.extra_permissions || []);
    const stdType = (ROLE_PRODUCT_MAP as Record<string, string>)[user.role];
    if (stdType) types.add(stdType);
    return Array.from(types);
  };

  const allowedTypes = getAllowedTypes();

  const { data, isLoading } = useQuery({
    queryKey: ["orders", "kitchen"],
    queryFn: () => orderApi.getAll(),
    select: (res) => {
      const orders: Order[] = res.data.data;
      return orders.filter((o) =>
        ["preparing", "ready_to_serve"].includes(o.status),
      );
    },
    staleTime: 30 * 1000, // 30 soniya
    gcTime: 60 * 60 * 1000, // 1 soat cache da
    refetchInterval: isOnline ? 15000 : false, // offline da refetch qilmasin
  });

  const handlePrepare = async (orderId: string, itemId: string) => {
    const key = `${orderId}_${itemId}`;
    setPreparingIds((prev) => new Set(prev).add(key));
    try {
      const result = await prepareItemOffline(orderId, itemId);
      qc.invalidateQueries({ queryKey: ["orders"] });

      if (result.offline) {
        toast("📦 Offline saqlandi. Internet qaytganda yuboriladi.", {
          duration: 3000,
        });
        // Optimistic update — local da ham tayyor qilib ko'rsatamiz
        qc.setQueryData(["orders", "kitchen"], (old: any) => {
          if (!old?.data?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              data: old.data.data.map((order: Order) => {
                if (order.id !== orderId) return order;
                return {
                  ...order,
                  items: order.items.map((item: any) => {
                    if ((item.item_id || item.product_id) !== itemId)
                      return item;
                    return { ...item, is_prepared: true };
                  }),
                };
              }),
            },
          };
        });
      } else {
        toast.success("Tayyor deb belgilandi!");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Xato");
    } finally {
      setPreparingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const orders = data || [];

  const getMyItems = (order: Order): OrderItem[] => {
    if (!user) return [];
    if (user.role === "manager") return order.items;
    if (allowedTypes.length === 0) return order.items;
    return order.items.filter((item) => allowedTypes.includes(item.type));
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="page-title">Oshxona paneli</h1>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            {orders.length} ta aktiv buyurtma
            {allowedTypes.length > 0 && (
              <span className="text-orange-600 font-semibold">
                · {allowedTypes.join(", ")}
              </span>
            )}
            {!isOnline && (
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <ChefHat className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">Hozircha buyurtma yo'q</p>
          <p className="text-gray-400 text-sm">
            Yangi buyurtmalar bu yerda chiqadi
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {orders
            .map((order) => {
              const myItems = getMyItems(order);
              if (myItems.length === 0) return null;

              const preparedCount = myItems.filter((i) => i.is_prepared).length;
              const allDone = preparedCount === myItems.length;

              return (
                <div
                  key={order.id}
                  className={clsx(
                    "rounded-2xl border-2 overflow-hidden",
                    allDone
                      ? "border-green-200 bg-green-50"
                      : "border-orange-200 bg-orange-50",
                  )}
                >
                  <div
                    className={clsx(
                      "px-4 py-3 flex items-center justify-between",
                      allDone ? "bg-green-500" : "bg-orange-500",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg">
                        {order.order_type === "takeaway"
                          ? "🛍 Saboy"
                          : order.order_type === "delivery"
                            ? "🚚 Dostavka"
                            : `${(order as any).table_number}-stol`}
                      </span>
                      {order.is_from_qr && (
                        <span className="badge bg-white/20 text-white text-xs">
                          QR
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-xs">
                        {formatDate(order.created_at)}
                      </p>
                      <p className="text-white text-xs font-semibold">
                        {preparedCount}/{myItems.length} tayyor
                      </p>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    {myItems.map((item: OrderItem, i) => {
                      const itemId = (item as any).item_id || item.product_id;
                      const key = `${order.id}_${itemId}`;
                      const isPreparing = preparingIds.has(key);

                      return (
                        <div
                          key={itemId || i}
                          className={clsx(
                            "flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border",
                            item.is_prepared
                              ? "border-green-200"
                              : "border-orange-200",
                          )}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {item.is_prepared ? (
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <Clock className="w-5 h-5 text-orange-400 flex-shrink-0 animate-pulse" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 text-sm truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {item.quantity} ta
                              </p>
                            </div>
                          </div>
                          {!item.is_prepared ? (
                            <button
                              onClick={() => handlePrepare(order.id, itemId)}
                              disabled={isPreparing}
                              className="flex-shrink-0 ml-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                            >
                              {isPreparing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Tayyor ✓"
                              )}
                            </button>
                          ) : (
                            <span className="flex-shrink-0 ml-2 text-green-600 text-xs font-semibold">
                              Tayyor!
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
            .filter(Boolean)}
        </div>
      )}
    </div>
  );
}
