"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ownerApi } from "@/lib/api";
import { Users, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const ROLE_LABELS: Record<string, string> = {
  manager: "Menejer", waiter: "Ofitsiant", cashier: "Kassir",
  storekeeper: "Omborchi", cook: "Oshpaz", baker: "Nonvoy",
};

export default function BranchStaffPage() {
  const { branchId } = useParams<{ branchId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["owner-branch-staff", branchId],
    queryFn: () => ownerApi.getBranchStaff(branchId),
  });

  const staff: any[] = data?.data?.data || [];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Xodimlar
          </h1>
          <p className="text-xs text-gray-400">Faqat ko'rish rejimi</p>
        </div>
        <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
          {staff.length} xodim
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ism</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lavozim</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Username</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.full_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {ROLE_LABELS[s.role] || s.role}
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{s.username}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={clsx(
                      "inline-flex text-xs px-2 py-0.5 rounded-full font-semibold",
                      s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                    )}>
                      {s.is_active ? "Faol" : "Nofaol"}
                    </span>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">Xodimlar yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
