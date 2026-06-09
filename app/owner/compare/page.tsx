"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ownerApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { BarChart2, Loader2, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const today = () => new Date().toISOString().split("T")[0];
const monthAgo = () => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split("T")[0]; };

export default function CompareBranchesPage() {
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(today());

  const { data, isLoading } = useQuery({
    queryKey: ["owner-compare", from, to],
    queryFn: () => ownerApi.compareBranches({ from, to }),
  });

  const branches: any[] = data?.data?.data?.branches || [];
  const chartData = branches.map(b => ({
    name: b.name.length > 10 ? b.name.substring(0,10)+"…" : b.name,
    Daromad: parseFloat(b.revenue || 0),
    Buyurtmalar: parseInt(b.orders || 0),
  }));

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" /> Filiallar solishtirish
          </h1>
          <p className="text-xs text-gray-400">Daromad va buyurtmalar bo'yicha</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-sm flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Dan</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Gacha</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : (
        <>
          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 mb-5">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Daromad diagrammasi</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any, name: string) => name === "Daromad" ? formatPrice(v) : v} />
                  <Bar dataKey="Daromad" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Filial</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Daromad</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Buyurtmalar</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">O'rtacha chek</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Xodimlar</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Top taomlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {branches.map((b: any, i: number) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-yellow-500">🥇</span>}
                        {i === 1 && <span className="text-gray-400">🥈</span>}
                        {i === 2 && <span className="text-amber-600">🥉</span>}
                        <span className="font-semibold text-gray-800">{b.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{formatPrice(b.revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{b.orders}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatPrice(b.avg_order)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{b.staff_count}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {(b.top_products || []).map((p: any) => p.product_name).join(", ") || "—"}
                    </td>
                  </tr>
                ))}
                {branches.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Ma'lumot yo'q</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
