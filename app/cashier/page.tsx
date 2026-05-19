"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi, paymentApi } from "@/lib/services";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order, PaymentType } from "@/types";
import toast from "react-hot-toast";
import {
  CreditCard,
  Banknote,
  QrCode,
  Loader2,
  CheckCircle,
  Printer,
  X,
} from "lucide-react";
import clsx from "clsx";

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

function PaymentModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const total = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const payMutation = useMutation({
    mutationFn: () => paymentApi.process(order.id, paymentType),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("To'lov qabul qilindi!");
      // Chekni print qilish
      try {
        const checkRes = await paymentApi.getCheck(order.id);
        const blob = new Blob([checkRes.data], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, "_blank");
        if (w) {
          w.onload = () => {
            w.print();
          };
        }
      } catch {}
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md animate-slideUp">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">To'lovni qabul qilish</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Order summary */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{order.table_number}-stol</span>
              <span>{order.guest_count} mehmon</span>
            </div>
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
            <div className="pt-2 border-t border-gray-200 flex justify-between">
              <span className="font-bold text-gray-900">JAMI:</span>
              <span className="font-bold text-green-600 text-lg">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Payment type */}
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
                      ? pt.color + " border-2"
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
            onClick={() => payMutation.mutate()}
            disabled={payMutation.isPending}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {payMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            To'lovni tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CashierPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", "payment_pending"],
    queryFn: () => orderApi.getAll({ status: "payment_pending" }),
  });

  const orders: Order[] = data?.data?.data || [];

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="page-title">Kassa</h1>
          <p className="text-sm text-gray-500">
            {orders.length} ta to'lov kutilmoqda
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">
            To'lov kutilayotgan buyurtma yo'q
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {orders.map((order) => {
            const total = order.items.reduce(
              (s, i) => s + i.price * i.quantity,
              0,
            );
            return (
              <div
                key={order.id}
                className="card border-2 border-purple-100 hover:border-purple-300 transition-all cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {order.table_number}-stol
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span className="badge bg-purple-100 text-purple-700">
                    To'lov kutilmoqda
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
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    {order.guest_count} mehmon
                  </span>
                  <span className="font-bold text-green-600 text-lg">
                    {formatPrice(total)}
                  </span>
                </div>
                <button className="btn-primary w-full justify-center mt-3 py-2 text-sm">
                  <CreditCard className="w-4 h-4" /> Hisobni yopish
                </button>
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
    </div>
  );
}
