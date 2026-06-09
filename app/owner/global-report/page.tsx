"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ownerApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Globe, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const today = () => new Date().toISOString().split("T")[0];
const monthAgo = () => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split("T")[0]; };

export default function GlobalReportPage() {
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(today());

  const { data, isLoading } = useQuery({
    queryKey: ["owner-global", from, to],
    queryFn: () => ownerApi.getGlobalReport({ from, to }),
  });

  const result = data?.data?.data;
  const summary = result?.summary || {};
  const daily: any[] = result?.daily || [];
  const byBranch: any[] = result?.by_branch || [];
  const staffMeals: any[] = result?.staff_meals || [];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" /> Global hisobot
          </h1>
          <p className="text-xs text-gray-400">Barcha filiallar yig'indisi</p>
        </div>
      </div>

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
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
      ) : (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">Jami daromad</p>
              <p className="text-2xl font-bold text-green-700">{formatPrice(summary.total_revenue)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">Jami buyurtmalar</p>
              <p className="text-2xl font-bold text-blue-700">{summary.total_orders?.toLocaleString()}</p>
            </div>
          </div>

          {/* Daily chart */}
          {daily.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Kunlik daromad (barcha filiallar)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any) => formatPrice(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#rev)" name="Daromad" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By branch */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-700 text-sm">Filiallar bo'yicha</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Filial</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Daromad</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Buyurtmalar</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ulush</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byBranch.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{b.name}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{formatPrice(b.revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{b.orders}</td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {summary.total_revenue > 0
                        ? `${((b.revenue / summary.total_revenue) * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Staff meals */}
          {staffMeals.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-orange-50">
                <h3 className="font-semibold text-gray-700 text-sm">Staff Meal (filial bo'yicha)</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Filial</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Portsiya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {staffMeals.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.branch_name}</td>
                      <td className="px-4 py-3 text-right font-bold text-orange-600">{r.total_portions} ta</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
