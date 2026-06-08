"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  UtensilsCrossed,
  LogIn,
  ShieldCheck,
} from "@/components/icons";
import { Button, Input, Spinner } from "@/components/ui";
import { getHome } from "@/lib/auth-constants";

const DEVICE_TOKEN_KEY = "rbt_device_token";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState<"login" | "otp">("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [otp, setOtp] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [userId, setUserId] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
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
      const deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY) || undefined;
      const res = await authApi.login(
        form.username.trim(),
        form.password,
        deviceToken,
      );
      const data = res.data.data as any;

      if (data.requires_2fa) {
        setUserId(data.user_id);
        setStep("otp");
        setOtpTimer(300);
        toast.success("Telegram ga kod yuborildi! 📱");
      } else {
        handleSuccess(data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setErrorMsg(
        typeof msg === "string" && msg.length < 200
          ? msg
          : "Xatolik yuz berdi. Qayta urinib ko'ring.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (otp.length !== 6) {
      setErrorMsg("6 raqamli kodni kiriting");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp(userId, otp, trustDevice);
      const data = res.data.data as any;

      if (trustDevice && data.device_token) {
        localStorage.setItem(DEVICE_TOKEN_KEY, data.device_token);
      }
      handleSuccess(data);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setErrorMsg(
        typeof msg === "string" && msg.length < 200
          ? msg
          : "Xatolik yuz berdi.",
      );
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (data: any) => {
    setUser(data);
    toast.success(`Xush kelibsiz, ${data.full_name}!`);
    router.replace(getHome(data.role));
  };

  const handleBackToLogin = () => {
    setStep("login");
    setOtp("");
    setUserId("");
    setErrorMsg("");
    setOtpTimer(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] p-4">
      <div className="w-full max-w-sm animate-fadeIn">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            {step === "otp" ? (
              <ShieldCheck className="w-8 h-8 text-white" />
            ) : (
              <UtensilsCrossed className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">RestOops! Tizimi</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === "otp"
              ? "Telegram kodini kiriting"
              : "Hisobingizga kiring"}
          </p>
        </div>

        <div className="card shadow-md">
          {/* ── LOGIN ── */}
          {step === "login" && (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {errorMsg}
                </div>
              )}
              <Input
                label="Username"
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
              <Input
                label="Parol"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => {
                  setErrorMsg("");
                  setForm((p) => ({ ...p, password: e.target.value }));
                }}
                autoComplete="current-password"
                maxLength={128}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />
              <Button
                type="submit"
                loading={loading}
                icon={<LogIn className="w-4 h-4" />}
                className="w-full justify-center"
              >
                {loading ? "Kirish..." : "Kirish"}
              </Button>
            </form>
          )}

          {/* ── OTP ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {errorMsg}
                </div>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                📱 Telegram ga 6 raqamli kod yuborildi. Kodni kiriting:
              </div>
              <div>
                <Input
                  label="Tasdiqlash kodi"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    setErrorMsg("");
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-bold"
                />
                {otpTimer > 0 && (
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Kod {Math.floor(otpTimer / 60)}:
                    {String(otpTimer % 60).padStart(2, "0")} da yaroqsiz bo'ladi
                  </p>
                )}
              </div>

              {/* Qurilmani eslab qolish toggle */}
              <label className="flex items-center gap-3 cursor-pointer bg-gray-50 rounded-xl p-3">
                <div
                  onClick={() => setTrustDevice((p) => !p)}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                    trustDevice ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      trustDevice ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Bu qurilmani eslab qol
                  </p>
                  <p className="text-xs text-gray-500">
                    30 kun davomida kod so'ralmaydi
                  </p>
                </div>
              </label>

              <Button
                type="submit"
                loading={loading}
                icon={<ShieldCheck className="w-4 h-4" />}
                disabled={loading || otp.length !== 6}
                className="w-full justify-center"
              >
                {loading ? "Tekshirilmoqda..." : "Tasdiqlash"}
              </Button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center py-1"
              >
                ← Orqaga qaytish
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
