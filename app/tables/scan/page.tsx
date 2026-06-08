"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { tableApi } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  QrCode,
  Keyboard,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mode, setMode] = useState<"scan" | "manual">("manual");
  const [tableId, setTableId] = useState("");
  const [scanned, setScanned] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // QR scanner orqali kelgan table_id bilan stol band qilinadi
  const findAndOccupy = useMutation({
    mutationFn: async (id: string) => {
      // Avval barcha stollarni olib, id bo'yicha topamiz
      const res = await tableApi.getAll();
      const tables = res.data.data;
      const table = tables.find(
        (t: any) => t.id === id || String(t.table_number) === id,
      );
      if (!table) throw new Error("Stol topilmadi");
      if (table.is_occupied)
        throw new Error(`${table.table_number}-stol allaqachon band`);
      return { tableId: table.id, tableNumber: table.table_number };
    },
    onSuccess: (data) => {
      setScanned(true);
      setTimeout(() => {
        router.push(`/tables/${data.tableId}/occupy`);
      }, 800);
    },
    onError: (e: any) => toast.error(e.message || "Xato"),
  });

  useEffect(() => {
    if (mode === "manual") inputRef.current?.focus();
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableId.trim()) return;
    findAndOccupy.mutate(tableId.trim());
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="page-title">QR Skanerlash</h1>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {[
          { key: "scan", label: "QR Skaner", icon: QrCode },
          { key: "manual", label: "Qo'lda kiritish", icon: Keyboard },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === m.key
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500"
            }`}
          >
            <m.icon className="w-4 h-4" /> {m.label}
          </button>
        ))}
      </div>

      {mode === "scan" ? (
        <div className="card text-center">
          <div className="w-48 h-48 border-2 border-dashed border-green-300 rounded-2xl mx-auto flex flex-col items-center justify-center bg-green-50 mb-4">
            <QrCode className="w-16 h-16 text-green-400 mb-2" />
            <p className="text-sm text-gray-500">Kamera tayyor emas</p>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Yoki qo'lda kiritish usulidan foydalaning
          </p>
          <button
            onClick={() => setMode("manual")}
            className="btn-secondary justify-center text-sm"
          >
            <Keyboard className="w-4 h-4" /> Qo'lda kiritish
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Stol ID yoki raqamini kiriting
              </p>
              <p className="text-xs text-gray-500">
                QR koddan skanerlangan ID yoki stol raqami
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              ref={inputRef}
              className="input text-center text-lg font-bold tracking-wider"
              placeholder="Stol ID yoki raqami"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
            />
            <button
              type="submit"
              disabled={!tableId || findAndOccupy.isPending}
              className="btn-primary w-full justify-center"
            >
              {findAndOccupy.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : scanned ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <QrCode className="w-4 h-4" />
              )}
              {findAndOccupy.isPending
                ? "Tekshirilmoqda..."
                : scanned
                  ? "Topildi!"
                  : "Stolni topish"}
            </button>
          </form>
        </div>
      )}

      <div className="card bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-800 font-semibold mb-1">
          📋 Qanday ishlaydi?
        </p>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Har bir stolda QR kod yoki stol raqami yozilgan</li>
          <li>• Stol ID ni skanerlang yoki qo'lda kiriting</li>
          <li>• Keyin mehmonlar sonini kiriting va xizmat boshlang</li>
        </ul>
      </div>
    </div>
  );
}
