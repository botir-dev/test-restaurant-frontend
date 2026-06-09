"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ownerApi } from "@/lib/api";
import { Package, Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default function BranchInventoryPage() {
  const { branchId } = useParams<{ branchId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["owner-branch-inventory", branchId],
    queryFn: () => ownerApi.getBranchInventory(branchId),
  });

  const result = data?.data?.data;
  const items: any[] = result?.items || [];
  const lowStockCount: number = result?.low_stock_count || 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" /> Ombor
          </h1>
          <p className="text-xs text-gray-400">Faqat ko'rish rejimi</p>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span><b>{lowStockCount} ta mahsulot</b> minimum qoldiq ostida!</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mahsulot</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Miqdor</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Min qoldiq</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item: any) => {
                const isLow = item.min_quantity && parseFloat(item.quantity) <= parseFloat(item.min_quantity);
                const unit = item.unit === "custom" ? item.custom_unit : item.unit;
                return (
                  <tr key={item.id} className={clsx("hover:bg-gray-50", isLow && "bg-red-50/50")}>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      {parseFloat(item.quantity).toLocaleString("uz-UZ", { maximumFractionDigits: 3 })} {unit}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {item.min_quantity ? `${item.min_quantity} ${unit}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Kam
                        </span>
                      ) : (
                        <span className="inline-flex text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">Mahsulotlar yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
