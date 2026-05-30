"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) {
      router.replace("/login");
      return;
    }
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    router.replace("/dashboard");
  }, [isAuthenticated, _hasHydrated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
      <div className="w-8 h-8 border-[3px] border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
