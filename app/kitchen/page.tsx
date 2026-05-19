"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/lib/services";
import { useAuthStore } from "@/store/auth.store";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Order, OrderItem } from "@/types";
import { ROLE_PRODUCT_MAP, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { ChefHat, CheckCircle, Clock, Loader2 } from "lucide-react";
import clsx from "clsx";

export default function KitchenPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // Hodimning ruxsat etilgan turlarini hisoblash
  const getAllowedTypes = (): string[] => {
    if (!user) return [];
    if (user.role === "manager") return [];

    const types = new Set<string>(user.extra_permissions || []);

    const stdType = (ROLE_PRODUCT_MAP as Record<string, string>)[user.role];
    if (stdType) types.add(stdType);

    return Array.from(types);
  };

  const allowedTypes = getAllowedTypes();
  const isPreparerRole =
    user &&
    !["manager", "waiter", "cashier", "storekeeper", "super_admin"].includes(
      user.role,
    );

  const { data, isLoading } = useQuery({
    queryKey: ["orders", "kitchen"],
    queryFn: () => orderApi.getAll(),
    select: (res) => {
      const orders: Order[] = res.data.data;
      return orders.filter((o) =>
        ["preparing", "ready_to_serve"].includes(o.status),
      );
    },
  });

  // WebSocket — real vaqtda yangilash
  useWebSocket({
    handlers: {
      new_order: (data) => {
        qc.invalidateQueries({ queryKey: ["orders"] });
        toast.success(`Yangi buyurtma: ${data?.message || "keldi"}`, {
          icon: "🍽️",
          duration: 4000,
        });
      },
      order_ready: () => {
        qc.invalidateQueries({ queryKey: ["orders"] });
      },
    },
  });

  const prepareMutation = useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      orderApi.prepareItem(orderId, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Tayyor deb belgilandi!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const orders = data || [];

  // Buyurtma itemlarini filter qilish
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
          <p className="text-sm text-gray-500">
            {orders.length} ta aktiv buyurtma
            {allowedTypes.length > 0 && (
              <span className="ml-2 text-orange-600 font-semibold">
                · {allowedTypes.join(", ")} turlari
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
                        {(order as any).table_number}-stol
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
                    {myItems.map((item: OrderItem, i) => (
                      <div
                        key={(item as any).item_id || i}
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
                            onClick={() =>
                              prepareMutation.mutate({
                                orderId: order.id,
                                itemId:
                                  (item as any).item_id || item.product_id,
                              })
                            }
                            disabled={prepareMutation.isPending}
                            className="flex-shrink-0 ml-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          >
                            Tayyor ✓
                          </button>
                        ) : (
                          <span className="flex-shrink-0 ml-2 text-green-600 text-xs font-semibold">
                            Tayyor!
                          </span>
                        )}
                      </div>
                    ))}
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
