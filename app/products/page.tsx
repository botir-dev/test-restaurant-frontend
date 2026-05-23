"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi, customProductTypeApi } from "@/lib/services";
import {
  PRODUCT_TYPE_LABELS,
  ROLE_PRODUCT_MAP,
  formatPrice,
} from "@/lib/utils";
import type { Product, ProductType } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";
import {
  Package,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Loader2,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import clsx from "clsx";

const BASE_TYPES: ProductType[] = [
  "food",
  "bread",
  "somsa",
  "grill",
  "turkish",
  "drink",
  "icecream",
  "tea",
  "other",
];

// ─── Image URL SSRF validator (frontend) ──────────────────────
const isValidImageUrl = (url: string): boolean => {
  if (!url) return true; // ixtiyoriy
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const h = parsed.hostname.toLowerCase();
    if (
      h === "localhost" ||
      h.startsWith("127.") ||
      h.startsWith("10.") ||
      h.startsWith("192.168.") ||
      h === "0.0.0.0" ||
      h.endsWith(".local")
    )
      return false;
    return true;
  } catch {
    return false;
  }
};

function ProductTypeManager({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ key: "", label: "" });
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["custom-product-types"],
    queryFn: () => customProductTypeApi.getAll(),
  });
  const customTypes = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: () =>
      customProductTypeApi.create({
        key:
          form.key.trim().toLowerCase().replace(/\s+/g, "_") ||
          form.label.trim().toLowerCase().replace(/\s+/g, "_"),
        label: form.label.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-product-types"] });
      toast.success("Yangi taom turi yaratildi!");
      setForm({ key: "", label: "" });
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customProductTypeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-product-types"] });
      toast.success("O'chirildi");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-900">
              Taom turlarini boshqarish
            </h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Maxsus turlar
            </p>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              </div>
            ) : (customTypes as any[]).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">
                Hozircha maxsus tur yo'q
              </p>
            ) : (
              <div className="space-y-2">
                {(customTypes as any[]).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between bg-orange-50 rounded-xl px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-orange-800">
                        {t.label}
                      </p>
                      <p className="text-xs text-orange-500">key: {t.key}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm("O'chirishni tasdiqlaysizmi?"))
                          deleteMutation.mutate(t.id);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => setShowForm((p) => !p)}
              className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-3"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-500" /> Yangi tur yaratish
              </span>
              {showForm ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showForm && (
              <div className="space-y-3 bg-orange-50 rounded-xl p-3">
                <div>
                  <label className="label">Tur nomi *</label>
                  <input
                    className="input"
                    placeholder="Salat"
                    value={form.label}
                    maxLength={100}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, label: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Kalit so'z (ixtiyoriy)</label>
                  <input
                    className="input"
                    placeholder="salat"
                    value={form.key}
                    maxLength={50}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        key: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, ""),
                      }))
                    }
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Bo'sh qoldirsangiz nomdan avtomatik yaratiladi
                  </p>
                </div>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !form.label.trim()}
                  className="btn-primary w-full justify-center text-sm py-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Tur yaratish
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-secondary w-full justify-center"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModalFull({
  product,
  allTypesForSelect,
  onClose,
}: {
  product?: Product;
  allTypesForSelect: { key: string; label: string }[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: product?.name || "",
    price: product?.price?.toString() || "",
    type: (product?.type as string) || "food",
    image_url: product?.image_url || "",
    is_available: product?.is_available ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nom kiritilishi shart";
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) e.price = "Narx 0 dan katta bo'lishi kerak";
    if (price > 99_999_999) e.price = "Narx juda katta";
    if (form.image_url && !isValidImageUrl(form.image_url))
      e.image_url = "Faqat https:// manzillar qabul qilinadi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        type: form.type as ProductType,
        image_url: form.image_url || undefined,
        ...(product ? { is_available: form.is_available } : {}),
      };
      return product
        ? productApi.update(product.id, payload)
        : productApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(product ? "Yangilandi" : "Qo'shildi");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const handleSubmit = () => {
    if (validate()) mutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">
            {product ? "Tahrirlash" : "Yangi mahsulot"}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="label">Nomi *</label>
            <input
              className={clsx("input", errors.name && "border-red-400")}
              placeholder="Lag'mon"
              value={form.name}
              maxLength={200}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="label">Narxi (so'm) *</label>
            <input
              className={clsx("input", errors.price && "border-red-400")}
              type="number"
              placeholder="25000"
              min={0}
              max={99999999}
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({ ...p, price: e.target.value }))
              }
            />
            {errors.price && (
              <p className="text-xs text-red-500 mt-1">{errors.price}</p>
            )}
          </div>
          <div>
            <label className="label">Turi *</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              <optgroup label="Standart turlar">
                {BASE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PRODUCT_TYPE_LABELS[t]}
                  </option>
                ))}
              </optgroup>
              {allTypesForSelect.filter(
                (t) => !BASE_TYPES.includes(t.key as ProductType),
              ).length > 0 && (
                <optgroup label="Maxsus turlar">
                  {allTypesForSelect
                    .filter((t) => !BASE_TYPES.includes(t.key as ProductType))
                    .map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="label">Rasm URL</label>
            <input
              className={clsx("input", errors.image_url && "border-red-400")}
              placeholder="https://example.com/image.jpg"
              value={form.image_url}
              maxLength={500}
              onChange={(e) =>
                setForm((p) => ({ ...p, image_url: e.target.value }))
              }
            />
            {errors.image_url ? (
              <p className="text-xs text-red-500 mt-1">{errors.image_url}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Faqat https:// bilan boshlanadigan URL
              </p>
            )}
          </div>
          {product && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">
                Mavjud
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, is_available: !p.is_available }))
                }
                className={clsx(
                  "relative w-11 h-6 rounded-full transition-all",
                  form.is_available ? "bg-green-500" : "bg-gray-300",
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
                    form.is_available ? "left-5" : "left-0.5",
                  )}
                />
              </button>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              Bekor
            </button>
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {product ? "Saqlash" : "Qo'shish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [page, setPage] = useState(1);

  const { data: customTypesData } = useQuery({
    queryKey: ["custom-product-types"],
    queryFn: () => customProductTypeApi.getAll(),
    enabled: user?.role === "manager" || user?.role === "storekeeper",
  });

  const customTypes = (customTypesData?.data?.data || []) as any[];

  const NON_PREPARER = [
    "manager",
    "waiter",
    "cashier",
    "storekeeper",
    "super_admin",
  ];
  const isPreparerUser = user ? !NON_PREPARER.includes(user.role) : false;

  const userAllowedTypes: string[] = (() => {
    if (!user || !isPreparerUser) return [];
    const types = new Set<string>(user.extra_permissions || []);
    const stdType = (ROLE_PRODUCT_MAP as Record<string, string>)[user.role];
    if (stdType) types.add(stdType);
    return Array.from(types);
  })();

  const allTypesForSelect = [
    ...BASE_TYPES.map((t) => ({ key: t, label: PRODUCT_TYPE_LABELS[t] })),
    ...customTypes.map((t) => ({ key: t.key, label: t.label })),
  ];
  const allTypeLabels: Record<string, string> = Object.fromEntries(
    allTypesForSelect.map((t) => [t.key, t.label]),
  );

  const canEdit = user?.role === "manager" || user?.role === "storekeeper";
  const canToggle = canEdit || isPreparerUser;

  const { data, isLoading } = useQuery({
    queryKey: ["products", activeType, page],
    queryFn: () =>
      productApi.getAll({
        type: activeType !== "all" ? (activeType as ProductType) : undefined,
        page,
        limit: 20,
      }),
  });

  const products: Product[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (isPreparerUser && userAllowedTypes.length > 0) {
      return userAllowedTypes.includes(p.type);
    }
    return true;
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("O'chirildi");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) =>
      productApi.toggleAvailability(id, val),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Ruxsat yo'q"),
  });

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        "O'chirishni tasdiqlaysizmi? Agar faol buyurtmalarda bo'lsa, backend bloklaydi.",
      )
    )
      deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Mahsulotlar</h1>
          {isPreparerUser && userAllowedTypes.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              Sizga biriktirilgan:{" "}
              {userAllowedTypes.map((t) => allTypeLabels[t] || t).join(", ")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => setShowTypeManager(true)}
              className="btn-secondary text-sm py-2 px-3"
            >
              <Layers className="w-4 h-4" /> Turlar
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => {
                setEditProduct(undefined);
                setShowModal(true);
              }}
              className="btn-primary text-sm py-2 px-3"
            >
              <Plus className="w-4 h-4" /> Qo'shish
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Qidirish..."
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

      {!isPreparerUser && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setActiveType("all");
              setPage(1);
            }}
            className={clsx(
              "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
              activeType === "all"
                ? "bg-green-600 text-white"
                : "bg-white border border-gray-200 text-gray-600",
            )}
          >
            Hammasi
          </button>
          {allTypesForSelect.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setActiveType(key);
                setPage(1);
              }}
              className={clsx(
                "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                activeType === key
                  ? "bg-green-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-green-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Mahsulot topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((product) => (
            <div
              key={product.id}
              className={clsx(
                "bg-white rounded-2xl border-2 overflow-hidden transition-all",
                product.is_available
                  ? "border-gray-100"
                  : "border-red-100 opacity-70",
              )}
            >
              <div className="h-28 bg-gray-100 relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                {!product.is_available && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <span className="badge bg-red-500 text-white text-xs">
                      Mavjud emas
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {product.name}
                </p>
                <p className="text-xs text-gray-400">
                  {allTypeLabels[product.type] || product.type}
                </p>
                <p className="text-green-600 font-bold text-sm mt-1">
                  {formatPrice(product.price)}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {canToggle && (
                    <button
                      onClick={() =>
                        toggleMutation.mutate({
                          id: product.id,
                          val: !product.is_available,
                        })
                      }
                      className={clsx(
                        "flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all",
                        product.is_available
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-red-50 text-red-600 hover:bg-red-100",
                      )}
                    >
                      {product.is_available ? "Mavjud" : "Yo'q"}
                    </button>
                  )}
                  {canEdit && (
                    <>
                      <button
                        onClick={() => {
                          setEditProduct(product);
                          setShowModal(true);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary py-1.5 px-3 text-sm"
          >
            ← Oldingi
          </button>
          <span className="text-sm text-gray-600">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages}
            className="btn-secondary py-1.5 px-3 text-sm"
          >
            Keyingi →
          </button>
        </div>
      )}

      {showModal && (
        <ProductModalFull
          product={editProduct}
          allTypesForSelect={allTypesForSelect}
          onClose={() => {
            setShowModal(false);
            setEditProduct(undefined);
          }}
        />
      )}
      {showTypeManager && (
        <ProductTypeManager onClose={() => setShowTypeManager(false)} />
      )}
    </div>
  );
}
