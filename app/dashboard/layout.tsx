"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import Sidebar from "@/components/layout/Sidebar";
import { TariffStatusBanner } from "@/components/ui/LockedFeature";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="w-8 h-8 border-[3px] border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fafaf8]">
      <Sidebar />
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 min-w-0">
        <TariffStatusBanner />
        <div className="p-4 lg:p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
