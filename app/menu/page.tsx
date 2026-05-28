"use client";
import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { productApi, orderApi } from "@/lib/services";
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
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

// ─── Kombinatorik juftlik jadvali ──────────────────────────────────────────
// Har bir mahsulot turiga mos keladigan tavsiya tur(lar)i
// "drink" va "other" — tavsiya BERILMAYDI (suv, boshqa narsalar bilan juftlab bo'lmaydi)
const PAIR_MAP: Partial<Record<string, string[]>> = {
  food: ["tea", "bread", "somsa", "icecream"],
  grill: ["tea", "bread", "somsa"],
  turkish: ["tea", "bread"],
  somsa: ["tea", "bread"],
  bread: ["tea", "food", "somsa"],
  icecream: ["tea"],
  tea: ["food", "bread", "somsa", "grill", "turkish", "icecream"],
  // drink → yo'q (ichimlik suvi, sharbat nima bilan ketishini aniqlab bo'lmaydi)
  // other → yo'q
};

/**
 * Kombinatorik tavsiya algoritmi:
 * 1. Qo'shilgan mahsulot turini oladi
 * 2. PAIR_MAP dan juft turlarni qidiradi
 * 3. Savatchada yo'q, mavjud mahsulotlar ichidan eng mos birini tanlaydi
 * 4. Bir xil turdan savatda allaqachon bor bo'lsa — o'sha turni o'tkazib yuboradi
 */
function findRecommendation(
  addedProduct: Product,
  allProducts: Product[],
  cart: Record<string, number>,
): Product | null {
  const pairTypes = PAIR_MAP[addedProduct.type];
  if (!pairTypes || pairTypes.length === 0) return null;

  const cartProductIds = new Set(
    Object.keys(cart).filter((id) => (cart[id] || 0) > 0),
  );
  const cartTypes = new Set(
    allProducts.filter((p) => cartProductIds.has(p.id)).map((p) => p.type),
  );

  // Savatda yo'q turlarni ustun ko'rish (prioritet tartibida)
  const priorityTypes = pairTypes.filter((t) => !cartTypes.has(t));
  const searchTypes = priorityTypes.length > 0 ? priorityTypes : pairTypes;

  // Har bir tur uchun mavjud va savatda yo'q mahsulotlarni topish
  for (const pairType of searchTypes) {
    const candidates = allProducts.filter(
      (p) =>
        p.type === pairType &&
        !cartProductIds.has(p.id) &&
        p.id !== addedProduct.id &&
        p.is_available !== false,
    );
    if (candidates.length > 0) {
      // Narxi bo'yicha saralangan birinchisini qaytarish (arzon → yuqori konversiya)
      candidates.sort((a, b) => a.price - b.price);
      return candidates[0];
    }
  }
  return null;
}

// ─── Custom toast komponenti ───────────────────────────────────────────────
function SuggestionToast({
  toastId,
  selectedName,
  recommendedProduct,
  onYes,
  onNo,
}: {
  toastId: string;
  selectedName: string;
  recommendedProduct: Product;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden"
      style={{ width: 320, maxWidth: "calc(100vw - 32px)" }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-white/80 flex-shrink-0" />
        <p className="text-white text-xs font-bold tracking-wide uppercase">
          Tavsiya
        </p>
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-gray-800 text-sm font-semibold leading-snug">
          <span className="text-green-700">"{selectedName}"</span> bilan{" "}
          <span className="text-green-700">"{recommendedProduct.name}"</span>{" "}
          juda ajoyib ketadi! Istaysizmi?
        </p>
        <p className="text-green-600 font-bold text-sm mt-1.5">
          atigi —{" "}
          <span className="text-lg">
            {formatPrice(recommendedProduct.price)}
          </span>
        </p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        <button
          onClick={onNo}
          className="py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
        >
          Yo'q
        </button>
        <button
          onClick={onYes}
          className="py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-all active:scale-95 shadow-sm"
        >
          Ha, qo'shish ✓
        </button>
      </div>
    </div>
  );
}

// ─── Asosiy menyu komponenti ───────────────────────────────────────────────
function MenuContent() {
  const params = useSearchParams();
  const branchId = params.get("branch") || "";
  const tableId = params.get("table") || "";

  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedWaiter, setSelectedWaiter] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [step, setStep] = useState<"menu" | "waiter" | "success">("menu");

  // Bir mahsulotga bir marta tavsiya ko'rsatish uchun tracking
  const shownSuggestions = useRef<Set<string>>(new Set());
  // Hozir ochiq bo'lgan toast ID ni saqlash (bir vaqtda faqat bitta)
  const activeToastId = useRef<string | null>(null);

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ["public-menu", branchId],
    queryFn: () => productApi.getPublicMenu(branchId, { limit: 200 }),
    enabled: !!branchId,
  });

  const { data: waitersData } = useQuery({
    queryKey: ["public-waiters", branchId],
    queryFn: () => orderApi.getPublicWaiters(branchId),
    enabled: !!branchId,
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

  // ─── Savatchaga qo'shish + tavsiya algoritmi ──────────────────────────
  const addToCart = (product: Product) => {
    setCart((prev: Record<string, number>) => {
      const newCart: Record<string, number> = {
        ...prev,
        [product.id]: (prev[product.id] || 0) + 1,
      };

      // Tavsiya faqat birinchi qo'shilganda (0→1) va bir marta ko'rsatiladi
      const isFirstAdd = !prev[product.id] || prev[product.id] === 0;
      if (isFirstAdd && !shownSuggestions.current.has(product.id)) {
        shownSuggestions.current.add(product.id);

        const recommended = findRecommendation(product, allProducts, newCart);
        if (recommended) {
          // Oldingi tavsiya toastini yopish
          if (activeToastId.current) {
            toast.dismiss(activeToastId.current);
          }

          const toastId = toast.custom(
            (t: any) => (
              <SuggestionToast
                toastId={t.id}
                selectedName={product.name}
                recommendedProduct={recommended}
                onYes={() => {
                  setCart((c: Record<string, number>) => ({
                    ...c,
                    [recommended.id]: (c[recommended.id] || 0) + 1,
                  }));
                  toast.dismiss(t.id);
                  activeToastId.current = null;
                }}
                onNo={() => {
                  toast.dismiss(t.id);
                  activeToastId.current = null;
                }}
              />
            ),
            {
              duration: 8000,
              position: "bottom-center",
              style: {
                padding: 0,
                background: "transparent",
                boxShadow: "none",
              },
            },
          );
          activeToastId.current = toastId;
        }
      }

      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev: Record<string, number>) => {
      const n = { ...prev, [productId]: (prev[productId] || 0) - 1 };
      if (n[productId] <= 0) delete n[productId];
      return n;
    });
  };

  // ─── Order mutation ────────────────────────────────────────────────────
  const orderMutation = useMutation({
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

  // ─── Success ekrani ────────────────────────────────────────────────────
  if (step === "success")
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf8] p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
          <UtensilsCrossed className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Buyurtma qabul qilindi!
        </h1>
        <p className="text-gray-500 mb-1">Ofitsiant tez orada keladi.</p>
        <p className="text-gray-400 text-sm">
          Xizmatdan foydalanganingiz uchun rahmat 🙏
        </p>
      </div>
    );

  // ─── Ofitsiant tanlash ekrani ──────────────────────────────────────────
  if (step === "waiter")
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
            onClick={() => orderMutation.mutate()}
            disabled={!selectedWaiter || orderMutation.isPending}
            className="btn-primary w-full justify-center py-4 text-base"
          >
            {orderMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShoppingBag className="w-5 h-5" />
            )}
            Buyurtma berish · {formatPrice(total)}
          </button>
        </div>
      </div>
    );

  // ─── Menyu ekrani ──────────────────────────────────────────────────────
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
            <p className="text-xs text-gray-500">Stoldan buyurtma bering</p>
          </div>
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
            onClick={() => setStep("waiter")}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center text-sm font-bold">
                {cartItemsFiltered.reduce((s, [, q]) => s + (q as number), 0)}
              </span>
              <span className="font-bold">Buyurtma berish</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{formatPrice(total)}</span>
              <ChevronRight className="w-5 h-5" />
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
