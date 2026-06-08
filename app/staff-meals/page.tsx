"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffMealApi, menuApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Soup,
  Plus,
  Trash2,
  Loader2,
  Search,
  X,
  ChefHat,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";

const today = () => new Date().toISOString().split("T")[0];
const monthAgo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split("T")[0];
};

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("uz-UZ") : "-";
const fmtTime = (d: string) =>
  d
    ? new Date(d).toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

// ─── Taom qo'shish modal ────────────────────────────────────────
function AddMealModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (data: {
    menu_item_id: string;
    quantity: number;
    note?: string;
  }) => void;
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ["menu-for-staff-meal", search],
    queryFn: () => menuApi.getAll({ search: search || undefined, limit: 50 }),
  });

  const menuItems: any[] = menuData?.data?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Soup className="w-5 h-5 text-orange-500" />
            Staff Meal kiritish
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Taom tanlash */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Taom tanlang
          </label>
          {selectedItem ? (
            <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <span className="font-medium text-orange-800">
                {selectedItem.name}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-orange-400 hover:text-orange-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Taom nomini kiriting..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-44 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                {menuLoading ? (
                  <div className="p-3 text-center text-gray-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />{" "}
                    Yuklanmoqda...
                  </div>
                ) : menuItems.length === 0 ? (
                  <div className="p-3 text-center text-gray-400 text-sm">
                    Taom topilmadi
                  </div>
                ) : (
                  menuItems.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        setSelectedItem({ id: item.id, name: item.name })
                      }
                      className="w-full text-left px-4 py-2.5 hover:bg-orange-50 text-sm"
                    >
                      <span className="font-medium">{item.name}</span>
                      {!item.is_available && (
                        <span className="ml-2 text-xs text-red-400">
                          (mavjud emas)
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Miqdor */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Portsiya soni
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={999}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(1, Math.min(999, parseInt(e.target.value) || 1)),
                )
              }
              className="w-20 text-center border border-gray-200 rounded-xl py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={() => setQuantity(Math.min(999, quantity + 1))}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg"
            >
              +
            </button>
          </div>
        </div>

        {/* Izoh */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Izoh (ixtiyoriy)
          </label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Masalan: tushlik, oshpaz uchun..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-xs text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Bu taom ombordan retsept bo'yicha ayiriladi, lekin daromad hisobida
            ko'rinmaydi. Ombor chiqimlari va harajat hisobotida ko'rinadi.
          </p>
        </div>

        <button
          disabled={!selectedItem || loading}
          onClick={() =>
            onSubmit({
              menu_item_id: selectedItem!.id,
              quantity,
              note: note.trim() || undefined,
            })
          }
          className={clsx(
            "w-full py-2.5 rounded-xl font-semibold transition-colors",
            selectedItem
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed",
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...
            </span>
          ) : (
            "Kiritish"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Asosiy sahifa ──────────────────────────────────────────────
export default function StaffMealsPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());

  const { data, isLoading } = useQuery({
    queryKey: ["staff-meals", from, to],
    queryFn: () =>
      staffMealApi.getAll({
        from: from ? `${from}T00:00:00` : undefined,
        to: to ? `${to}T23:59:59` : undefined,
        limit: 100,
      }),
  });

  const meals: any[] = data?.data?.data || [];
  const total: number = data?.data?.pagination?.total || 0;

  const createMutation = useMutation({
    mutationFn: staffMealApi.create,
    onSuccess: () => {
      toast.success("Staff meal kiritildi, ombordan ayirildi");
      queryClient.invalidateQueries({ queryKey: ["staff-meals"] });
      setShowAdd(false);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: staffMealApi.delete,
    onSuccess: () => {
      toast.success("O'chirildi, mahsulotlar omborga qaytarildi");
      queryClient.invalidateQueries({ queryKey: ["staff-meals"] });
    },
    onError: (e: any) => {
      toast.error(
        e?.response?.data?.message ||
          "Faqat bugun kiritilganini o'chirish mumkin",
      );
    },
  });

  const todayStr = today();
  const isToday = (dateStr: string) =>
    new Date(dateStr).toISOString().split("T")[0] === todayStr;

  // Kunlik yig'ma
  const totalPortions = meals.reduce((s: number, m: any) => s + m.quantity, 0);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Soup className="w-7 h-7 text-orange-500" />
            Staff Meal
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Xodimlar uchun taomlar — ombordan ayiriladi, daromadda ko'rinmaydi
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Kiritish
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Dan
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Gacha
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {totalPortions > 0 && (
            <div className="ml-auto bg-orange-50 border border-orange-100 rounded-xl px-4 py-2 text-sm">
              <span className="text-gray-500">Jami: </span>
              <span className="font-bold text-orange-600">
                {totalPortions} portsiya
              </span>
              <span className="text-gray-400 ml-1">({total} yozuv)</span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Yuklanmoqda...
          </div>
        ) : meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ChefHat className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Bu davrda staff meal yo'q</p>
            <p className="text-sm mt-1">
              Yuqoridagi "Kiritish" tugmasini bosing
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase">
                    Taom
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase">
                    Portsiya
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase">
                    Sana / Vaqt
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase">
                    Kim kiritdi
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase">
                    Izoh
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {meals.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {m.menu_item_name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center bg-orange-100 text-orange-700 font-bold rounded-full w-8 h-8 text-sm">
                        {m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div>{fmtDate(m.created_at)}</div>
                      <div className="text-xs text-gray-400">
                        {fmtTime(m.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {m.created_by_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">
                      {m.note || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {isToday(m.created_at) && (
                        <button
                          onClick={() => {
                            if (confirm("O'chirasizmi? Omborga qaytariladi."))
                              deleteMutation.mutate(m.id);
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="O'chirish (bugungi yozuv)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showAdd && (
        <AddMealModal
          onClose={() => setShowAdd(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
      )}
    </div>
  );
}
