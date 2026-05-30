"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuApi, inventoryApi, customProductTypeApi } from "@/lib/services";
import { PRODUCT_TYPE_LABELS, formatPrice } from "@/lib/utils";
import type { MenuItem, InventoryItem, RecipeLine, ProductType } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";
import {
  UtensilsCrossed,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Package,
} from "lucide-react";
import clsx from "clsx";

const BASE_TYPES = [
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

// ─── RETSEPT QATOR ────────────────────────────────────────────
function RecipeRow({
  line,
  inventoryItems,
  onChange,
  onRemove,
}: {
  line: { inv_id: string; qty: string };
  inventoryItems: InventoryItem[];
  onChange: (field: "inv_id" | "qty", val: string) => void;
  onRemove: () => void;
}) {
  const selected = inventoryItems.find((i) => i.id === line.inv_id);
  const unitLabel = selected
    ? selected.unit === "custom"
      ? selected.custom_unit || "?"
      : selected.unit
    : "";

  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
      <select
        className="input flex-1 text-sm py-1.5"
        value={line.inv_id}
        onChange={(e) => onChange("inv_id", e.target.value)}
      >
        <option value="">-- Ingredient tanlang --</option>
        {inventoryItems.map((inv) => (
          <option key={inv.id} value={inv.id}>
            {inv.name} ({inv.unit === "custom" ? inv.custom_unit : inv.unit})
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          type="number"
          className="input w-20 text-sm py-1.5"
          placeholder="0"
          min={0.001}
          step={0.001}
          value={line.qty}
          onChange={(e) => onChange("qty", e.target.value)}
        />
        {unitLabel && (
          <span className="text-xs text-gray-500 w-8 flex-shrink-0">
            {unitLabel}
          </span>
        )}
      </div>
      <button
        onClick={onRemove}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 flex-shrink-0"
      >
        <X className="w-3.5 h-3.5 text-red-500" />
      </button>
    </div>
  );
}

// ─── MENYU MODAL ──────────────────────────────────────────────
function MenuModal({
  item,
  allTypesForSelect,
  inventoryItems,
  onClose,
}: {
  item?: MenuItem;
  allTypesForSelect: { key: string; label: string }[];
  inventoryItems: InventoryItem[];
  onClose: () => void;
}) {
  const qc = useQueryClient();

  // Retseptni state formatiga o'girish
  const initRecipe = (item?.recipe || []).map((r) => ({
    inv_id: r.inventory_item_id,
    qty: String(r.quantity),
  }));

  const [form, setForm] = useState({
    name: item?.name || "",
    price: item?.price?.toString() || "",
    type: item?.type || "food",
    image_url: item?.image_url || "",
    is_available: item?.is_available ?? true,
  });
  const [recipe, setRecipe] =
    useState<{ inv_id: string; qty: string }[]>(initRecipe);
  const [showRecipe, setShowRecipe] = useState(initRecipe.length > 0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nom talab qilinadi";
    const p = parseFloat(form.price);
    if (isNaN(p) || p < 0) e.price = "Narx to'g'ri emas";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: () => {
      const validRecipe = recipe
        .filter((r) => r.inv_id && parseFloat(r.qty) > 0)
        .map((r) => ({
          inventory_item_id: r.inv_id,
          quantity: parseFloat(r.qty),
        }));

      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        type: form.type,
        image_url: form.image_url || undefined,
        is_available: form.is_available,
        recipe: validRecipe,
      };
      return item ? menuApi.update(item.id, payload) : menuApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success(item ? "Yangilandi" : "Menyu mahsuloti qo'shildi");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const addRecipeLine = () => setRecipe((p) => [...p, { inv_id: "", qty: "" }]);

  const updateLine = (idx: number, field: "inv_id" | "qty", val: string) =>
    setRecipe((p) => p.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));

  const removeLine = (idx: number) =>
    setRecipe((p) => p.filter((_, i) => i !== idx));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg animate-slideUp max-h-[93vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">
            {item ? "Menyuni tahrirlash" : "Menyu mahsuloti qo'shish"}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Nom */}
          <div>
            <label className="label">Nomi *</label>
            <input
              className={clsx("input", errors.name && "border-red-400")}
              placeholder="Osh, Lag'mon..."
              value={form.name}
              maxLength={200}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Narx */}
          <div>
            <label className="label">Narxi (so'm) *</label>
            <input
              className={clsx("input", errors.price && "border-red-400")}
              type="number"
              placeholder="25000"
              min={0}
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({ ...p, price: e.target.value }))
              }
            />
            {errors.price && (
              <p className="text-xs text-red-500 mt-1">{errors.price}</p>
            )}
          </div>

          {/* Tur */}
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
                    {PRODUCT_TYPE_LABELS[t as ProductType] || t}
                  </option>
                ))}
              </optgroup>
              {allTypesForSelect.filter((t) => !BASE_TYPES.includes(t.key))
                .length > 0 && (
                <optgroup label="Maxsus turlar">
                  {allTypesForSelect
                    .filter((t) => !BASE_TYPES.includes(t.key))
                    .map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Rasm */}
          <div>
            <label className="label">Rasm URL (ixtiyoriy)</label>
            <input
              className="input"
              placeholder="https://..."
              value={form.image_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, image_url: e.target.value }))
              }
            />
          </div>

          {/* Mavjudlik */}
          {item && (
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

          {/* ─── RETSEPT BO'LIMI ─── */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowRecipe((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-all"
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-800">
                  Retsept (1 porsiya ingredientlari)
                </span>
                {recipe.filter((r) => r.inv_id).length > 0 && (
                  <span className="bg-orange-200 text-orange-800 text-xs font-bold rounded-full px-2 py-0.5">
                    {recipe.filter((r) => r.inv_id).length}
                  </span>
                )}
              </div>
              {showRecipe ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showRecipe && (
              <div className="p-4 space-y-2">
                {inventoryItems.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-400">
                    Omborxonada ingredient yo'q. Avval ingredient qo'shing.
                  </div>
                ) : (
                  <>
                    {recipe.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">
                        Hali ingredient qo'shilmagan
                      </p>
                    ) : (
                      recipe.map((line, idx) => (
                        <RecipeRow
                          key={idx}
                          line={line}
                          inventoryItems={inventoryItems}
                          onChange={(field, val) => updateLine(idx, field, val)}
                          onRemove={() => removeLine(idx)}
                        />
                      ))
                    )}
                    <button
                      onClick={addRecipeLine}
                      className="w-full flex items-center justify-center gap-2 text-sm text-orange-600 font-semibold py-2 border-2 border-dashed border-orange-200 rounded-xl hover:bg-orange-50 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Ingredient qo'shish
                    </button>
                    <p className="text-xs text-gray-400">
                      * Miqdorlar 1 porsiya uchun. Buyurtmada avtomatik ombordan
                      ayiriladi.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              Bekor
            </button>
            <button
              onClick={() => {
                if (validate()) mutation.mutate();
              }}
              disabled={mutation.isPending}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {item ? "Saqlash" : "Qo'shish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ASOSIY SAHIFA ────────────────────────────────────────────
export default function MenuManagePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | undefined>();
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const canEdit = ["manager", "storekeeper", "super_admin"].includes(
    user?.role || "",
  );

  // Barcha inventar itemlarni olish (retsept uchun)
  const { data: invData } = useQuery({
    queryKey: ["inventory-all"],
    queryFn: () => inventoryApi.getAll({ limit: 200 }),
    enabled: canEdit,
  });
  const inventoryItems: InventoryItem[] = invData?.data?.data || [];

  // Custom product types
  const { data: customTypesData } = useQuery({
    queryKey: ["custom-product-types"],
    queryFn: () => customProductTypeApi.getAll(),
  });
  const customTypes = (customTypesData?.data?.data || []) as any[];

  const allTypesForSelect = [
    ...BASE_TYPES.map((t) => ({
      key: t,
      label: PRODUCT_TYPE_LABELS[t as ProductType] || t,
    })),
    ...customTypes.map((t: any) => ({ key: t.key, label: t.label })),
  ];
  const typeLabels: Record<string, string> = Object.fromEntries(
    allTypesForSelect.map((t) => [t.key, t.label]),
  );

  // Menu itemlarni olish
  const { data, isLoading } = useQuery({
    queryKey: ["menu-items", activeType, search, page],
    queryFn: () =>
      menuApi.getAll({
        type: activeType !== "all" ? activeType : undefined,
        search: search || undefined,
        page,
        limit: 20,
      }),
  });

  const items: MenuItem[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("O'chirildi");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, val }: { id: string; val: boolean }) =>
      menuApi.toggleAvailability(id, val),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Menyu boshqaruvi</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Menyudagi taomlar va ularning retseptlari
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditItem(undefined);
              setShowModal(true);
            }}
            className="btn-primary text-sm py-2 px-3"
          >
            <Plus className="w-4 h-4" /> Taom qo'shish
          </button>
        )}
      </div>

      {/* Qidiruv */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Qidirish..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
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

      {/* Tur filterlari */}
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

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Menyu bo'sh</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={clsx(
                "bg-white rounded-2xl border-2 overflow-hidden transition-all",
                item.is_available
                  ? "border-gray-100"
                  : "border-red-100 opacity-80",
              )}
            >
              <div className="flex items-center gap-3 p-3">
                {/* Rasm */}
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
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
                      <Package className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {typeLabels[item.type] || item.type}
                      </p>
                    </div>
                    <p className="text-green-600 font-bold text-sm flex-shrink-0">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  {/* Retsept ko'rsatkichi */}
                  {item.recipe && item.recipe.length > 0 && (
                    <button
                      onClick={() =>
                        setExpandedRecipe(
                          expandedRecipe === item.id ? null : item.id,
                        )
                      }
                      className="mt-1.5 flex items-center gap-1 text-xs text-orange-600 font-semibold hover:text-orange-700"
                    >
                      <FlaskConical className="w-3 h-3" />
                      {item.recipe.length} ingredient
                      {expandedRecipe === item.id ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                {/* Tugmalar */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() =>
                      toggleMutation.mutate({
                        id: item.id,
                        val: !item.is_available,
                      })
                    }
                    className={clsx(
                      "text-xs font-semibold py-1.5 px-2 rounded-lg transition-all",
                      item.is_available
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-red-50 text-red-600 hover:bg-red-100",
                    )}
                  >
                    {item.is_available ? "Mavjud" : "Yo'q"}
                  </button>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => {
                          setEditItem(item);
                          setShowModal(true);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("O'chirishni tasdiqlaysizmi?"))
                            deleteMutation.mutate(item.id);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Retsept kengaymasi */}
              {expandedRecipe === item.id && item.recipe.length > 0 && (
                <div className="px-4 pb-3 border-t border-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide my-2">
                    1 porsiya uchun retsept
                  </p>
                  <div className="space-y-1">
                    {item.recipe.map((r, idx) => {
                      const unit =
                        r.inventory_unit === "custom"
                          ? r.inventory_custom_unit || "?"
                          : r.inventory_unit || "";
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">
                            {r.inventory_name}
                          </span>
                          <span className="font-semibold text-orange-600">
                            {parseFloat(r.quantity as any) % 1 === 0
                              ? parseFloat(r.quantity as any)
                              : parseFloat(r.quantity as any).toFixed(3)}{" "}
                            {unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
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
        <MenuModal
          item={editItem}
          allTypesForSelect={allTypesForSelect}
          inventoryItems={inventoryItems}
          onClose={() => {
            setShowModal(false);
            setEditItem(undefined);
          }}
        />
      )}
    </div>
  );
}
