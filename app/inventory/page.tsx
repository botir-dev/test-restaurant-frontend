"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import { LockedFeature } from "@/components/ui/LockedFeature";
import type { InventoryItem, InventoryUnit } from "@/types";
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
  PlusCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";

const UNIT_LABELS: Record<InventoryUnit | string, string> = {
  kg: "kg",
  L: "L (litr)",
  dona: "dona",
  g: "g (gram)",
  ml: "ml",
  custom: "Boshqa",
};

const UNIT_SHORT: Record<string, string> = {
  kg: "kg",
  L: "L",
  dona: "dona",
  g: "g",
  ml: "ml",
};

function unitDisplay(item: InventoryItem) {
  if (item.unit === "custom") return item.custom_unit || "?";
  return UNIT_SHORT[item.unit] || item.unit;
}

// ─── OMBORGA QO'SHISH MODAL ──────────────────────────────────
function AddStockModal({
  item,
  onClose,
}: {
  item: InventoryItem;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [costPrice, setCostPrice] = useState(
    item.cost_price ? String(item.cost_price) : "",
  );

  const mutation = useMutation({
    mutationFn: () =>
      inventoryApi.addStock(
        item.id,
        parseFloat(amount),
        costPrice ? parseFloat(costPrice) : null,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(`+${amount} ${unitDisplay(item)} qo'shildi`);
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm animate-slideUp">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Ombor to'ldirish</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {item.name} · joriy: {parseFloat(item.quantity as any).toFixed(3)}{" "}
              {unitDisplay(item)}
            </p>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">
              Qo'shiladigan miqdor ({unitDisplay(item)}) *
            </label>
            <input
              className="input"
              type="number"
              min={0.001}
              step={0.001}
              placeholder="50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">
              Tannarx (1 {unitDisplay(item)} uchun, so'm)
            </label>
            <input
              className="input"
              type="number"
              min={0}
              step={1}
              placeholder="12000"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>
          {amount && !isNaN(parseFloat(amount)) && (
            <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-green-700 space-y-1">
              <div>
                Yangi miqdor:{" "}
                <strong>
                  {(
                    parseFloat(item.quantity as any) + parseFloat(amount)
                  ).toFixed(3)}{" "}
                  {unitDisplay(item)}
                </strong>
              </div>
              {costPrice &&
                !isNaN(parseFloat(costPrice)) &&
                parseFloat(costPrice) > 0 && (
                  <div className="text-green-600">
                    Umumiy qiymat:{" "}
                    <strong>
                      {(
                        (parseFloat(item.quantity as any) +
                          parseFloat(amount)) *
                        parseFloat(costPrice)
                      ).toLocaleString("uz-UZ")}{" "}
                      so'm
                    </strong>
                  </div>
                )}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              Bekor
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={
                !amount ||
                isNaN(parseFloat(amount)) ||
                parseFloat(amount) <= 0 ||
                mutation.isPending
              }
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAHSULOT MODAL (qo'shish / tahrirlash) ──────────────────
function InventoryModal({
  item,
  onClose,
}: {
  item?: InventoryItem;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: item?.name || "",
    unit: (item?.unit || "kg") as InventoryUnit,
    custom_unit: item?.custom_unit || "",
    quantity: item ? String(parseFloat(item.quantity as any)) : "0",
    min_quantity: item ? String(parseFloat(item.min_quantity as any)) : "0",
    image_url: item?.image_url || "",
    cost_price: item?.cost_price ? String(item.cost_price) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nom talab qilinadi";
    if (form.unit === "custom" && !form.custom_unit.trim())
      e.custom_unit = "Birlik nomi talab qilinadi";
    const q = parseFloat(form.quantity);
    if (isNaN(q) || q < 0) e.quantity = "Miqdor 0 dan katta bo'lishi kerak";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        unit: form.unit,
        custom_unit:
          form.unit === "custom" ? form.custom_unit.trim() : undefined,
        quantity: parseFloat(form.quantity) || 0,
        min_quantity: parseFloat(form.min_quantity) || 0,
        image_url: form.image_url || undefined,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      };
      return item
        ? inventoryApi.update(item.id, payload)
        : inventoryApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(item ? "Yangilandi" : "Qo'shildi");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md animate-slideUp max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">
            {item ? "Ingredientni tahrirlash" : "Yangi ingredient"}
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
              placeholder="Guruch"
              value={form.name}
              maxLength={200}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Birlik */}
          <div>
            <label className="label">O'lchov birligi *</label>
            <select
              className="input"
              value={form.unit}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  unit: e.target.value as InventoryUnit,
                }))
              }
            >
              {Object.entries(UNIT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {form.unit === "custom" && (
            <div>
              <label className="label">Birlik nomi *</label>
              <input
                className={clsx(
                  "input",
                  errors.custom_unit && "border-red-400",
                )}
                placeholder="quti, paket, limon..."
                value={form.custom_unit}
                maxLength={50}
                onChange={(e) =>
                  setForm((p) => ({ ...p, custom_unit: e.target.value }))
                }
              />
              {errors.custom_unit && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.custom_unit}
                </p>
              )}
            </div>
          )}

          {/* Joriy miqdor */}
          <div>
            <label className="label">
              Joriy miqdor (
              {form.unit === "custom" ? form.custom_unit || "?" : form.unit})
            </label>
            <input
              className={clsx("input", errors.quantity && "border-red-400")}
              type="number"
              min={0}
              step={0.001}
              placeholder="50"
              value={form.quantity}
              onChange={(e) =>
                setForm((p) => ({ ...p, quantity: e.target.value }))
              }
            />
            {errors.quantity && (
              <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Minimum miqdor */}
          <div>
            <label className="label">
              Minimum miqdor (ogohlantirish chegarasi)
            </label>
            <input
              className="input"
              type="number"
              min={0}
              step={0.001}
              placeholder="5"
              value={form.min_quantity}
              onChange={(e) =>
                setForm((p) => ({ ...p, min_quantity: e.target.value }))
              }
            />
            <p className="text-xs text-gray-400 mt-1">
              Bu miqdordan kam bo'lsa ogohlantirish ko'rsatiladi
            </p>
          </div>

          {/* Rasm */}
          <div>
            <label className="label">Rasm URL (ixtiyoriy)</label>
            <input
              className="input"
              placeholder="https://example.com/image.jpg"
              value={form.image_url}
              maxLength={500}
              onChange={(e) =>
                setForm((p) => ({ ...p, image_url: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="label">
              Tannarx (1{" "}
              {form.unit === "custom"
                ? form.custom_unit || "birlik"
                : form.unit}{" "}
              uchun, so'm)
            </label>
            <input
              className="input"
              type="number"
              min={0}
              step={1}
              placeholder="12000"
              value={form.cost_price}
              onChange={(e) =>
                setForm((p) => ({ ...p, cost_price: e.target.value }))
              }
            />
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
export default function InventoryPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | undefined>();
  const [addStockItem, setAddStockItem] = useState<InventoryItem | undefined>();
  const [page, setPage] = useState(1);

  const canEdit = ["manager", "storekeeper", "super_admin"].includes(
    user?.role || "",
  );

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", search, page],
    queryFn: () =>
      inventoryApi.getAll({ search: search || undefined, page, limit: 24 }),
  });

  const items: InventoryItem[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("O'chirildi");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <LockedFeature featureKey="inventory" featureName="Ombor boshqaruvi">
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Omborxona</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Ingredientlar va xom ashyo zaxirasi
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
              <Plus className="w-4 h-4" /> Ingredient qo'shish
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

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Ingredient topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => {
              const qty = parseFloat(item.quantity as any);
              const minQty = parseFloat(item.min_quantity as any);
              const isLow = minQty > 0 && qty <= minQty;
              const unit = unitDisplay(item);
              return (
                <div
                  key={item.id}
                  className={clsx(
                    "bg-white rounded-2xl border-2 overflow-hidden transition-all",
                    isLow ? "border-orange-200" : "border-gray-100",
                  )}
                >
                  {/* Rasm */}
                  <div className="h-24 bg-gray-50 relative overflow-hidden">
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
                        <Package className="w-7 h-7 text-gray-300" />
                      </div>
                    )}
                    {isLow && (
                      <div className="absolute top-1.5 right-1.5 bg-orange-500 text-white rounded-lg px-1.5 py-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-xs font-bold">Kam</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {item.name}
                    </p>

                    {/* Miqdor */}
                    <div
                      className={clsx(
                        "mt-1.5 rounded-lg px-2 py-1 text-center",
                        isLow ? "bg-orange-50" : "bg-green-50",
                      )}
                    >
                      <span
                        className={clsx(
                          "font-bold text-sm",
                          isLow ? "text-orange-600" : "text-green-700",
                        )}
                      >
                        {qty % 1 === 0 ? qty : qty.toFixed(3)}
                      </span>
                      <span
                        className={clsx(
                          "text-xs ml-1",
                          isLow ? "text-orange-500" : "text-green-600",
                        )}
                      >
                        {unit}
                      </span>
                    </div>

                    {minQty > 0 && (
                      <p className="text-xs text-gray-400 mt-1 text-center">
                        min: {minQty} {unit}
                      </p>
                    )}

                    {/* Tannarx va umumiy qiymat - faqat manager ko'radi */}
                    {item.cost_price != null && item.cost_price > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-2 py-1">
                          <span className="text-xs text-blue-500 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />1 {unit}
                          </span>
                          <span className="text-xs font-semibold text-blue-700">
                            {Number(item.cost_price).toLocaleString("uz-UZ")}{" "}
                            so'm
                          </span>
                        </div>
                        {item.total_cost != null && item.total_cost > 0 && (
                          <div className="flex items-center justify-between bg-purple-50 rounded-lg px-2 py-1">
                            <span className="text-xs text-purple-500 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Jami
                            </span>
                            <span className="text-xs font-semibold text-purple-700">
                              {Number(item.total_cost).toLocaleString("uz-UZ")}{" "}
                              so'm
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tugmalar */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {canEdit && (
                        <button
                          onClick={() => setAddStockItem(item)}
                          className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                          title="Ombor to'ldirish"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Qo'sh
                        </button>
                      )}
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
                </div>
              );
            })}
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
          <InventoryModal
            item={editItem}
            onClose={() => {
              setShowModal(false);
              setEditItem(undefined);
            }}
          />
        )}
        {addStockItem && (
          <AddStockModal
            item={addStockItem}
            onClose={() => setAddStockItem(undefined)}
          />
        )}
      </div>
    </LockedFeature>
  );
}
