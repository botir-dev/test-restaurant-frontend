"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi, customRoleApi, customProductTypeApi } from "@/lib/services";
import { ROLE_LABELS, PRODUCT_TYPE_LABELS } from "@/lib/utils";
import type { Staff, Role, ProductType } from "@/types";
import toast from "react-hot-toast";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Eye,
  EyeOff,
  Phone,
  User,
  ShieldPlus,
  ChevronDown,
  ChevronUp,
  Tag,
  Search,
} from "lucide-react";
import clsx from "clsx";

const BASE_ROLES: Role[] = [
  "waiter",
  "cashier",
  "storekeeper",
  "cook",
  "baker",
  "somsa_maker",
  "grill_master",
  "turkish_cook",
  "bartender",
  "icecream_maker",
  "tea_master",
];
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

const safeParsePermissions = (data: any): string[] => {
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    try {
      const p = JSON.parse(data);
      return Array.isArray(p) ? p : [];
    } catch {}
    if (data.startsWith("{") && data.endsWith("}")) {
      const inner = data.slice(1, -1);
      if (!inner) return [];
      return inner
        .split(",")
        .map((s) => s.trim().replace(/"/g, ""))
        .filter(Boolean);
    }
  }
  return [];
};

function CustomTypeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { data } = useQuery({
    queryKey: ["custom-product-types"],
    queryFn: () => customProductTypeApi.getAll(),
  });
  const customTypes = data?.data?.data || [];
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Tanlang</option>
      <optgroup label="Standart turlar">
        {BASE_TYPES.map((t) => (
          <option key={t} value={t}>
            {PRODUCT_TYPE_LABELS[t]}
          </option>
        ))}
      </optgroup>
      {(customTypes as any[]).length > 0 && (
        <optgroup label="Maxsus turlar">
          {(customTypes as any[]).map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

function AllProductTypesSelector({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (t: string) => void;
}) {
  const { data } = useQuery({
    queryKey: ["custom-product-types"],
    queryFn: () => customProductTypeApi.getAll(),
  });
  const customTypes = data?.data?.data || [];
  const allTypes = [
    ...BASE_TYPES.map((t) => ({
      key: t,
      label: PRODUCT_TYPE_LABELS[t],
      isCustom: false,
    })),
    ...(customTypes as any[]).map((t) => ({
      key: t.key,
      label: t.label,
      isCustom: true,
    })),
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {allTypes.map(({ key, label, isCustom }) => (
        <button
          key={key}
          type="button"
          onClick={() => onToggle(key)}
          className={clsx(
            "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
            selected.includes(key)
              ? isCustom
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-green-600 text-white border-green-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-green-300",
          )}
        >
          {label}
          {isCustom ? " *" : ""}
        </button>
      ))}
    </div>
  );
}

function CustomRoleManager({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    key: "",
    label: "",
    product_type_key: "",
  });
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: () => customRoleApi.getAll(),
  });
  const customRoles = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: () =>
      customRoleApi.create({
        key:
          form.key.trim().toLowerCase().replace(/\s+/g, "_") ||
          form.label.trim().toLowerCase().replace(/\s+/g, "_"),
        label: form.label.trim(),
        product_type_key: form.product_type_key || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-roles"] });
      toast.success("Yangi rol yaratildi!");
      setForm({ key: "", label: "", product_type_key: "" });
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customRoleApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-roles"] });
      toast.success("O'chirildi");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <ShieldPlus className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-gray-900">Rollarni boshqarish</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Maxsus rollar
            </p>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              </div>
            ) : (customRoles as any[]).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">
                Hozircha maxsus rol yo'q
              </p>
            ) : (
              <div className="space-y-2">
                {(customRoles as any[]).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-purple-50 rounded-xl px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-purple-800">
                        {r.label}
                      </p>
                      <p className="text-xs text-purple-500">
                        key: {r.key}
                        {r.product_type_key
                          ? ` · tur: ${r.product_type_key}`
                          : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("O'chirishni tasdiqlaysizmi?"))
                          deleteMutation.mutate(r.id);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-all"
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
                <Plus className="w-4 h-4 text-purple-500" /> Yangi rol yaratish
              </span>
              {showForm ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showForm && (
              <div className="space-y-3 bg-purple-50 rounded-xl p-3">
                <div>
                  <label className="label">Rol nomi *</label>
                  <input
                    className="input"
                    placeholder="Salatchi"
                    value={form.label}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, label: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Kalit so'z (ixtiyoriy)</label>
                  <input
                    className="input"
                    placeholder="salatchi"
                    value={form.key}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, key: e.target.value }))
                    }
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Bo'sh qoldirsangiz nomdan avtomatik yaratiladi
                  </p>
                </div>
                <div>
                  <label className="label">Bog'liq taom turi (ixtiyoriy)</label>
                  <CustomTypeSelect
                    value={form.product_type_key}
                    onChange={(val) =>
                      setForm((p) => ({ ...p, product_type_key: val }))
                    }
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Bu rol qaysi taom turini tayyorlashini bildiradi
                  </p>
                </div>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !form.label}
                  className="btn-primary w-full justify-center text-sm py-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Rol yaratish
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

// Xodim tahrirlash — rol va ruxsatlarni o'zgartirish
function StaffDetailModal({
  staff,
  allRoleLabels,
  allTypeLabels,
  onClose,
}: {
  staff: Staff;
  allRoleLabels: Record<string, string>;
  allTypeLabels: Record<string, string>;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: customRolesData } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: () => customRoleApi.getAll(),
  });
  const customRoles = customRolesData?.data?.data || [];

  const [form, setForm] = useState({
    full_name: staff.full_name,
    phone: staff.phone || "",
    password: "",
    role: staff.role as string,
    extra_permissions: safeParsePermissions(staff.extra_permissions),
  });
  const [showPass, setShowPass] = useState(false);

  const togglePerm = (type: string) => {
    setForm((p) => ({
      ...p,
      extra_permissions: p.extra_permissions.includes(type)
        ? p.extra_permissions.filter((t) => t !== type)
        : [...p.extra_permissions, type],
    }));
  };

  const mutation = useMutation({
    mutationFn: () =>
      staffApi.update(staff.id, {
        full_name: form.full_name,
        phone: form.phone,
        role: form.role as Role,
        extra_permissions: form.extra_permissions as ProductType[],
        ...(form.password ? { password: form.password } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Yangilandi");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md animate-slideUp max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">Xodimni tahrirlash</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="label">Ism familiya *</label>
            <input
              className="input"
              value={form.full_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, full_name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input
              className="input"
              placeholder="+998..."
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Yangi parol (ixtiyoriy)</label>
            <div className="relative">
              <input
                className="input pr-11"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Rol</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              <optgroup label="Standart rollar">
                {BASE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </optgroup>
              {(customRoles as any[]).length > 0 && (
                <optgroup label="Maxsus rollar">
                  {(customRoles as any[]).map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="label">Qo'shimcha ruxsatlar</label>
            <AllProductTypesSelector
              selected={form.extra_permissions}
              onToggle={togglePerm}
            />
          </div>
          {/* Hozirgi holat */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Hozirgi holat
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span
                className={clsx(
                  "badge text-xs",
                  !ROLE_LABELS[staff.role as Role]
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700",
                )}
              >
                {allRoleLabels[staff.role] || staff.role}
              </span>
              {safeParsePermissions(staff.extra_permissions).map((p) => (
                <span
                  key={p}
                  className="badge bg-blue-50 text-blue-600 text-xs"
                >
                  {allTypeLabels[p] || p}
                </span>
              ))}
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
              disabled={mutation.isPending || !form.full_name}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Yangi xodim yaratish modali
function NewStaffModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: customRolesData } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: () => customRoleApi.getAll(),
  });
  const customRoles = customRolesData?.data?.data || [];

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    phone: "",
    password: "",
    role: "waiter" as string,
    extra_permissions: [] as string[],
  });
  const [showPass, setShowPass] = useState(false);

  const togglePerm = (type: string) =>
    setForm((p) => ({
      ...p,
      extra_permissions: p.extra_permissions.includes(type)
        ? p.extra_permissions.filter((t) => t !== type)
        : [...p.extra_permissions, type],
    }));

  const mutation = useMutation({
    mutationFn: () =>
      staffApi.create({
        full_name: form.full_name,
        username: form.username,
        phone: form.phone,
        password: form.password,
        role: form.role as Role,
        extra_permissions: form.extra_permissions as ProductType[],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Xodim yaratildi");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md animate-slideUp max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">Yangi xodim</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="label">Ism familiya *</label>
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
            <label className="label">Username *</label>
            <input
              className="input"
              placeholder="sardor_waiter"
              value={form.username}
              onChange={(e) =>
                setForm((p) => ({ ...p, username: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input
              className="input"
              placeholder="+998901234567"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Parol *</label>
            <div className="relative">
              <input
                className="input pr-11"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Rol *</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              <optgroup label="Standart rollar">
                {BASE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </optgroup>
              {(customRoles as any[]).length > 0 && (
                <optgroup label="Maxsus rollar">
                  {(customRoles as any[]).map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="label">Qo'shimcha ruxsatlar</label>
            <AllProductTypesSelector
              selected={form.extra_permissions}
              onToggle={togglePerm}
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
              disabled={
                mutation.isPending ||
                !form.full_name ||
                !form.password ||
                !form.username
              }
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Yaratish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const qc = useQueryClient();
  const [showNewModal, setShowNewModal] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffApi.getAll(),
  });
  const { data: customRolesData } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: () => customRoleApi.getAll(),
  });
  const { data: customTypesData } = useQuery({
    queryKey: ["custom-product-types"],
    queryFn: () => customProductTypeApi.getAll(),
  });

  const staff: Staff[] = data?.data?.data || [];
  const customRoles = customRolesData?.data?.data || [];
  const customTypes = customTypesData?.data?.data || [];

  const allRoleLabels: Record<string, string> = {
    ...ROLE_LABELS,
    ...Object.fromEntries((customRoles as any[]).map((r) => [r.key, r.label])),
  };
  const allTypeLabels: Record<string, string> = {
    ...PRODUCT_TYPE_LABELS,
    ...Object.fromEntries((customTypes as any[]).map((t) => [t.key, t.label])),
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Cache ni yangilash — o'chirilgan hodimni darhol ro'yxatdan olib tashlash
      qc.setQueryData(["staff"], (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.filter((s: any) => s.id !== deletedId),
          },
        };
      });
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Hodim o'chirildi");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Xodimlar</h1>
          <p className="text-sm text-gray-500">{staff.length} ta xodim</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRoleManager(true)}
            className="btn-secondary text-sm py-2 px-3"
          >
            <ShieldPlus className="w-4 h-4" /> Rollar
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary text-sm py-2 px-3"
          >
            <Plus className="w-4 h-4" /> Qo'shish
          </button>
        </div>
      </div>

      {/* Qidiruv */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Ism, username, telefon yoki rol bo'yicha qidirish..."
          value={search}
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

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Xodim qo'shilmagan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff
            .filter((s) => {
              if (!search) return true;
              const q = search.toLowerCase();
              return (
                s.full_name?.toLowerCase().includes(q) ||
                s.username?.toLowerCase().includes(q) ||
                s.phone?.includes(q) ||
                (allRoleLabels[s.role] || s.role).toLowerCase().includes(q)
              );
            })
            .map((s) => {
              const perms = safeParsePermissions(s.extra_permissions);
              const isCustomRole = !ROLE_LABELS[s.role as Role];
              return (
                <div key={s.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {s.full_name}
                        </p>
                        <p className="text-xs text-gray-400">@{s.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setEditStaff(s)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("O'chirishni tasdiqlaysizmi?"))
                            deleteMutation.mutate(s.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Rollar va ruxsatlar */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {/* Asosiy rol */}
                    <span
                      className={clsx(
                        "badge text-xs flex items-center gap-1",
                        isCustomRole
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700",
                      )}
                    >
                      {isCustomRole && <Tag className="w-2.5 h-2.5" />}
                      {allRoleLabels[s.role] || s.role}
                    </span>
                    {/* Extra permissions */}
                    {perms.map((p) => (
                      <span
                        key={p}
                        className={clsx(
                          "badge text-xs",
                          !PRODUCT_TYPE_LABELS[p as ProductType]
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-50 text-blue-600",
                        )}
                      >
                        {allTypeLabels[p] || p}
                      </span>
                    ))}
                  </div>

                  {s.phone && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" /> {s.phone}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* O'chirish tasdiqlash modali */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm animate-slideUp p-5">
            <h3 className="font-bold text-gray-900 mb-2">Hodimni o'chirish</h3>
            <p className="text-sm text-gray-500 mb-4">
              Hodimni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Bekor
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1 justify-center"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewModal && <NewStaffModal onClose={() => setShowNewModal(false)} />}
      {editStaff && (
        <StaffDetailModal
          staff={editStaff}
          allRoleLabels={allRoleLabels}
          allTypeLabels={allTypeLabels}
          onClose={() => setEditStaff(null)}
        />
      )}
      {showRoleManager && (
        <CustomRoleManager onClose={() => setShowRoleManager(false)} />
      )}
    </div>
  );
}
