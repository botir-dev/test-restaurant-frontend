"use client";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { tableApi } from "@/lib/services";
import { useAuthStore } from "@/store/auth.store";
import type { Table } from "@/types";
import { QrCode, Printer, Download, Loader2 } from "lucide-react";

// QRCode.js CDN dan yuklanadi
declare const QRCode: any;

function QRCodeBox({ table, branchId }: { table: Table; branchId: string }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const publicUrl = `https://restoops.botirdev.uz/menu?branch=${branchId}&table=${table.id}`;

  useEffect(() => {
    if (!qrRef.current) return;
    qrRef.current.innerHTML = "";

    const tryCreate = () => {
      if (typeof QRCode !== "undefined") {
        new QRCode(qrRef.current, {
          text: publicUrl,
          width: 160,
          height: 160,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M,
        });
      } else {
        setTimeout(tryCreate, 200);
      }
    };
    tryCreate();
  }, [publicUrl]);

  const handlePrint = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    const imgSrc = canvas?.toDataURL("image/png");
    if (!imgSrc) return;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html><head><title>${table.table_number}-stol QR</title>
      <style>
        body { font-family: Arial; text-align: center; padding: 30px; }
        img { width: 180px; height: 180px; display: block; margin: 0 auto; }
        h2 { color: #16a34a; margin: 12px 0 4px; font-size: 20px; }
        p { color: #666; font-size: 13px; margin: 2px 0; }
        .url { font-size: 9px; color: #999; margin-top: 10px; word-break: break-all; max-width: 200px; margin-inline: auto; }
        @media print { body { padding: 10px; } }
      </style>
      </head><body>
        <img src="${imgSrc}" />
        <h2>${table.table_number}-stol</h2>
        <p>Sig'imi: ${table.capacity} kishi</p>
        <div class="url">${publicUrl}</div>
        <script>window.onload = () => window.print();<\/script>
      </body></html>
    `);
    w.document.close();
  };

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `stol-${table.table_number}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="card text-center">
      <div className="flex justify-center mb-3">
        <div
          ref={qrRef}
          className="rounded-xl overflow-hidden"
          style={{ lineHeight: 0 }}
        />
      </div>
      <p className="font-bold text-gray-900 text-base">
        {table.table_number}-stol
      </p>
      <p className="text-xs text-gray-400 mb-3">
        {table.capacity} kishi · {table.is_occupied ? "Band" : "Bo'sh"}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1 border border-gray-200 text-gray-600 text-xs font-semibold py-2 rounded-xl hover:bg-gray-50 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Yuklab olish
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white text-xs font-semibold py-2 rounded-xl hover:bg-green-700 transition-all"
        >
          <Printer className="w-3.5 h-3.5" /> Chop etish
        </button>
      </div>
    </div>
  );
}

export default function QRPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: () => tableApi.getAll(),
  });

  const tables: Table[] = data?.data?.data || [];

  return (
    <>
      {/* QRCode.js CDN */}
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
        async
      />

      <div className="space-y-5 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="page-title">QR Kodlar</h1>
            <p className="text-sm text-gray-500">Har bir stol uchun QR kod</p>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <p className="text-sm text-green-800 font-semibold mb-1">
            ℹ️ QR kod qanday ishlaydi?
          </p>
          <p className="text-sm text-green-700">
            Mijoz QR kodni skanerlaydi → menyu ochiladi → ofitsiantni tanlaydi →
            buyurtma beradi → ofitsiantga darhol xabar keladi.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-16">
            <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Hali stol qo'shilmagan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => (
              <QRCodeBox
                key={table.id}
                table={table}
                branchId={user?.branch_id || ""}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
