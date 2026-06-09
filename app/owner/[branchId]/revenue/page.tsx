"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ownerApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { TrendingUp, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const today = () => new Date().toISOString().split("T")[0];
const monthAgo = () => {
  const d = new Date(); d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
};

export default function BranchRevenuePage() {
  const { branchId } = useParams<{ branchId: string }>();
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(today());
  const [period, setPeriod] = useState("daily");

  const { data, isLoading } = useQuery({
    queryKey: ["owner-branch-revenue", branchId, from, to, period],
    queryFn: () => ownerApi.getBranchRevenue(branchId, { from, to, period }),
  });

  const rows: any[] = data?.data?.data?.data || [];
  const totalRevenue = rows.reduce((s, r) => s + parseFloat(r.revenue || 0), 0);
  const totalOrders  = rows.reduce((s, r) => s + parseInt(r.orders || 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" /> Daromad hisoboti
          </h1>
          <p className="text-xs text-gray-400">Filial bo'yicha daromad grafigi</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-sm flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Dan</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Gacha</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Davr</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
            <option value="daily">Kunlik</option>
            <option value="monthly">Oylik</option>
          </select>
        </div>
        <div className="ml-auto flex gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400">Jami daromad</p>
            <p className="font-bold text-green-600">{formatPrice(totalRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Buyurtmalar</p>
            <p className="font-bold text-gray-700">{totalOrders}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Ma'lumot yo'q</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 mb-5">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rows} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => formatPrice(v)} labelFormatter={(l) => `Sana: ${l}`} />
              <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Daromad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      {rows.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Davr</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Daromad</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Buyurtmalar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.period}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">{formatPrice(r.revenue)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{r.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
