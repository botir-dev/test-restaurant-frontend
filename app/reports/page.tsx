"use client";
import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { jsPDF } from "jspdf";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Loader2,
  TrendingUp,
  Package,
  Clock,
  Users,
  Star,
  History,
  Table2,
} from "lucide-react";
import clsx from "clsx";

// ─── Hisobot turlari ──────────────────────────────────────────
const REPORT_TYPES = [
  {
    id: "revenue",
    label: "Daromad hisoboti",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    id: "top-products",
    label: "Eng ko'p sotilgan mahsulotlar",
    icon: Package,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    id: "last-30-days",
    label: "Oxirgi 30 kunlik daromad",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "waiter-salary",
    label: "Ofitsiantlarga maosh",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    id: "top-waiters",
    label: "Eng faol ofitsiantlar",
    icon: Star,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    id: "order-history",
    label: "Buyurtmalar tarixi",
    icon: History,
    color: "text-gray-600",
    bg: "bg-gray-50",
  },
  {
    id: "top-tables",
    label: "Eng ko'p band stollar",
    icon: Table2,
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

const today = () => new Date().toISOString().split("T")[0];
const monthAgo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split("T")[0];
};

const fmt = (n: any) => Number(n || 0).toLocaleString("uz-UZ");
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("uz-UZ") : "-";

export default function ReportsPage() {
  const [activeType, setActiveType] = useState("revenue");
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(today());
  const printRef = useRef<HTMLDivElement>(null);

  const needsDates = activeType !== "last-30-days";
  const params = needsDates ? `?from=${from}T00:00:00&to=${to}T23:59:59` : "";

  const {
    data,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["report", activeType, from, to],
    queryFn: () =>
      api
        .get(`/archive/reports/${activeType}${params}`)
        .then((r) => r.data.data),
    enabled: !!activeType,
  });

  // ─── CHOP ETISH ───────────────────────────────────────────
  const handlePrint = useCallback(() => {
    const title =
      REPORT_TYPES.find((r) => r.id === activeType)?.label || "Hisobot";
    const dateRange = needsDates
      ? `${fmtDate(from)} — ${fmtDate(to)}`
      : "Oxirgi 30 kun";
    const content = printRef.current?.innerHTML || "";

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 20px; }
        h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #f3f4f6; font-weight: bold; text-align: left; padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 11px; }
        td { padding: 5px 8px; border: 1px solid #e5e7eb; font-size: 11px; }
        tr:nth-child(even) td { background: #f9fafb; }
        .summary { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .summary-item { text-align: center; }
        .summary-val { font-size: 16px; font-weight: bold; color: #166534; }
        .summary-lbl { font-size: 10px; color: #666; }
        @media print { button { display: none !important; } }
      </style>
      </head><body>
      <h1>${title}</h1>
      <div class="subtitle">Sana: ${dateRange}</div>
      ${content}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  }, [activeType, from, to, needsDates]);

  // ─── PDF YUKLASH — sof jsPDF, hech qanday plugin yo'q ────
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = useCallback(() => {
    setIsGenerating(true);
    try {
      const title =
        REPORT_TYPES.find((r) => r.id === activeType)?.label || "Hisobot";
      const dateRange = needsDates
        ? `${fmtDate(from)} — ${fmtDate(to)}`
        : "Oxirgi 30 kun";

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const marginX = 14;
      const usableW = pageW - marginX * 2;

      // ── Sarlavha ──────────────────────────────────────────
      pdf.setFontSize(15);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(20, 20, 20);
      pdf.text(title, marginX, 13);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Sana: ${dateRange}`, marginX, 19);
      pdf.setDrawColor(220, 220, 220);
      pdf.line(marginX, 22, pageW - marginX, 22);

      // ── DOM dan jadval ma'lumotlarini olish ───────────────
      const extractTable = (el: Element) => {
        const heads: string[] = [];
        const rows: string[][] = [];
        el.querySelectorAll("thead th").forEach((th) =>
          heads.push(th.textContent?.trim() ?? ""),
        );
        el.querySelectorAll("tbody tr").forEach((tr) => {
          const cells: string[] = [];
          tr.querySelectorAll("td").forEach((td) =>
            cells.push(td.textContent?.trim() ?? ""),
          );
          if (cells.length) rows.push(cells);
        });
        return { heads, rows };
      };

      // ── Jadval chizish funksiyasi ─────────────────────────
      const drawTable = (
        heads: string[],
        rows: string[][],
        startY: number,
        sectionLabel?: string,
      ): number => {
        let y = startY;
        const colCount = heads.length || (rows[0]?.length ?? 1);
        const colW = usableW / colCount;
        const rowH = 7;
        const headH = 8;

        if (sectionLabel) {
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(100, 100, 100);
          pdf.text(sectionLabel.toUpperCase(), marginX, y + 4);
          y += 7;
        }

        // Thead
        if (heads.length) {
          pdf.setFillColor(243, 244, 246);
          pdf.rect(marginX, y, usableW, headH, "F");
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(40, 40, 40);
          heads.forEach((h, i) => {
            pdf.text(
              h.length > 18 ? h.slice(0, 17) + "…" : h,
              marginX + i * colW + 2,
              y + 5.5,
            );
          });
          y += headH;
        }

        // Tbody
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        rows.forEach((row, ri) => {
          // Sahifa to'lsa yangi sahifa
          if (y + rowH > pageH - 10) {
            pdf.addPage();
            y = 14;
          }
          if (ri % 2 === 1) {
            pdf.setFillColor(249, 250, 251);
            pdf.rect(marginX, y, usableW, rowH, "F");
          }
          pdf.setTextColor(30, 30, 30);
          row.forEach((cell, ci) => {
            const txt = cell.length > 20 ? cell.slice(0, 19) + "…" : cell;
            pdf.text(txt, marginX + ci * colW + 2, y + 5);
          });
          // Qator osti chizig'i
          pdf.setDrawColor(235, 235, 235);
          pdf.line(marginX, y + rowH, pageW - marginX, y + rowH);
          y += rowH;
        });

        return y + 4;
      };

      // ── Jadvalni render qilish ────────────────────────────
      const tables = Array.from(
        printRef.current?.querySelectorAll("table") ?? [],
      );
      let curY = 26;

      if (tables.length > 0) {
        for (const table of tables) {
          const { heads, rows } = extractTable(table);
          const prevEl = table.previousElementSibling;
          const label =
            prevEl?.tagName === "P"
              ? (prevEl.textContent?.trim() ?? undefined)
              : undefined;
          curY = drawTable(heads, rows, curY, label);
        }
      } else {
        const allText = printRef.current?.innerText ?? "";
        pdf.setFontSize(9);
        pdf.setTextColor(30);
        pdf.text(allText.slice(0, 1500), marginX, 28, { maxWidth: usableW });
      }

      const fileName = `${title.replace(/\s+/g, "_")}_${from || "hisobot"}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF xatosi:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [activeType, from, to, needsDates]);

  const currentType = REPORT_TYPES.find((r) => r.id === activeType)!;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="page-title">Hisobotlar</h1>
            <p className="text-sm text-gray-500">
              Chop etish yoki yuklab olish
            </p>
          </div>
        </div>
        {data && (
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-2 text-sm py-2 px-3"
            >
              <Printer className="w-4 h-4" /> Chop etish
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="btn-primary flex items-center gap-2 text-sm py-2 px-3 disabled:opacity-60"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isGenerating ? "Tayyorlanmoqda..." : "PDF saqlash"}
            </button>
          </div>
        )}
      </div>

      {/* Hisobot turlari */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setActiveType(rt.id)}
            className={clsx(
              "flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all text-sm font-semibold",
              activeType === rt.id
                ? `border-current ${rt.color} ${rt.bg}`
                : "border-gray-100 bg-white text-gray-600 hover:border-gray-300",
            )}
          >
            <rt.icon
              className={clsx(
                "w-4 h-4 flex-shrink-0",
                activeType === rt.id ? rt.color : "text-gray-400",
              )}
            />
            <span className="leading-tight">{rt.label}</span>
          </button>
        ))}
      </div>

      {/* Sana filtri */}
      {needsDates && (
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 flex-wrap">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm text-gray-600 font-medium">Dan:</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input py-1.5 text-sm w-auto"
              max={to}
            />
            <label className="text-sm text-gray-600 font-medium">Gacha:</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input py-1.5 text-sm w-auto"
              min={from}
              max={today()}
            />
          </div>
        </div>
      )}

      {/* Hisobot mazmuni */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <currentType.icon className={clsx("w-5 h-5", currentType.color)} />
          <h2 className="font-bold text-gray-900">{currentType.label}</h2>
          {!needsDates && (
            <span className="text-xs text-gray-500 ml-auto">Oxirgi 30 kun</span>
          )}
          {needsDates && from && to && (
            <span className="text-xs text-gray-500 ml-auto">
              {fmtDate(from)} — {fmtDate(to)}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : fetchError ? (
          <p className="text-center py-10 text-red-500 text-sm">
            Ma'lumot yuklanmadi
          </p>
        ) : (
          <div ref={printRef}>
            {activeType === "revenue" && <RevenueReport data={data} />}
            {activeType === "top-products" && <TopProductsReport data={data} />}
            {activeType === "last-30-days" && <Last30DaysReport data={data} />}
            {activeType === "waiter-salary" && (
              <WaiterSalaryReport data={data} />
            )}
            {activeType === "top-waiters" && <TopWaitersReport data={data} />}
            {activeType === "order-history" && (
              <OrderHistoryReport data={data} />
            )}
            {activeType === "top-tables" && <TopTablesReport data={data} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 1. DAROMAD HISOBOTI ──────────────────────────────────────
function RevenueReport({ data }: any) {
  const s = data?.summary || {};
  return (
    <div>
      <div className="summary grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
        <SummaryCard
          label="Jami buyurtmalar"
          value={fmt(s.total_orders) + " ta"}
        />
        <SummaryCard
          label="Jami daromad"
          value={formatPrice(s.total_revenue)}
        />
        <SummaryCard label="O'rtacha chek" value={formatPrice(s.avg_order)} />
        <SummaryCard label="Naqd" value={formatPrice(s.cash)} />
        <SummaryCard label="Karta" value={formatPrice(s.card)} />
        <SummaryCard label="QR" value={formatPrice(s.qr)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <Th>Sana</Th>
              <Th>Vaqt</Th>
              <Th>Stol</Th>
              <Th>Ofitsiant</Th>
              <Th>Kassir</Th>
              <Th>Mehmon</Th>
              <Th>Mahsulotlar</Th>
              <Th>Xiz.haqi</Th>
              <Th>JAMI</Th>
              <Th>To'lov</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.rows || []).map((r: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                <Td>{r.date}</Td>
                <Td>{r.time}</Td>
                <Td>{r.table_number}-stol</Td>
                <Td>{r.waiter_name}</Td>
                <Td>{r.cashier_name}</Td>
                <Td>{r.guest_count}</Td>
                <Td>{formatPrice(r.total_amount)}</Td>
                <Td>
                  {r.service_fee_percent > 0
                    ? `${r.service_fee_percent}% (${formatPrice(r.service_fee_amount)})`
                    : "—"}
                </Td>
                <Td className="font-bold text-green-700">
                  {formatPrice(r.grand_total)}
                </Td>
                <Td>
                  {r.payment_type === "cash"
                    ? "Naqd"
                    : r.payment_type === "card"
                      ? "Karta"
                      : "QR"}
                </Td>
              </tr>
            ))}
            {!data?.rows?.length && <EmptyRow cols={10} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 2. ENG KO'P SOTILGAN ─────────────────────────────────────
function TopProductsReport({ data }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <Th>#</Th>
            <Th>Mahsulot nomi</Th>
            <Th>Turi</Th>
            <Th>Sotildi</Th>
            <Th>Buyurtmalar</Th>
            <Th>O'rtacha vaqt</Th>
            <Th>Jami daromad</Th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((r: any, i: number) => (
            <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
              <Td className="font-bold text-gray-400">{i + 1}</Td>
              <Td className="font-semibold">{r.name}</Td>
              <Td>{r.type}</Td>
              <Td className="font-bold text-orange-600">
                {fmt(r.total_sold)} ta
              </Td>
              <Td>{fmt(r.order_count)} ta</Td>
              <Td>{r.avg_time || "—"}</Td>
              <Td className="font-bold text-green-700">
                {formatPrice(r.total_revenue)}
              </Td>
            </tr>
          ))}
          {!data?.length && <EmptyRow cols={7} />}
        </tbody>
      </table>
    </div>
  );
}

// ─── 3. OXIRGI 30 KUN ─────────────────────────────────────────
function Last30DaysReport({ data }: any) {
  const t = data?.total || {};
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <SummaryCard label="Jami buyurtmalar" value={fmt(t.orders) + " ta"} />
        <SummaryCard label="Jami daromad" value={formatPrice(t.revenue)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <Th>Sana</Th>
              <Th>Buyurtmalar</Th>
              <Th>Daromad</Th>
              <Th>O'rtacha</Th>
              <Th>Naqd</Th>
              <Th>Karta</Th>
              <Th>QR</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.rows || []).map((r: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                <Td>{fmtDate(r.date)}</Td>
                <Td className="font-semibold">{fmt(r.orders)} ta</Td>
                <Td className="font-bold text-green-700">
                  {formatPrice(r.revenue)}
                </Td>
                <Td>{formatPrice(r.avg_order)}</Td>
                <Td>{formatPrice(r.cash)}</Td>
                <Td>{formatPrice(r.card)}</Td>
                <Td>{formatPrice(r.qr)}</Td>
              </tr>
            ))}
            {!data?.rows?.length && <EmptyRow cols={7} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 4. OFITSIANT MAOSHI ──────────────────────────────────────
function WaiterSalaryReport({ data }: any) {
  const summary: any[] = data?.summary || [];
  const rows: any[] = data?.rows || [];

  return (
    <div className="space-y-4">
      {/* Umumiy xulosa */}
      <div className="overflow-x-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Umumiy xulosa
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-50">
              <Th>Ofitsiant</Th>
              <Th>Jami buyurtma</Th>
              <Th>Buyurtmalar summa</Th>
              <Th>Jami maosh</Th>
            </tr>
          </thead>
          <tbody>
            {summary.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                <Td className="font-semibold">{r.waiter_name}</Td>
                <Td>{fmt(r.total_orders)} ta</Td>
                <Td>{formatPrice(r.total_orders_amount)}</Td>
                <Td className="font-bold text-purple-700">
                  {formatPrice(r.total_earned)}
                </Td>
              </tr>
            ))}
            {!summary.length && <EmptyRow cols={4} />}
          </tbody>
        </table>
      </div>
      {/* Kunlik tafsilot */}
      <div className="overflow-x-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Kunlik tafsilot
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <Th>Ofitsiant</Th>
              <Th>Sana</Th>
              <Th>Buyurtmalar</Th>
              <Th>Buyurtmalar summa</Th>
              <Th>Komissiya %</Th>
              <Th>Maosh</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                <Td className="font-semibold">{r.waiter_name}</Td>
                <Td>{fmtDate(r.date)}</Td>
                <Td>{fmt(r.orders)} ta</Td>
                <Td>{formatPrice(r.orders_total)}</Td>
                <Td>{r.commission_percent || 0}%</Td>
                <Td className="font-bold text-purple-700">
                  {formatPrice(r.earned)}
                </Td>
              </tr>
            ))}
            {!rows.length && <EmptyRow cols={6} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 5. ENG FAOL OFITSIANTLAR ─────────────────────────────────
function TopWaitersReport({ data }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-yellow-50">
            <Th>#</Th>
            <Th>Ofitsiant</Th>
            <Th>Buyurtmalar</Th>
            <Th>Ish kunlari</Th>
            <Th>O'rtacha chek</Th>
            <Th>Jami daromad</Th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((r: any, i: number) => (
            <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
              <Td className="font-bold text-gray-400">{i + 1}</Td>
              <Td className="font-semibold">{r.waiter_name}</Td>
              <Td className="font-bold text-yellow-600">
                {fmt(r.total_orders)} ta
              </Td>
              <Td>{fmt(r.working_days)} kun</Td>
              <Td>{formatPrice(r.avg_order)}</Td>
              <Td className="font-bold text-green-700">
                {formatPrice(r.total_revenue)}
              </Td>
            </tr>
          ))}
          {!data?.length && <EmptyRow cols={6} />}
        </tbody>
      </table>
    </div>
  );
}

// ─── 6. BUYURTMALAR TARIXI ────────────────────────────────────
function OrderHistoryReport({ data }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <Th>Sana</Th>
            <Th>Vaqt</Th>
            <Th>Stol</Th>
            <Th>Ofitsiant</Th>
            <Th>Kassir</Th>
            <Th>Mehmon</Th>
            <Th>Mahsulotlar (batafsil)</Th>
            <Th>Jami</Th>
            <Th>To'lov</Th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((r: any, i: number) => (
            <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
              <Td>{r.date}</Td>
              <Td>{r.time}</Td>
              <Td>{r.table_number}-stol</Td>
              <Td>{r.waiter_name}</Td>
              <Td>{r.cashier_name}</Td>
              <Td>{r.guest_count}</Td>
              <Td>
                <div className="space-y-0.5">
                  {(r.items || []).map((item: any, j: number) => (
                    <div key={j} className="text-xs text-gray-600">
                      {item.name} x{item.quantity} ={" "}
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  ))}
                </div>
              </Td>
              <Td className="font-bold text-green-700">
                {formatPrice(r.grand_total)}
              </Td>
              <Td>
                {r.payment_type === "cash"
                  ? "Naqd"
                  : r.payment_type === "card"
                    ? "Karta"
                    : "QR"}
              </Td>
            </tr>
          ))}
          {!data?.length && <EmptyRow cols={9} />}
        </tbody>
      </table>
    </div>
  );
}

// ─── 7. ENG KO'P BAND STOLLAR ────────────────────────────────
function TopTablesReport({ data }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-red-50">
            <Th>#</Th>
            <Th>Stol raqami</Th>
            <Th>Buyurtmalar soni</Th>
            <Th>Faol kunlar</Th>
            <Th>O'rtacha chek</Th>
            <Th>Jami daromad</Th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((r: any, i: number) => (
            <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
              <Td className="font-bold text-gray-400">{i + 1}</Td>
              <Td className="font-semibold">{r.table_number}-stol</Td>
              <Td
                className={clsx(
                  "font-bold",
                  r.total_orders > 0 ? "text-red-600" : "text-gray-300",
                )}
              >
                {fmt(r.total_orders)} ta
              </Td>
              <Td>{fmt(r.active_days)} kun</Td>
              <Td>{r.total_orders > 0 ? formatPrice(r.avg_order) : "—"}</Td>
              <Td
                className={clsx(
                  "font-bold",
                  r.total_orders > 0 ? "text-green-700" : "text-gray-300",
                )}
              >
                {r.total_orders > 0 ? formatPrice(r.total_revenue) : "—"}
              </Td>
            </tr>
          ))}
          {!data?.length && <EmptyRow cols={6} />}
        </tbody>
      </table>
    </div>
  );
}

// ─── Yordamchi komponentlar ───────────────────────────────────
const Th = ({ children }: any) => (
  <th className="text-left text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-2 border-b border-gray-200 whitespace-nowrap">
    {children}
  </th>
);
const Td = ({ children, className }: any) => (
  <td
    className={clsx(
      "px-3 py-2 text-sm border-b border-gray-100 whitespace-nowrap",
      className,
    )}
  >
    {children}
  </td>
);
const EmptyRow = ({ cols }: { cols: number }) => (
  <tr>
    <td colSpan={cols} className="text-center py-8 text-gray-400 text-sm">
      Ma'lumot topilmadi
    </td>
  </tr>
);
const SummaryCard = ({ label, value }: { label: string; value: string }) => (
  <div className="summary-item text-center">
    <div className="summary-val text-lg font-bold text-green-700">{value}</div>
    <div className="summary-lbl text-xs text-gray-500 mt-0.5">{label}</div>
  </div>
);
