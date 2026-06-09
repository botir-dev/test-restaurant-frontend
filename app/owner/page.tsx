"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import {
  Building2, TrendingUp, Package, Users, ChefHat,
  BookOpen, Archive, BarChart2, Pencil, Check, X,
  Loader2, AlertTriangle, ArrowRight, Globe,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import toast from "react-hot-toast";

// ─── Filial kartasi ────────────────────────────────────────────
function BranchCard({ branch, onEdit }: { branch: any; onEdit: (b: any) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{branch.name}</h3>
            <p className="text-xs text-gray-400">{branch.address || "Manzil kiritilmagan"}</p>
          </div>
        </div>
        <button
          onClick={() => onEdit(branch)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          title="Nom/manzil o'zgartirish"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Bugungi daromad</p>
          <p className="font-bold text-green-700 text-sm">{formatPrice(branch.today_revenue)}</p>
          <p className="text-xs text-gray-400">{branch.today_orders} buyurtma</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Oylik daromad</p>
          <p className="font-bold text-blue-700 text-sm">{formatPrice(branch.month_revenue)}</p>
          <p className="text-xs text-gray-400">{branch.staff_count} xodim</p>
        </div>
      </div>

      {/* Tezkor havolalar */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { href: `/owner/${branch.id}/revenue`, icon: TrendingUp, label: "Daromad", color: "text-green-600" },
          { href: `/owner/${branch.id}/inventory`, icon: Package, label: "Ombor", color: "text-orange-600" },
          { href: `/owner/${branch.id}/staff`, icon: Users, label: "Xodimlar", color: "text-blue-600" },
          { href: `/owner/${branch.id}/staff-meals`, icon: ChefHat, label: "Staff meal", color: "text-purple-600" },
          { href: `/owner/${branch.id}/menu`, icon: BookOpen, label: "Menyu", color: "text-pink-600" },
          { href: `/owner/${branch.id}/archive`, icon: Archive, label: "Arxiv", color: "text-gray-600" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <item.icon className={clsx("w-4 h-4", item.color)} />
            <span className="text-xs text-gray-600">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Nom/manzil tahrirlash modal ────────────────────────────────
function EditBranchModal({
  branch,
  onClose,
}: {
  branch: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(branch.name || "");
  const [address, setAddress] = useState(branch.address || "");

  const mutation = useMutation({
    mutationFn: () => ownerApi.updateBranch(branch.id, { name, address }),
    onSuccess: () => {
      toast.success("Filial yangilandi");
      qc.invalidateQueries({ queryKey: ["owner-dashboard"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Xato"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Filial ma'lumotlari</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Manzil</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          Faqat filial nomi va manzilini o'zgartirish mumkin.
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !name.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-2.5 font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Saqlash
        </button>
      </div>
    </div>
  );
}

// ─── Asosiy dashboard ──────────────────────────────────────────
export default function OwnerDashboard() {
  const [editBranch, setEditBranch] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["owner-dashboard"],
    queryFn: () => ownerApi.getDashboard(),
  });

  const dashboard = data?.data?.data;
  const branches: any[] = dashboard?.branches || [];
  const totals = dashboard?.totals || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Owner Panel</h1>
        <p className="text-sm text-gray-500 mt-0.5">Barcha filiallar umumiy ko'rinishi</p>
      </div>

      {/* Umumiy statistika */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
          <p className="text-green-100 text-xs mb-1">Bugungi jami daromad</p>
          <p className="text-xl font-bold">{formatPrice(totals.today)}</p>
          <p className="text-green-200 text-xs mt-1">{totals.branch_count} filial</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
          <p className="text-blue-100 text-xs mb-1">Oylik jami daromad</p>
          <p className="text-xl font-bold">{formatPrice(totals.month)}</p>
          <p className="text-blue-200 text-xs mt-1">Joriy oy</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
          <p className="text-purple-100 text-xs mb-1">Filiallar</p>
          <p className="text-xl font-bold">{totals.branch_count}</p>
          <p className="text-purple-200 text-xs mt-1">Jami filial</p>
        </div>
      </div>

      {/* Tezkor havolalar */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Link
          href="/owner/compare"
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 transition-all"
        >
          <BarChart2 className="w-4 h-4 text-blue-500" />
          Filiallarni solishtirish
          <ArrowRight className="w-3 h-3 text-gray-400" />
        </Link>
        <Link
          href="/owner/global-report"
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 transition-all"
        >
          <Globe className="w-4 h-4 text-green-500" />
          Global hisobot
          <ArrowRight className="w-3 h-3 text-gray-400" />
        </Link>
        <Link
          href="/owner/inventory-compare"
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 transition-all"
        >
          <Package className="w-4 h-4 text-orange-500" />
          Ombor solishtirish
          <ArrowRight className="w-3 h-3 text-gray-400" />
        </Link>
      </div>

      {/* Filiallar */}
      <h2 className="text-lg font-bold text-gray-800 mb-3">Filiallar</h2>
      {branches.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Filiallar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((b: any) => (
            <BranchCard key={b.id} branch={b} onEdit={setEditBranch} />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editBranch && (
        <EditBranchModal branch={editBranch} onClose={() => setEditBranch(null)} />
      )}
    </div>
  );
}
