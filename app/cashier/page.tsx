"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  orderApi,
  paymentApi,
  cashierOrderApi,
  settingsApi,
  menuApi,
  cashierApi,
} from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { completePaymentOffline } from "@/lib/offline-actions";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order, PaymentType } from "@/types";
import toast from "react-hot-toast";
import {
  CreditCard,
  Banknote,
  QrCode,
  Loader2,
  CheckCircle,
  X,
  WifiOff,
  Plus,
  ShoppingBag,
  Truck,
  Minus,
  ChefHat,
} from "lucide-react";
import clsx from "clsx";
import { LockedFeature } from "@/components/ui/LockedFeature";

const PAYMENT_TYPES: {
  key: PaymentType;
  label: string;
  icon: any;
  color: string;
}[] = [
  {
    key: "cash",
    label: "Naqd",
    icon: Banknote,
    color: "border-green-400 bg-green-50 text-green-700",
  },
  {
    key: "card",
    label: "Karta",
    icon: CreditCard,
    color: "border-blue-400 bg-blue-50 text-blue-700",
  },
  {
    key: "qr_payment",
    label: "QR",
    icon: QrCode,
    color: "border-purple-400 bg-purple-50 text-purple-700",
  },
];

const ORDER_TYPES: {
  key: "takeaway" | "delivery";
  label: string;
  icon: any;
  color: string;
  desc: string;
}[] = [
  {
    key: "takeaway",
    label: "Saboy",
    icon: ShoppingBag,
    color: "border-orange-400 bg-orange-50 text-orange-700",
    desc: "O'zi bilan olib ketadi",
  },
  {
    key: "delivery",
    label: "Dostavka",
    icon: Truck,
    color: "border-blue-400 bg-blue-50 text-blue-700",
    desc: "Eshikka yetkaziladi",
  },
];

// ─── PAYMENT MODAL ────────────────────────────────────────────
function PaymentModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const { data: settingsData } = useQuery({
    queryKey: ["branch-settings"],
    queryFn: () => settingsApi.getBranchSettings(),
    staleTime: 60 * 60 * 1000,
  });

  const vatEnabled = settingsData?.data?.data?.vat_enabled || false;
  const vatPercent = vatEnabled
    ? parseFloat(settingsData?.data?.data?.vat_percent) || 0
    : 0;
  const isCashierOrder =
    order.order_type === "takeaway" || order.order_type === "delivery";
  const vatAmount = Math.round((subtotal * vatPercent) / 100);
  const grandTotal = subtotal + vatAmount;

  const handlePay = async () => {
    setIsSubmitting(true);
    try {
      const result = await completePaymentOffline(order.id, paymentType);
      if (result.offline) {
        qc.setQueryData(["cashier-orders"], (old: any) => {
          if (!old?.data?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              data: old.data.data.filter((o: Order) => o.id !== order.id),
            },
          };
        });
        toast("📦 To'lov offline saqlandi.", { duration: 5000 });
      } else {
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["cashier-orders"] });
        toast.success("To'lov qabul qilindi!");
        try {
          const checkRes = await paymentApi.getCheck(order.id);
          const blob = new Blob([checkRes.data], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const w = window.open(url, "_blank");
          if (w) w.onload = () => w.print();
        } catch {}
      }
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Xato yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const orderTypeLabel =
    order.order_type === "takeaway"
      ? "🛍 Saboy"
      : order.order_type === "delivery"
        ? "🚚 Dostavka"
        : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md animate-slideUp">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">To'lovni qabul qilish</h3>
            {orderTypeLabel && (
              <p className="text-sm font-semibold text-orange-600">
                {orderTypeLabel}
              </p>
            )}
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.name} x{item.quantity}
                </span>
                <span className="text-gray-800 font-medium">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mahsulotlar:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {isCashierOrder && (
                <p className="text-xs text-gray-400">
                  — Xizmat haqi qo'shilmaydi
                </p>
              )}
              {vatPercent > 0 && (
                <div className="flex justify-between text-sm text-blue-700">
                  <span>QQS ({vatPercent}%):</span>
                  <span>+ {formatPrice(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className="font-bold text-gray-900">JAMI TO'LOV:</span>
                <span className="font-bold text-green-600 text-lg">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="label">To'lov turi</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_TYPES.map((pt) => (
                <button
                  key={pt.key}
                  onClick={() => setPaymentType(pt.key)}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all font-semibold text-sm",
                    paymentType === pt.key
                      ? pt.color
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                  )}
                >
                  <pt.icon className="w-5 h-5" />
                  {pt.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={isSubmitting}
            className="w-full justify-center py-3 flex items-center gap-2 rounded-xl font-semibold transition-all text-white bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {formatPrice(grandTotal)} — Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── YANGI BUYURTMA MODALI ────────────────────────────────────
function NewOrderModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [orderType, setOrderType] = useState<"takeaway" | "delivery">(
    "takeaway",
  );
  const [cart, setCart] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");

  const { data: menuData } = useQuery({
    queryKey: ["menu-all"],
    queryFn: () => menuApi.getAll({ limit: 200, is_available: true }),
  });
  const menuItems = menuData?.data?.data?.items || menuData?.data?.data || [];
  const filtered = menuItems.filter((item: any) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const mutation = useMutation({
    mutationFn: () => {
      const items = Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([product_id, quantity]) => ({ product_id, quantity }));
      return cashierOrderApi.create({
        items,
        order_type: orderType,
        guest_count: 1,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cashier-orders"] });
      toast.success("Buyurtma oshxonaga yuborildi!");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const cartTotal = menuItems
    .filter((item: any) => cart[item.id] > 0)
    .reduce((s: number, item: any) => s + item.price * (cart[item.id] || 0), 0);

  const cartCount = Object.values(cart).reduce((s: number, v) => s + v, 0);

  const addItem = (id: string) =>
    setCart((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const removeItem = (id: string) =>
    setCart((p) => {
      const n = { ...p };
      if (n[id] > 1) n[id]--;
      else delete n[id];
      return n;
    });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg animate-slideUp max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-gray-900">Yangi buyurtma</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3 flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {ORDER_TYPES.map((ot) => (
              <button
                key={ot.key}
                onClick={() => setOrderType(ot.key)}
                className={clsx(
                  "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                  orderType === ot.key
                    ? ot.color
                    : "border-gray-200 text-gray-600 hover:border-gray-300",
                )}
              >
                <ot.icon className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{ot.label}</p>
                  <p className="text-xs opacity-70">{ot.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <input
            className="input"
            placeholder="Mahsulot qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 min-h-0">
          {filtered.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-green-600 font-semibold">
                  {formatPrice(item.price)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {cart[item.id] > 0 ? (
                  <>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100"
                    >
                      <Minus className="w-3.5 h-3.5 text-red-500" />
                    </button>
                    <span className="w-7 text-center font-bold text-sm">
                      {cart[item.id]}
                    </span>
                  </>
                ) : null}
                <button
                  onClick={() => addItem(item.id)}
                  className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center hover:bg-green-100"
                >
                  <Plus className="w-3.5 h-3.5 text-green-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          {cartCount > 0 && (
            <div className="flex justify-between text-sm mb-3 text-gray-600">
              <span>{cartCount} ta mahsulot</span>
              <span className="font-bold text-gray-900">
                {formatPrice(cartTotal)}
              </span>
            </div>
          )}
          <button
            onClick={() => mutation.mutate()}
            disabled={cartCount === 0 || mutation.isPending}
            className="btn-primary w-full justify-center py-3 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChefHat className="w-4 h-4" />
            )}
            Oshxonaga yuborish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ASOSIY SAHIFA ────────────────────────────────────────────
export default function CashierPage() {
  const qc = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  // WebSocket — real vaqtda yangilanish
  useWebSocket({
    handlers: {
      order_payment_pending: () => {
        qc.invalidateQueries({ queryKey: ["orders", "payment_pending"] });
      },
      order_ready: () => {
        qc.invalidateQueries({ queryKey: ["cashier-orders"] });
        qc.invalidateQueries({ queryKey: ["orders", "payment_pending"] });
      },
      new_order: () => {
        qc.invalidateQueries({ queryKey: ["cashier-orders"] });
      },
    },
  });

  const { data: tableData, isLoading: tableLoading } = useQuery({
    queryKey: ["orders", "payment_pending"],
    queryFn: () => orderApi.getAll({ status: "payment_pending" }),
    staleTime: 0,
    gcTime: 60 * 60 * 1000,
    refetchInterval: isOnline ? 15000 : false,
  });

  const { data: cashierData, isLoading: cashierLoading } = useQuery({
    queryKey: ["cashier-orders"],
    queryFn: () => cashierApi.getOrders(),
    staleTime: 10 * 1000,
    refetchInterval: isOnline ? 10000 : false,
  });

  const { data: settingsData } = useQuery({
    queryKey: ["branch-settings"],
    queryFn: () => settingsApi.getBranchSettings(),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const serviceFeeEnabled =
    settingsData?.data?.data?.service_fee_enabled || false;
  const serviceFeePercent = serviceFeeEnabled
    ? parseFloat(settingsData?.data?.data?.service_fee_percent) || 0
    : 0;
  const vatEnabled = settingsData?.data?.data?.vat_enabled || false;
  const vatPercent = vatEnabled
    ? parseFloat(settingsData?.data?.data?.vat_percent) || 0
    : 0;

  const tableOrders: Order[] = tableData?.data?.data || [];
  const cashierOrders: Order[] = cashierData?.data?.data || [];

  const allOrders = [
    ...tableOrders.filter((o) => !o.order_type || o.order_type === "table"),
    ...cashierOrders,
  ];

  const calcGrand = (order: Order) => {
    const sub = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const isCashierOrder =
      order.order_type === "takeaway" || order.order_type === "delivery";
    const fee = isCashierOrder
      ? 0
      : Math.round((sub * serviceFeePercent) / 100);
    const vat = Math.round((sub * vatPercent) / 100);
    return { sub, fee, vat, grand: sub + fee + vat };
  };

  const isLoading = tableLoading || cashierLoading;

  const ORDER_TYPE_BADGE: Record<string, { label: string; color: string }> = {
    table: { label: "Stol", color: "bg-purple-100 text-purple-700" },
    takeaway: { label: "🛍 Saboy", color: "bg-orange-100 text-orange-700" },
    delivery: { label: "🚚 Dostavka", color: "bg-blue-100 text-blue-700" },
  };
  const STATUS_BADGE: Record<string, { label: string; color: string }> = {
    preparing: {
      label: "Tayyorlanmoqda",
      color: "bg-yellow-100 text-yellow-700",
    },
    ready_to_serve: { label: "Tayyor ✓", color: "bg-green-100 text-green-700" },
    payment_pending: {
      label: "To'lov kutmoqda",
      color: "bg-purple-100 text-purple-700",
    },
  };

  return (
    <LockedFeature featureKey="cashier_panel" featureName="Kassir paneli">
      <div className="space-y-5 animate-fadeIn">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="page-title">Kassa</h1>
              <p className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                {allOrders.length} ta buyurtma
                {!isOnline && (
                  <span className="flex items-center gap-1 text-amber-600 font-semibold">
                    <WifiOff className="w-3.5 h-3.5" /> Offline
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewOrder(true)}
            className="btn-primary text-sm py-2"
          >
            <Plus className="w-4 h-4" /> Buyurtma
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : allOrders.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">
              Hozircha buyurtma yo'q
            </p>
            <button
              onClick={() => setShowNewOrder(true)}
              className="btn-primary mt-4 text-sm"
            >
              <Plus className="w-4 h-4" /> Yangi buyurtma
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allOrders.map((order) => {
              const { fee, vat, grand } = calcGrand(order);
              const typeBadge =
                ORDER_TYPE_BADGE[order.order_type || "table"] ||
                ORDER_TYPE_BADGE.table;
              const statusBadge = STATUS_BADGE[order.status] || {
                label: order.status,
                color: "bg-gray-100 text-gray-600",
              };
              const canPay =
                order.status === "payment_pending" ||
                order.order_type === "takeaway" ||
                order.order_type === "delivery";

              return (
                <div
                  key={order.id}
                  className={clsx(
                    "card border-2 transition-all",
                    order.status === "ready_to_serve"
                      ? "border-green-300 bg-green-50/30"
                      : order.status === "payment_pending"
                        ? "border-purple-200 hover:border-purple-400 cursor-pointer"
                        : "border-gray-100",
                  )}
                  onClick={() => (canPay ? setSelectedOrder(order) : null)}
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">
                          {order.order_type === "table"
                            ? `${(order as any).table_number}-stol`
                            : typeBadge.label}
                        </p>
                        {order.order_type === "table" && (
                          <span
                            className={clsx("badge text-xs", typeBadge.color)}
                          >
                            {typeBadge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        "badge text-xs flex-shrink-0",
                        statusBadge.color,
                      )}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="text-gray-700">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 pt-2 border-t border-gray-100 mb-3">
                    {fee > 0 && (
                      <div className="flex justify-between text-sm text-amber-600">
                        <span>Xizmat haqi ({serviceFeePercent}%)</span>
                        <span>+ {formatPrice(fee)}</span>
                      </div>
                    )}
                    {vat > 0 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>QQS ({vatPercent}%)</span>
                        <span>+ {formatPrice(vat)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-900">JAMI:</span>
                      <span className="text-green-600 text-lg">
                        {formatPrice(grand)}
                      </span>
                    </div>
                  </div>

                  {canPay ? (
                    <button className="btn-primary w-full justify-center py-2 text-sm">
                      <CreditCard className="w-4 h-4" /> Hisobni yopish
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-2 text-sm text-yellow-600 bg-yellow-50 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin" /> Oshxonada
                      tayyorlanmoqda...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedOrder && (
          <PaymentModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
        {showNewOrder && (
          <NewOrderModal onClose={() => setShowNewOrder(false)} />
        )}
      </div>
    </LockedFeature>
  );
}
