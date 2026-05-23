"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/lib/services";
import toast from "react-hot-toast";
import { Eye, EyeOff, UtensilsCrossed, LogIn } from "lucide-react";

// Rolga qarab boshlang'ich sahifa
const ROLE_HOME: Record<string, string> = {
  super_admin: "/admin",
  manager: "/dashboard",
  waiter: "/tables",
  cashier: "/cashier",
  storekeeper: "/products",
};
const getHome = (role: string) => ROLE_HOME[role] ?? "/kitchen"; // tayyorlovchilar va custom rollar

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); // ← xato toast emas — UI da ko'rsatish

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Client-side minimal validatsiya
    if (!form.username.trim() || !form.password) {
      setErrorMsg("Username va parolni kiriting");
      return;
    }
    if (form.password.length > 128) {
      setErrorMsg("Parol juda uzun");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(form.username.trim(), form.password);
      const data = res.data.data;
      setUser(data);
      toast.success(`Xush kelibsiz, ${data.full_name}!`);
      // ← Rolga qarab to'g'ri sahifaga yo'naltirish (avval /dashboard ga barchasi borardi)
      router.replace(getHome(data.role));
    } catch (err: any) {
      // Backend xatosini foydalanuvchiga ko'rsatish — lekin stack trace emas
      const msg = err.response?.data?.message;
      // Faqat kutilgan xabarlarni ko'rsatish
      const safe =
        typeof msg === "string" && msg.length < 200
          ? msg
          : "Xatolik yuz berdi. Qayta urinib ko'ring.";
      setErrorMsg(safe);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] p-4">
      <div className="w-full max-w-sm animate-fadeIn">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Restoran Tizimi</h1>
          <p className="text-sm text-gray-500 mt-1">Hisobingizga kiring</p>
        </div>

        {/* Form */}
        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Xato xabari — toast emas, form ichida */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                placeholder="username"
                value={form.username}
                onChange={(e) => {
                  setErrorMsg("");
                  setForm((p) => ({ ...p, username: e.target.value }));
                }}
                autoComplete="username"
                autoFocus
                maxLength={100}
              />
            </div>
            <div>
              <label className="label">Parol</label>
              <div className="relative">
                <input
                  className="input pr-11"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => {
                    setErrorMsg("");
                    setForm((p) => ({ ...p, password: e.target.value }));
                  }}
                  autoComplete="current-password"
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPass ? "Parolni yashirish" : "Parolni ko'rsatish"
                  }
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary w-full justify-center"
              disabled={loading}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Kirish..." : "Kirish"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
