"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { menuApi, tableApi } from "@/lib/api";
import { createOrderOffline } from "@/lib/offline-actions";
import { useAuthStore } from "@/store/auth.store";
import { PRODUCT_TYPE_LABELS, formatPrice } from "@/lib/utils";
import type { ProductType } from "@/types";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingBag,
  Loader2,
  Search,
  X,
  WifiOff,
} from "lucide-react";
import clsx from "clsx";

// Menyudan keladigan oddiy item turi (faqat nom, narx, rasm)
interface SimpleMenuItem {
  id: string;
  name: string;
  price: number;
  type: string;
  image_url?: string | null;
}

export default function NewOrderPage() {
  const { id: tableId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  const { data: menuData, isLoading } = useQuery({
    queryKey: ["menu-items", "available"],
    queryFn: () => menuApi.getAll({ is_available: true, limit: 200 }),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const { data: tablesData } = useQuery({
    queryKey: ["tables"],
    queryFn: () => tableApi.getAll(),
    staleTime: 2 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const table = tablesData?.data?.data?.find((t: any) => t.id === tableId);

  // Faqat id, name, price, type, image_url — boshqa narsalar kerak emas
  const items: SimpleMenuItem[] = (menuData?.data?.data || []).map(
    (m: any) => ({
      id: m.id,
      name: m.name,
      price: m.price,
      type: m.type,
      image_url: m.image_url,
    }),
  );

  const types = ["all", ...Array.from(new Set(items.map((p) => p.type)))];

  const filtered = items.filter((p) => {
    const matchType = activeType === "all" || p.type === activeType;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0);
  const totalAmount = cartItems.reduce((sum, [pid, qty]) => {
    const p = items.find((p) => p.id === pid);
    return sum + (p?.price || 0) * qty;
  }, 0);

  const MAX_QTY = 99;
  const addToCart = (id: string) =>
    setCart((p) => ({ ...p, [id]: Math.min((p[id] || 0) + 1, MAX_QTY) }));
  const removeFromCart = (id: string) =>
    setCart((p) => {
      const n = { ...p, [id]: Math.max(0, (p[id] || 0) - 1) };
      if (n[id] <= 0) delete n[id];
      return n;
    });

  const handleSubmit = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = await createOrderOffline({
        table_id: tableId,
        guest_count: table?.capacity || 1,
        items: cartItems.map(([pid, qty]) => ({
          product_id: pid,
          quantity: qty,
        })),
      });

      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["orders"] });

      if (result.offline) {
        toast("📦 Buyurtma offline saqlandi. Internet qaytganda yuboriladi.", {
          duration: 4000,
          icon: <WifiOff className="w-4 h-4 text-amber-500" />,
        });
      } else {
        toast.success("Buyurtma yaratildi!");
      }
      router.push("/tables");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Xato yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-40">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="page-title">
            {table?.table_number}-stol uchun buyurtma
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            Menyu
            {!isOnline && (
              <span className="flex items-center gap-1 text-amber-600 font-semibold ml-2">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Taom qidirish..."
          value={search}
          maxLength={100}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={clsx(
              "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
              activeType === type
                ? "bg-green-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-green-300",
            )}
          >
            {type === "all"
              ? "Hammasi"
              : PRODUCT_TYPE_LABELS[type as ProductType] || type}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <WifiOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">Menyu yuklanmadi</p>
          <p className="text-gray-400 text-sm">
            Internet bo'lganda menyu cache ga saqlanadi
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const qty = cart[item.id] || 0;
            return (
              <div
                key={item.id}
                className={clsx(
                  "bg-white rounded-2xl border-2 p-3 transition-all",
                  qty > 0 ? "border-green-400" : "border-gray-100",
                )}
              >
                <div className="w-full h-24 bg-gray-100 rounded-xl mb-2 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-green-600 font-bold mt-0.5">
                  {formatPrice(item.price)}
                </p>
                <div className="flex items-center justify-between mt-2">
                  {qty === 0 ? (
                    <button
                      onClick={() => addToCart(item.id)}
                      className="flex items-center gap-1 w-full justify-center bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Qo'shish
                    </button>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all"
                      >
                        <Minus className="w-3.5 h-3.5 text-red-600" />
                      </button>
                      <span className="font-bold text-gray-900 text-sm">
                        {qty}
                      </span>
                      <button
                        onClick={() => addToCart(item.id)}
                        className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-green-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating cart */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-60 z-40 animate-slideUp">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">
                  {cartItems.length} xil taom
                </p>
                <p className="text-xs text-gray-500">
                  {cartItems.reduce((s, [, q]) => s + q, 0)} ta jami
                </p>
              </div>
              <p className="font-bold text-green-600 text-lg">
                {formatPrice(totalAmount)}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={clsx(
                "w-full justify-center py-3 flex items-center gap-2 rounded-xl font-semibold transition-all text-white",
                isOnline
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-amber-500 hover:bg-amber-600",
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isOnline ? (
                <ShoppingBag className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
              {isOnline ? "Buyurtma yuborish" : "Offline saqlash"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
