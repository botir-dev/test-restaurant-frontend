"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tableApi, orderApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import {
  formatPrice,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/utils";
import type { Table, Order, OrderItem, Reservation } from "@/types";
import toast from "react-hot-toast";
import {
  Table2,
  Plus,
  Users,
  QrCode,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  UtensilsCrossed,
  Send,
  CreditCard,
  CalendarDays,
  Phone,
  Trash2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

// ─── TABLE CARD ──────────────────────────────────────────
function TableCard({ table }: { table: Table }) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: orderData } = useQuery({
    queryKey: ["order", table.current_order_id],
    queryFn: () => orderApi.getAll({ status: undefined }),
    enabled: !!table.current_order_id && expanded,
    select: (res) => {
      const orders: Order[] = res.data.data;
      return orders.find((o) => o.id === table.current_order_id);
    },
  });

  const freeMutation = useMutation({
    mutationFn: () => tableApi.free(table.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Stol bo'shatildi");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const sendMutation = useMutation({
    mutationFn: (orderId: string) => orderApi.sendToKitchen(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Oshxonaga yuborildi!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const completeMutation = useMutation({
    mutationFn: (orderId: string) => orderApi.complete(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      toast.success("To'lovga yuborildi!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const order = orderData;
  const isOccupied = table.is_occupied;
  const nextRes = table.next_reservation;

  return (
    <div
      className={clsx(
        "rounded-2xl border-2 transition-all duration-200",
        isOccupied
          ? "border-red-200 bg-red-50"
          : "border-green-200 bg-green-50",
      )}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => isOccupied && setExpanded((p) => !p)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                isOccupied
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white",
              )}
            >
              {table.table_number}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">
                {table.table_number}-stol
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Users className="w-3 h-3" /> {table.capacity} kishi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "badge text-xs",
                isOccupied
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700",
              )}
            >
              {isOccupied ? "Band" : "Bo'sh"}
            </span>
            {isOccupied && (
              <span className="text-gray-400">
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            )}
          </div>
        </div>

        {nextRes && !isOccupied && (
          <div className="mt-2 flex flex-col gap-0.5 bg-blue-50 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="text-xs text-blue-700 font-semibold truncate">
                {nextRes.full_name}
              </span>
            </div>
            <div className="flex items-center gap-3 pl-0.5">
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {nextRes.phone}
              </span>
              <span className="text-xs text-blue-500">
                {new Date(nextRes.reserved_at).toLocaleString("uz-UZ", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        )}

        {isOccupied && order && !expanded && (
          <div className="mt-2 flex items-center gap-2">
            <span className={clsx("badge", ORDER_STATUS_COLORS[order.status])}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
            <span className="text-xs text-gray-500">
              {order.items.length} ta mahsulot
            </span>
          </div>
        )}
      </div>

      {expanded && isOccupied && (
        <div className="border-t border-red-200 px-4 pb-4 animate-fadeIn">
          {!table.current_order_id ? (
            // ─── Stol band lekin buyurtma yo'q ──────────────
            <div className="py-3">
              <div className="text-center py-3 mb-3">
                <UtensilsCrossed className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-600">
                  Hali buyurtma berilmagan
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Stol band qilingan, buyurtma kutilmoqda
                </p>
              </div>
              <div className="space-y-2">
                {user?.role === "waiter" && (
                  <Link
                    href={`/tables/${table.id}/order`}
                    className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-semibold py-2 rounded-xl text-sm hover:bg-green-700 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Buyurtma qo'shish
                  </Link>
                )}
                {(user?.role === "manager" || user?.role === "waiter") && (
                  <button
                    onClick={() => freeMutation.mutate()}
                    disabled={freeMutation.isPending}
                    className="flex items-center justify-center gap-2 w-full border border-red-200 text-red-600 font-semibold py-2 rounded-xl text-sm hover:bg-red-50 transition-all"
                  >
                    {freeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Stolni bo'shatish
                  </button>
                )}
              </div>
            </div>
          ) : order ? (
            <>
              <div className="flex items-center justify-between py-2 mb-2">
                <span
                  className={clsx("badge", ORDER_STATUS_COLORS[order.status])}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <span className="text-xs text-gray-500">
                  {order.guest_count} mehmon
                </span>
              </div>
              <div className="space-y-1.5 mb-3">
                {order.items.map((item: OrderItem, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          item.is_prepared ? "bg-green-500" : "bg-amber-400",
                        )}
                      />
                      <span className="text-sm text-gray-800">{item.name}</span>
                      <span className="text-xs text-gray-400">
                        x{item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      {item.is_prepared ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center bg-white rounded-lg px-3 py-2 mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  Jami:
                </span>
                <span className="text-sm font-bold text-green-600">
                  {formatPrice(
                    order.items.reduce((s, i) => s + i.price * i.quantity, 0),
                  )}
                </span>
              </div>
              <div className="space-y-2">
                <Link
                  href={`/orders/${order.id}/add`}
                  className="flex items-center justify-center gap-2 w-full bg-white border border-green-200 text-green-700 font-semibold py-2 rounded-xl text-sm hover:bg-green-50 transition-all"
                >
                  <Plus className="w-4 h-4" /> Buyurtma qo'shish
                </Link>
                {order.status === "pending" && (
                  <button
                    onClick={() => sendMutation.mutate(order.id)}
                    disabled={sendMutation.isPending}
                    className="btn-primary w-full justify-center text-sm py-2"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Oshxonaga yuborish
                  </button>
                )}
                {order.status === "ready_to_serve" && (
                  <button
                    onClick={() => completeMutation.mutate(order.id)}
                    disabled={completeMutation.isPending}
                    className="btn-amber w-full justify-center text-sm py-2"
                  >
                    {completeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Kassaga yuborish
                  </button>
                )}
                {user?.role === "manager" && (
                  <button
                    onClick={() => freeMutation.mutate()}
                    disabled={freeMutation.isPending}
                    className="flex items-center justify-center gap-2 w-full border border-red-200 text-red-600 font-semibold py-2 rounded-xl text-sm hover:bg-red-50 transition-all"
                  >
                    <X className="w-4 h-4" /> Stolni bo'shatish
                  </button>
                )}
              </div>
            </>
          ) : (
            // current_order_id bor lekin order hali yuklanmoqda
            <div className="py-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
            </div>
          )}
        </div>
      )}

      {!isOccupied && user?.role === "waiter" && (
        <div className="px-4 pb-4">
          <Link
            href={`/tables/${table.id}/occupy`}
            className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-semibold py-2 rounded-xl text-sm hover:bg-green-700 transition-all"
          >
            <UtensilsCrossed className="w-4 h-4" /> Xizmat boshlash
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── ADD TABLE MODAL ─────────────────────────────────────
function AddTableModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ table_number: "", capacity: "4" });

  const mutation = useMutation({
    mutationFn: () =>
      tableApi.create({
        table_number: Number(form.table_number),
        capacity: Number(form.capacity),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Stol yaratildi");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Yangi stol qo'shish</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Stol raqami</label>
            <input
              className="input"
              type="number"
              placeholder="1"
              value={form.table_number}
              onChange={(e) =>
                setForm((p) => ({ ...p, table_number: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Sig'imi (nechta kishi)</label>
            <input
              className="input"
              type="number"
              placeholder="4"
              value={form.capacity}
              onChange={(e) =>
                setForm((p) => ({ ...p, capacity: e.target.value }))
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
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.table_number}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RESERVATION MODAL ───────────────────────────────────
function ReservationModal({
  tableId,
  tableNumber,
  onClose,
}: {
  tableId?: string;
  tableNumber?: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: tablesData } = useQuery({
    queryKey: ["tables"],
    queryFn: () => tableApi.getAll(),
    enabled: !tableId,
  });
  const tables: Table[] = (tablesData?.data?.data || []).filter(
    (t: Table) => !t.is_virtual,
  );

  const [form, setForm] = useState({
    table_id: tableId || "",
    full_name: "",
    phone: "",
    reserved_at: "",
    duration_min: "60",
    guest_count: "2",
  });

  const mutation = useMutation({
    mutationFn: () =>
      tableApi.createReservation({
        table_id: form.table_id,
        full_name: form.full_name,
        phone: form.phone,
        reserved_at: form.reserved_at,
        duration_min: Number(form.duration_min),
        guest_count: Number(form.guest_count),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Rezervatsiya yaratildi!");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const isValid =
    form.table_id && form.full_name && form.phone && form.reserved_at;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md animate-slideUp max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-900">
              {tableNumber
                ? `${tableNumber}-stol rezervatsiyasi`
                : "Yangi rezervatsiya"}
            </h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {!tableId && (
            <div>
              <label className="label">Stol *</label>
              <select
                className="input"
                value={form.table_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, table_id: e.target.value }))
                }
              >
                <option value="">Stol tanlang</option>
                {tables
                  .filter((t) => !t.is_occupied)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.table_number}-stol ({t.capacity} kishi)
                    </option>
                  ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Mijoz ismi *</label>
            <input
              className="input"
              placeholder="Aliyev Sardor"
              value={form.full_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, full_name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Telefon *</label>
            <input
              className="input"
              placeholder="+998901234567"
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Sana va vaqt *</label>
            <input
              className="input"
              type="datetime-local"
              value={form.reserved_at}
              onChange={(e) =>
                setForm((p) => ({ ...p, reserved_at: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Davomiyligi (daqiqa)</label>
              <input
                className="input"
                type="number"
                placeholder="60"
                value={form.duration_min}
                onChange={(e) =>
                  setForm((p) => ({ ...p, duration_min: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Mehmonlar soni</label>
              <input
                className="input"
                type="number"
                placeholder="2"
                value={form.guest_count}
                onChange={(e) =>
                  setForm((p) => ({ ...p, guest_count: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              Bekor
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !isValid}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarDays className="w-4 h-4" />
              )}
              Rezervatsiya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RESERVATIONS PANEL ──────────────────────────────────
function ReservationsPanel({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reservations", date],
    queryFn: () => tableApi.getReservations({ date }),
  });

  const reservations: Reservation[] = data?.data?.data || [];

  const cancelMutation = useMutation({
    mutationFn: (id: string) => tableApi.cancelReservation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Bekor qilindi");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-2xl animate-slideInRight">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-900">Rezervatsiyalar</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-4 border-b border-gray-100 space-y-3">
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary w-full justify-center text-sm py-2"
          >
            <Plus className="w-4 h-4" /> Yangi rezervatsiya
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                Bu kunda rezervatsiya yo'q
              </p>
            </div>
          ) : (
            reservations.map((res) => (
              <div
                key={res.id}
                className={clsx(
                  "rounded-xl border p-3 bg-white",
                  res.status === "cancelled"
                    ? "border-red-100 opacity-60"
                    : "border-blue-100",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {res.full_name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {res.phone}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="badge bg-blue-50 text-blue-700 text-xs">
                        {res.table_number}-stol
                      </span>
                      <span className="badge bg-gray-50 text-gray-600 text-xs">
                        <Users className="w-3 h-3 inline mr-0.5" />
                        {res.guest_count} kishi
                      </span>
                      <span className="badge bg-purple-50 text-purple-600 text-xs">
                        {res.duration_min} daqiqa
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(res.reserved_at).toLocaleString("uz-UZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                    {res.created_by_name && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Yaratdi: {res.created_by_name}
                      </p>
                    )}
                  </div>
                  {res.status !== "cancelled" && (
                    <button
                      onClick={() => {
                        if (confirm("Bekor qilishni tasdiqlaysizmi?"))
                          cancelMutation.mutate(res.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  )}
                </div>
                {res.status === "cancelled" && (
                  <span className="badge bg-red-100 text-red-600 text-xs mt-2 block w-fit">
                    Bekor qilindi
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {showAdd && <ReservationModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────
export default function TablesPage() {
  const { user } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showReservations, setShowReservations] = useState(false);
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [tab, setTab] = useState<"all" | "occupied" | "free">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: () => tableApi.getAll(),
  });

  const tables: Table[] = (data?.data?.data || []).filter(
    (t: Table) => !t.is_virtual,
  );
  const occupied = tables.filter((t) => t.is_occupied).length;
  const free = tables.filter((t) => !t.is_occupied).length;
  const filtered = tables.filter((t) =>
    tab === "all" ? true : tab === "occupied" ? t.is_occupied : !t.is_occupied,
  );

  const isManager = user?.role === "manager";

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Stollar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="text-red-600 font-semibold">{occupied} band</span>
            {" · "}
            <span className="text-green-600 font-semibold">{free} bo'sh</span>
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === "waiter" && (
            <Link
              href="/tables/scan"
              className="btn-secondary text-sm py-2 px-3"
            >
              <QrCode className="w-4 h-4" /> Skanerlash
            </Link>
          )}
          {isManager && (
            <>
              <button
                onClick={() => setShowReservations(true)}
                className="btn-secondary text-sm py-2 px-3"
              >
                <BookOpen className="w-4 h-4" /> Rezervatsiyalar
              </button>
              <button
                onClick={() => setShowNewReservation(true)}
                className="btn-secondary text-sm py-2 px-3"
              >
                <CalendarDays className="w-4 h-4" /> Rezervatsiya
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="btn-primary text-sm py-2 px-3"
              >
                <Plus className="w-4 h-4" /> Stol
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "occupied", "free"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "flex-1 py-2 rounded-xl text-xs font-semibold transition-all",
              tab === t
                ? "bg-green-600 text-white"
                : "bg-white border border-gray-200 text-gray-600",
            )}
          >
            {t === "all"
              ? `Barchasi (${tables.length})`
              : t === "occupied"
                ? `Band (${occupied})`
                : `Bo'sh (${free})`}
          </button>
        ))}
      </div>

      <div className="flex gap-3 text-xs flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          Bo'sh
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Band
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          Rezervatsiya bor
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Table2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Hali stol qo'shilmagan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((table) => (
            <TableCard key={table.id} table={table} />
          ))}
        </div>
      )}

      {showAdd && <AddTableModal onClose={() => setShowAdd(false)} />}
      {showReservations && (
        <ReservationsPanel onClose={() => setShowReservations(false)} />
      )}
      {showNewReservation && (
        <ReservationModal onClose={() => setShowNewReservation(false)} />
      )}
    </div>
  );
}
