"use client";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { productApi, orderApi } from "@/lib/api";
import { PRODUCT_TYPE_LABELS, formatPrice } from "@/lib/utils";
import type { Product, ProductType } from "@/types";
import toast from "react-hot-toast";
import {
  ShoppingBag,
  Plus,
  Minus,
  UtensilsCrossed,
  Loader2,
  ChevronRight,
  X,
  User,
  PlusCircle,
} from "lucide-react";
import clsx from "clsx";

// ─── "Buyurtmaga qo'shmoqchimisiz?" modal ─────────────────────
function AddToExistingModal({
  waiterName,
  onYes,
  onNo,
}: {
  waiterName: string | null;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PlusCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Buyurtma allaqachon bor
        </h2>
        <p className="text-gray-500 text-sm mb-1">
          Bu stolda aktiv buyurtma mavjud.
          {waiterName && (
            <span className="font-semibold text-gray-700">
              {" "}
              Ofitsiant: {waiterName}
            </span>
          )}
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Yana biror narsa qo'shmoqchimisiz?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onNo}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
          >
            Yo'q
          </button>
          <button
            onClick={onYes}
            className="flex-1 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
          >
            Ha, qo'shish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Asosiy menyu komponenti ───────────────────────────────────
function MenuContent() {
  const params = useSearchParams();
  const branchId = params.get("branch") || "";
  const tableId = params.get("table") || "";

  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedWaiter, setSelectedWaiter] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [step, setStep] = useState<
    "checking" | "ask_add" | "menu" | "waiter" | "success"
  >("checking");
  const [addMode, setAddMode] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeWaiterId, setActiveWaiterId] = useState<string | null>(null);
  const [activeWaiterName, setActiveWaiterName] = useState<string | null>(null);
  const [stepInitialized, setStepInitialized] = useState(false);

  // Stol holatini tekshirish — sahifa ochilganda
  const {
    data: tableStatusData,
    isLoading: statusLoading,
    isError: statusError,
  } = useQuery({
    queryKey: ["table-status", branchId, tableId],
    queryFn: () => orderApi.getTableStatus(branchId, tableId),
    enabled: !!branchId && !!tableId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // React Query v5 da onSuccess/onError yo'q — useEffect ishlatamiz

  useEffect(() => {
    if (stepInitialized) return;
    if (statusLoading) return;

    if (statusError || !tableStatusData) {
      setStep("menu");
      setStepInitialized(true);
      return;
    }

    const d = tableStatusData?.data?.data;
    if (d?.has_active_order && d?.order_id) {
      setActiveOrderId(d.order_id);
      setActiveWaiterId(d.waiter_id);
      setActiveWaiterName(d.waiter_name);
      setStep("ask_add");
    } else {
      setStep("menu");
    }
    setStepInitialized(true);
  }, [statusLoading, statusError, tableStatusData, stepInitialized]);

  // Menyu ma'lumotlari
  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ["public-menu", branchId],
    queryFn: () => productApi.getPublicMenu(branchId, { limit: 200 }),
    enabled: !!branchId,
  });

  // Ofitsiantlar (faqat yangi buyurtma rejimida kerak)
  const { data: waitersData } = useQuery({
    queryKey: ["public-waiters", branchId],
    queryFn: () => orderApi.getPublicWaiters(branchId),
    enabled: !!branchId && !addMode,
  });

  const menuGrouped = menuData?.data?.data || {};
  const allProducts: Product[] = Object.values(menuGrouped).flat() as Product[];
  const types = Object.keys(menuGrouped);
  const waiters = waitersData?.data?.data || [];

  const cartItems = Object.entries(cart) as [string, number][];
  const cartItemsFiltered = cartItems.filter(([, qty]) => qty > 0);
  const total = cartItemsFiltered.reduce((sum, [pid, qty]) => {
    const p = allProducts.find((p) => p.id === pid);
    return sum + (p?.price || 0) * qty;
  }, 0);

  const filtered =
    activeType === "all"
      ? allProducts
      : ((menuGrouped[activeType] || []) as Product[]);

  const addToCart = (product: Product) =>
    setCart((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));

  const removeFromCart = (productId: string) =>
    setCart((prev) => {
      const n = { ...prev, [productId]: (prev[productId] || 0) - 1 };
      if (n[productId] <= 0) delete n[productId];
      return n;
    });

  // ─── Yangi buyurtma ────────────────────────────────────────
  const createOrderMutation = useMutation({
    mutationFn: () =>
      orderApi.createQrOrder({
        branch_id: branchId,
        table_id: tableId,
        waiter_id: selectedWaiter,
        items: cartItemsFiltered.map(([pid, qty]) => ({
          product_id: pid,
          quantity: qty,
        })),
        guest_count: 1,
      }),
    onSuccess: () => setStep("success"),
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Xato yuz berdi"),
  });

  // ─── Mavjud buyurtmaga qo'shish ────────────────────────────
  const addItemsMutation = useMutation({
    mutationFn: () =>
      orderApi.addItemsToOrder({
        order_id: activeOrderId!,
        branch_id: branchId,
        items: cartItemsFiltered.map(([pid, qty]) => ({
          product_id: pid,
          quantity: qty,
        })),
      }),
    onSuccess: () => setStep("success"),
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Xato yuz berdi"),
  });

  const handleSubmitOrder = () => {
    if (addMode) {
      addItemsMutation.mutate();
    } else {
      createOrderMutation.mutate();
    }
  };

  const isPending = createOrderMutation.isPending || addItemsMutation.isPending;

  // ─── Loading ekrani ────────────────────────────────────────
  if (step === "checking" || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  // ─── "Qo'shmoqchimisiz?" modal ─────────────────────────────
  if (step === "ask_add") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] p-4">
        <AddToExistingModal
          waiterName={activeWaiterName}
          onYes={() => {
            setAddMode(true);
            setStep("menu");
          }}
          onNo={() => {
            // Menyuni ko'rsatmay chiqish yoki oddiy yangi buyurtma
            setAddMode(false);
            setStep("menu");
          }}
        />
      </div>
    );
  }

  // ─── Success ekrani ────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf8] p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
          <UtensilsCrossed className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {addMode ? "Qo'shildi!" : "Buyurtma qabul qilindi!"}
        </h1>
        <p className="text-gray-500 mb-1">
          {addMode
            ? "Qo'shimcha buyurtmangiz oshxonaga yuborildi."
            : "Ofitsiant tez orada keladi."}
        </p>
        <p className="text-gray-400 text-sm">
          Xizmatdan foydalanganingiz uchun rahmat 🙏
        </p>
      </div>
    );
  }

  // ─── Ofitsiant tanlash (faqat yangi buyurtmada) ────────────
  if (step === "waiter") {
    return (
      <div className="min-h-screen bg-[#fafaf8] p-4">
        <div className="max-w-sm mx-auto animate-fadeIn">
          <button
            onClick={() => setStep("menu")}
            className="flex items-center gap-2 text-gray-600 mb-5 font-semibold"
          >
            ← Orqaga
          </button>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Ofitsiantni tanlang
          </h2>
          <div className="space-y-2 mb-5">
            {waiters.map((w: any) => (
              <button
                key={w.id}
                onClick={() => setSelectedWaiter(w.id)}
                className={clsx(
                  "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                  selectedWaiter === w.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-100 bg-white hover:border-green-200",
                )}
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-semibold text-gray-800">
                  {w.full_name}
                </span>
                {selectedWaiter === w.id && (
                  <span className="ml-auto text-green-600">✓</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => createOrderMutation.mutate()}
            disabled={!selectedWaiter || isPending}
            className="btn-primary w-full justify-center py-4 text-base"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShoppingBag className="w-5 h-5" />
            )}
            Buyurtma berish · {formatPrice(total)}
          </button>
        </div>
      </div>
    );
  }

  // ─── Menyu ekrani ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fafaf8] pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-30 px-4 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Menyu</h1>
            <p className="text-xs text-gray-500">
              {addMode
                ? "Mavjud buyurtmaga qo'shish"
                : "Stoldan buyurtma bering"}
            </p>
          </div>
          {addMode && (
            <span className="ml-auto text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
              + Qo'shish rejimi
            </span>
          )}
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3 max-w-2xl mx-auto">
          {["all", ...types].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={clsx(
                "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                activeType === type
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {type === "all"
                ? "Hammasi"
                : PRODUCT_TYPE_LABELS[type as ProductType] || type}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {menuLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product: Product) => {
              const qty = cart[product.id] || 0;
              return (
                <div
                  key={product.id}
                  className={clsx(
                    "bg-white rounded-2xl border-2 overflow-hidden transition-all",
                    qty > 0 ? "border-green-400" : "border-gray-100",
                  )}
                >
                  <div className="h-28 bg-gray-100 relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">
                      {product.name}
                    </p>
                    <p className="text-green-600 font-bold text-sm mt-0.5">
                      {formatPrice(product.price)}
                    </p>
                    <div className="mt-2">
                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Qo'shish
                        </button>
                      ) : (
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all"
                          >
                            <Minus className="w-3.5 h-3.5 text-red-600" />
                          </button>
                          <span className="font-bold text-gray-900">{qty}</span>
                          <button
                            onClick={() => addToCart(product)}
                            className="w-8 h-8 rounded-xl bg-green-50 hover:bg-green-100 flex items-center justify-center transition-all"
                          >
                            <Plus className="w-3.5 h-3.5 text-green-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating cart button */}
      {cartItemsFiltered.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 animate-slideUp">
          <button
            onClick={() => {
              // Qo'shish rejimida yoki ofitsiant allaqachon bog'langan bo'lsa — to'g'ridan yuborish
              if (addMode || activeWaiterId) {
                handleSubmitOrder();
              } else {
                setStep("waiter");
              }
            }}
            disabled={isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between transition-all disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center text-sm font-bold">
                {cartItemsFiltered.reduce((s, [, q]) => s + (q as number), 0)}
              </span>
              <span className="font-bold">
                {addMode ? "Buyurtmaga qo'shish" : "Buyurtma berish"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="font-bold">{formatPrice(total)}</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
