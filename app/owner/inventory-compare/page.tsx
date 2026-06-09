"use client";
import { useQuery } from "@tanstack/react-query";
import { ownerApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Package, Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default function InventoryComparePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["owner-inventory-compare"],
    queryFn: () => ownerApi.compareInventory(),
  });

  const branches: any[] = data?.data?.data || [];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" /> Ombor solishtirish
          </h1>
          <p className="text-xs text-gray-400">Barcha filiallar ombori holati</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : (
        <div className="space-y-4">
          {branches.map((b: any) => (
            <div key={b.branch_id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{b.branch_name}</h3>
                <Link href={`/owner/${b.branch_id}/inventory`}
                  className="text-xs text-blue-600 hover:underline">Batafsil →</Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Jami mahsulot</p>
                  <p className="font-bold text-gray-700">{b.item_count} ta</p>
                </div>
                <div className={clsx("rounded-xl p-3", b.low_stock_count > 0 ? "bg-red-50" : "bg-green-50")}>
                  <p className="text-xs text-gray-400 mb-1">Kam qoldiq</p>
                  <p className={clsx("font-bold flex items-center gap-1",
                    b.low_stock_count > 0 ? "text-red-600" : "text-green-600")}>
                    {b.low_stock_count > 0 && <AlertTriangle className="w-3.5 h-3.5" />}
                    {b.low_stock_count} ta
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Ombor qiymati</p>
                  <p className="font-bold text-blue-700">{formatPrice(b.total_value)}</p>
                </div>
              </div>
            </div>
          ))}
          {branches.length === 0 && (
            <div className="text-center py-16 text-gray-400">Ma'lumot yo'q</div>
          )}
        </div>
      )}
    </div>
  );
}
