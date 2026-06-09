"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ownerApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Archive, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const today = () => new Date().toISOString().split("T")[0];
const monthAgo = () => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split("T")[0]; };

export default function BranchArchivePage() {
  const { branchId } = useParams<{ branchId: string }>();
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(today());
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["owner-branch-archive", branchId, from, to, page],
    queryFn: () => ownerApi.getBranchArchive(branchId, { from, to, page }),
  });

  const orders: any[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Archive className="w-5 h-5 text-gray-600" /> Arxiv
          </h1>
          <p className="text-xs text-gray-400">Faqat ko'rish rejimi</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-sm flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Dan</label>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Gacha</label>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
        </div>
        {pagination && (
          <div className="ml-auto text-xs text-gray-400">
            Jami: <span className="font-semibold text-gray-700">{pagination.total}</span> buyurtma
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stol</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Summa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ofitsiant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{o.order_number}</td>
                    <td className="px-4 py-3 text-gray-700">{o.table_number ? `Stol ${o.table_number}` : o.order_type}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {formatPrice(parseFloat(o.total_amount) + parseFloat(o.service_fee_amount || 0))}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.waiter_name || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(o.created_at).toLocaleString("uz-UZ")}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Buyurtmalar yo'q</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                ← Oldingi
              </button>
              <span className="text-sm text-gray-500">{page} / {pagination.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p+1))} disabled={page === pagination.totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                Keyingi →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
