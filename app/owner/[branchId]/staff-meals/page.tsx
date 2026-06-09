"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ownerApi } from "@/lib/api";
import { ChefHat, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const today = () => new Date().toISOString().split("T")[0];
const monthAgo = () => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split("T")[0]; };

export default function BranchStaffMealsPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(today());

  const { data, isLoading } = useQuery({
    queryKey: ["owner-branch-staff-meals", branchId, from, to],
    queryFn: () => ownerApi.getBranchStaffMeals(branchId, { from, to }),
  });

  const result = data?.data?.data;
  const byDish: any[] = result?.by_dish || [];
  const totalPortions: number = result?.total_portions || 0;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-purple-600" /> Staff Meal
          </h1>
          <p className="text-xs text-gray-400">Xodimlar iste'mol qilgan taomlar</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-sm flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Dan</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Gacha</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
        {totalPortions > 0 && (
          <div className="ml-auto bg-purple-50 border border-purple-100 rounded-xl px-4 py-2">
            <p className="text-xs text-gray-400">Jami</p>
            <p className="font-bold text-purple-700">{totalPortions} portsiya</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Taom</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Portsiya</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Yozuvlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {byDish.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.menu_item_name}</td>
                  <td className="px-4 py-3 text-right font-bold text-purple-600">{r.total_qty} ta</td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">{r.records}</td>
                </tr>
              ))}
              {byDish.length === 0 && (
                <tr><td colSpan={3} className="text-center py-12 text-gray-400">Ma'lumot yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
