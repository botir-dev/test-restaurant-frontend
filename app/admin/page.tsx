"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import type { Restaurant, Branch } from "@/types";
import toast from "react-hot-toast";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";
import clsx from "clsx";

function RestaurantModal({
  restaurant,
  onClose,
}: {
  restaurant?: Restaurant;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: restaurant?.name || "",
    address: restaurant?.address || "",
    logo_url: restaurant?.logo_url || "",
  });
  const mutation = useMutation({
    mutationFn: () =>
      restaurant
        ? adminApi.updateRestaurant(restaurant.id, form)
        : adminApi.createRestaurant(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success(restaurant ? "Yangilandi" : "Yaratildi");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md animate-slideUp p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">
            {restaurant ? "Tahrirlash" : "Yangi restoran"}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Nomi *</label>
            <input
              className="input"
              placeholder="Oqtepa Lavash"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Manzil</label>
            <input
              className="input"
              placeholder="Toshkent"
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Logo URL</label>
            <input
              className="input"
              placeholder="https://..."
              value={form.logo_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, logo_url: e.target.value }))
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
              disabled={mutation.isPending || !form.name}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}{" "}
              {restaurant ? "Saqlash" : "Yaratish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BranchModal({
  restaurantId,
  branch,
  onClose,
}: {
  restaurantId: string;
  branch?: Branch;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: branch?.name || "",
    address: branch?.address || "",
    phone: branch?.phone || "",
  });
  const mutation = useMutation({
    mutationFn: () =>
      branch
        ? adminApi.updateBranch(branch.id, form)
        : adminApi.createBranch({ ...form, restaurant_id: restaurantId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast.success(branch ? "Yangilandi" : "Filial yaratildi");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm animate-slideUp p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">
            {branch ? "Filialni tahrirlash" : "Yangi filial"}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Nomi *</label>
            <input
              className="input"
              placeholder="Chilonzor filiali"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Manzil</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
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
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              Bekor
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.name}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}{" "}
              {branch ? "Saqlash" : "Yaratish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showRestModal, setShowRestModal] = useState(false);
  const [editRest, setEditRest] = useState<Restaurant | undefined>();
  const [expandedRest, setExpandedRest] = useState<string | null>(null);
  const [showBranchModal, setShowBranchModal] = useState<string | null>(null);

  const { data: restsData, isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => adminApi.getRestaurants(),
    enabled: user?.role === "super_admin",
  });

  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => adminApi.getBranches(),
    enabled: user?.role === "super_admin",
  });

  const deleteRestMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteRestaurant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success("O'chirildi");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Xato"),
  });

  const restaurants: Restaurant[] = restsData?.data?.data || [];
  const branches: Branch[] = branchesData?.data?.data || [];

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Boshqaruv paneli</h1>
        <button
          onClick={() => {
            setEditRest(undefined);
            setShowRestModal(true);
          }}
          className="btn-primary text-sm py-2 px-3"
        >
          <Plus className="w-4 h-4" /> Restoran
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Hali restoran qo'shilmagan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map((rest) => {
            const restBranches = branches.filter(
              (b) => b.restaurant_id === rest.id,
            );
            const isExpanded = expandedRest === rest.id;
            return (
              <div key={rest.id} className="card">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => setExpandedRest(isExpanded ? null : rest.id)}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {rest.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {rest.address} · {restBranches.length} filial
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex gap-1.5 ml-2">
                    <button
                      onClick={() => {
                        setEditRest(rest);
                        setShowRestModal(true);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      <Pencil className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("O'chirishni tasdiqlaysizmi?"))
                          deleteRestMutation.mutate(rest.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-700 text-sm">
                        Filiallar
                      </p>
                      <button
                        onClick={() => setShowBranchModal(rest.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700"
                      >
                        <Plus className="w-3.5 h-3.5" /> Filial qo'shish
                      </button>
                    </div>
                    <div className="space-y-2">
                      {restBranches.map((branch) => (
                        <div
                          key={branch.id}
                          className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {branch.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {branch.address}{" "}
                              {branch.phone && `· ${branch.phone}`}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                /* TODO: edit branch */
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-gray-100"
                            >
                              <Pencil className="w-3 h-3 text-gray-500" />
                            </button>
                            <button
                              onClick={() => {
                                /* Show manager modal */
                                toast(
                                  "Menejer qo'shish uchun /admin/managers endpoint ishlatiladi",
                                  { icon: "ℹ️" },
                                );
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white hover:bg-gray-100"
                            >
                              <Users className="w-3 h-3 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {restBranches.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">
                          Filial qo'shilmagan
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showRestModal && (
        <RestaurantModal
          restaurant={editRest}
          onClose={() => {
            setShowRestModal(false);
            setEditRest(undefined);
          }}
        />
      )}
      {showBranchModal && (
        <BranchModal
          restaurantId={showBranchModal}
          onClose={() => setShowBranchModal(null)}
        />
      )}
    </div>
  );
}
