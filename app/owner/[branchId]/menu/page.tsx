"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ownerApi } from "@/lib/api";
import { formatPrice, PRODUCT_TYPE_LABELS } from "@/lib/utils";
import { BookOpen, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default function BranchMenuPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const [activeType, setActiveType] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["owner-branch-menu", branchId],
    queryFn: () => ownerApi.getBranchMenu(branchId),
  });

  const items: any[] = data?.data?.data || [];
  const types = [...new Set(items.map((i: any) => i.type))];
  const filtered = activeType === "all" ? items : items.filter((i: any) => i.type === activeType);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-600" /> Menyu
          </h1>
          <p className="text-xs text-gray-400">Faqat ko'rish rejimi</p>
        </div>
        <span className="ml-auto bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1 rounded-full">
          {items.length} ta taom
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {["all", ...types].map((type) => (
          <button key={type} onClick={() => setActiveType(type)}
            className={clsx(
              "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
              activeType === type ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}>
            {type === "all" ? "Hammasi" : (PRODUCT_TYPE_LABELS as any)[type] || type}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-pink-600" /></div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Taom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tur</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Narx</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{(PRODUCT_TYPE_LABELS as any)[item.type] || item.type}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">{formatPrice(item.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={clsx(
                      "inline-flex text-xs px-2 py-0.5 rounded-full font-semibold",
                      item.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                    )}>
                      {item.is_available ? "Mavjud" : "Yo'q"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">Taomlar yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
