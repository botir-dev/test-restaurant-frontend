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
  ShoppingCart,
  Truck,
  Bike,
  BarChart2,
  X,
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
    label: "Eng ko'p sotilgan",
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
  {
    id: "product-history",
    label: "Mahsulotlar tarixi",
    icon: ShoppingCart,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    id: "expenses-30",
    label: "30 kunlik harajat",
    icon: BarChart2,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    id: "delivery",
    label: "Dostavka buyurtmalari",
    icon: Truck,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    id: "takeaway",
    label: "Saboy buyurtmalari",
    icon: Bike,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    id: "last-30-extended",
    label: "30 kun solishtirish",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
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

// ─── Expenses modal ───────────────────────────────────────────
function ExpensesModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (vals: any) => void;
}) {
  const [electricity, setElectricity] = useState("");
  const [water, setWater] = useState("");
  const [gas, setGas] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            30 kunlik harajat hisoboti
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Oylik kommunal xarajatlarni kiriting (so'mda):
        </p>
        <div className="space-y-3">
          {[
            {
              label: "⚡ Elektr energiya sarfi",
              val: electricity,
              set: setElectricity,
            },
            { label: "💧 Suv sarfi", val: water, set: setWater },
            { label: "🔥 Gaz sarfi", val: gas, set: setGas },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {label}
              </label>
              <input
                type="number"
                min="0"
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder="0"
                className="input w-full py-2 text-sm"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            onSubmit({
              electricity: parseFloat(electricity) || 0,
              water: parseFloat(water) || 0,
              gas: parseFloat(gas) || 0,
            })
          }
          className="btn-primary w-full mt-5 py-2.5"
        >
          Hisobotni olish
        </button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [activeType, setActiveType] = useState("revenue");
  const [from, setFrom] = useState(monthAgo());
  const [to, setTo] = useState(today());
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [expensesParams, setExpensesParams] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const needsDates = ![
    "last-30-days",
    "expenses-30",
    "last-30-extended",
  ].includes(activeType);

  // expenses-30 uchun query params
  const expQuery = expensesParams
    ? `?electricity=${expensesParams.electricity}&water=${expensesParams.water}&gas=${expensesParams.gas}`
    : null;

  const params = needsDates ? `?from=${from}T00:00:00&to=${to}T23:59:59` : "";

  const {
    data,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["report", activeType, from, to, expensesParams],
    queryFn: () => {
      if (activeType === "expenses-30") {
        if (!expQuery) return Promise.resolve(null);
        return api
          .get(`/archive/reports/expenses-30${expQuery}`)
          .then((r) => r.data.data);
      }
      if (activeType === "last-30-extended") {
        return api
          .get(`/archive/reports/last-30-extended`)
          .then((r) => r.data.data);
      }
      return api
        .get(`/archive/reports/${activeType}${params}`)
        .then((r) => r.data.data);
    },
    enabled: activeType === "expenses-30" ? !!expQuery : !!activeType,
  });

  // expenses-30 tanlanganida modal
  const handleTypeSelect = (id: string) => {
    setActiveType(id);
    if (id === "expenses-30") {
      setExpensesParams(null);
      setShowExpensesModal(true);
    }
  };

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
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        rows.forEach((row, ri) => {
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
          pdf.setDrawColor(235, 235, 235);
          pdf.line(marginX, y + rowH, pageW - marginX, y + rowH);
          y += rowH;
        });
        return y + 4;
      };

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
      // expenses-30 uchun umumiy harajatni PDF oxiriga qo'shamiz
      if (activeType === "expenses-30" && data) {
        if (curY + 60 > pageH - 10) {
          pdf.addPage();
          curY = 14;
        }
        curY += 4;
        pdf.setFillColor(30, 30, 30);
        pdf.rect(marginX, curY, usableW, 8, "F");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 220, 50);
        pdf.text("UMUMIY HARAJAT (OXIRGI 30 KUN)", marginX + 2, curY + 5.5);
        curY += 10;

        const expLines = [
          [
            "Ombor harajati:",
            `${Number(data.inventory?.total || 0).toLocaleString()} so'm`,
          ],
          [
            "Maoshlar:",
            `${Number(data.salary?.total || 0).toLocaleString()} so'm`,
          ],
          [
            "Kommunal xarajatlar:",
            `${Number(data.utilities?.total || 0).toLocaleString()} so'm`,
          ],
          [
            "QQS (12%):",
            `${Number(data.orders?.vat_amount || 0).toLocaleString()} so'm`,
          ],
          [
            "JAMI HARAJAT:",
            `${Number(data.grand_total || 0).toLocaleString()} so'm`,
          ],
        ];
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(20, 20, 20);
        expLines.forEach(([label, val], i) => {
          const isBold = i === expLines.length - 1;
          if (isBold) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            pdf.setTextColor(0, 100, 0);
          }
          if (curY + 8 > pageH - 10) {
            pdf.addPage();
            curY = 14;
          }
          pdf.text(label, marginX + 2, curY + 5);
          pdf.text(val, pageW - marginX - 2, curY + 5, { align: "right" });
          pdf.setDrawColor(220, 220, 220);
          pdf.line(marginX, curY + 7, pageW - marginX, curY + 7);
          curY += 8;
        });
      }

      pdf.save(`${title.replace(/\s+/g, "_")}_${from || "hisobot"}.pdf`);
    } catch (err) {
      console.error("PDF xatosi:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [activeType, from, to, needsDates]);

  const currentType = REPORT_TYPES.find((r) => r.id === activeType)!;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Expenses modal */}
      {showExpensesModal && (
        <ExpensesModal
          onClose={() => setShowExpensesModal(false)}
          onSubmit={(vals) => {
            setExpensesParams(vals);
            setShowExpensesModal(false);
          }}
        />
      )}

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
            onClick={() => handleTypeSelect(rt.id)}
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

      {/* expenses-30 ni qayta ochish */}
      {activeType === "expenses-30" && expensesParams && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm">
          <BarChart2 className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span className="text-rose-700 font-medium">
            Elektr: {fmt(expensesParams.electricity)} so'm | Suv:{" "}
            {fmt(expensesParams.water)} so'm | Gaz: {fmt(expensesParams.gas)}{" "}
            so'm
          </span>
          <button
            onClick={() => setShowExpensesModal(true)}
            className="ml-auto text-xs text-rose-600 underline"
          >
            O'zgartirish
          </button>
        </div>
      )}

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
          {!needsDates &&
            activeType !== "expenses-30" &&
            activeType !== "last-30-extended" && (
              <span className="text-xs text-gray-500 ml-auto">
                Oxirgi 30 kun
              </span>
            )}
          {needsDates && from && to && (
            <span className="text-xs text-gray-500 ml-auto">
              {fmtDate(from)} — {fmtDate(to)}
            </span>
          )}
        </div>

        {activeType === "expenses-30" && !expensesParams ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <BarChart2 className="w-10 h-10 text-rose-300" />
            <p className="text-gray-500 text-sm">
              Kommunal xarajatlarni kiritib hisobot oling
            </p>
            <button
              onClick={() => setShowExpensesModal(true)}
              className="btn-primary text-sm py-2 px-4"
            >
              Ma'lumot kiritish
            </button>
          </div>
        ) : isLoading ? (
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
            {activeType === "product-history" && (
              <ProductHistoryReport data={data} />
            )}
            {activeType === "expenses-30" && expensesParams && (
              <Expenses30Report data={data} params={expensesParams} />
            )}
            {activeType === "delivery" && <DeliveryReport data={data} />}
            {activeType === "takeaway" && <TakeawayReport data={data} />}
            {activeType === "last-30-extended" && (
              <Last30ExtendedReport data={data} />
            )}
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
        <SummaryCard
          label="O'rtacha chek"
          value={formatPrice(Math.round(s.avg_order))}
        />
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
        <SummaryCard
          label="Jami buyurtmalar"
          value={fmt(t.orders) + " ta"}
          color="text-blue-700"
        />
        <SummaryCard
          label="Jami daromad"
          value={formatPrice(t.revenue)}
          color="text-blue-700"
        />
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

// ─── 8. MAHSULOTLAR TARIXI ────────────────────────────────────
function ProductHistoryReport({ data }: any) {
  const rows: any[] = data?.rows || [];
  const summary: any[] = data?.summary || [];
  const grandTotal = data?.grand_total || 0;

  const unitLabel = (r: any) =>
    r.unit === "custom" ? r.custom_unit || "birlik" : r.unit;

  return (
    <div className="space-y-5">
      {/* Kiruvchi mahsulotlar jadvali */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Barcha kelgan mahsulotlar
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-teal-50">
                <Th>Sana</Th>
                <Th>Vaqt</Th>
                <Th>Mahsulot</Th>
                <Th>O'lchov birligi</Th>
                <Th>Miqdor</Th>
                <Th>Birlik narxi (tannarx)</Th>
                <Th>Umumiy narx</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <Td>{r.date}</Td>
                  <Td>{r.time}</Td>
                  <Td className="font-semibold">{r.product_name}</Td>
                  <Td>{unitLabel(r)}</Td>
                  <Td className="font-bold text-teal-700">{fmt(r.quantity)}</Td>
                  <Td>{r.unit_cost ? formatPrice(r.unit_cost) : "—"}</Td>
                  <Td className="font-bold text-green-700">
                    {formatPrice(r.total_cost)}
                  </Td>
                </tr>
              ))}
              {!rows.length && <EmptyRow cols={7} />}
            </tbody>
          </table>
        </div>
      </div>

      {/* Umumiy xulosa mahsulot bo'yicha */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Umumiy xulosa (mahsulot bo'yicha)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <Th>Mahsulot</Th>
                <Th>O'lchov</Th>
                <Th>Umumiy miqdor</Th>
                <Th>Birlik narxi</Th>
                <Th>Umumiy narx</Th>
              </tr>
            </thead>
            <tbody>
              {summary.map((r: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <Td className="font-semibold">{r.product_name}</Td>
                  <Td>{unitLabel(r)}</Td>
                  <Td className="font-bold text-teal-700">
                    {fmt(r.total_quantity)}
                  </Td>
                  <Td>{r.unit_cost ? formatPrice(r.unit_cost) : "—"}</Td>
                  <Td className="font-bold text-green-700">
                    {formatPrice(r.total_cost)}
                  </Td>
                </tr>
              ))}
              {!summary.length && <EmptyRow cols={5} />}
              {summary.length > 0 && (
                <tr className="bg-green-50 font-bold">
                  <td
                    colSpan={4}
                    className="px-3 py-2 text-sm text-right text-gray-700 border-t-2 border-green-200"
                  >
                    Umumiy jami:
                  </td>
                  <Td className="text-green-700 text-base border-t-2 border-green-200">
                    {formatPrice(grandTotal)}
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── 9. 30 KUNLIK HARAJAT ─────────────────────────────────────
function Expenses30Report({ data, params }: any) {
  if (!data)
    return <div className="py-10 text-center text-gray-400">Ma'lumot yo'q</div>;

  const inv = data.inventory || {};
  const salary = data.salary || {};
  const util = data.utilities || {};
  const orders = data.orders || {};
  const invRows: any[] = inv.rows || [];
  const commStaff: any[] = salary.commission_staff || [];
  const monthStaff: any[] = salary.monthly_staff || [];

  return (
    <div className="space-y-6">
      {/* 1. Ombor harajatlari */}
      <Section
        title="📦 Omborga kelgan mahsulotlar (oxirgi 30 kun)"
        color="bg-orange-50 border-orange-200"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-orange-50">
              <Th>Mahsulot</Th>
              <Th>O'lchov</Th>
              <Th>Miqdor</Th>
              <Th>Birlik narxi</Th>
              <Th>Umumiy narx</Th>
            </tr>
          </thead>
          <tbody>
            {invRows.map((r: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                <Td className="font-semibold">{r.product_name}</Td>
                <Td>{r.unit === "custom" ? r.custom_unit : r.unit}</Td>
                <Td>{fmt(r.total_quantity)}</Td>
                <Td>{r.unit_cost ? formatPrice(r.unit_cost) : "—"}</Td>
                <Td className="font-bold text-orange-700">
                  {formatPrice(r.total_cost)}
                </Td>
              </tr>
            ))}
            {!invRows.length && <EmptyRow cols={5} />}
            {invRows.length > 0 && (
              <tr className="bg-orange-100 font-bold">
                <td
                  colSpan={4}
                  className="px-3 py-2 text-sm text-right text-gray-700"
                >
                  Jami ombor harajati:
                </td>
                <Td className="text-orange-700">{formatPrice(inv.total)}</Td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* 2. Maoshlar */}
      <Section
        title="👥 Hodimlar maoshi (oxirgi 30 kun)"
        color="bg-purple-50 border-purple-200"
      >
        {commStaff.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-purple-600 uppercase mb-2">
              Foizli (komissiya) maosh
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50">
                  <Th>Hodim</Th>
                  <Th>Lavozim</Th>
                  <Th>Hisoblangan maosh</Th>
                </tr>
              </thead>
              <tbody>
                {commStaff.map((r: any, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                    <Td className="font-semibold">{r.full_name}</Td>
                    <Td>{r.role}</Td>
                    <Td className="font-bold text-purple-700">
                      {formatPrice(r.earned)}
                    </Td>
                  </tr>
                ))}
                <tr className="bg-purple-100 font-bold">
                  <td
                    colSpan={2}
                    className="px-3 py-2 text-sm text-right text-gray-700"
                  >
                    Jami foizli maosh:
                  </td>
                  <Td className="text-purple-700">
                    {formatPrice(salary.total_commission)}
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {monthStaff.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">
              Oylik biriktirilgan maosh
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-50">
                  <Th>Hodim</Th>
                  <Th>Lavozim</Th>
                  <Th>Oylik maosh</Th>
                </tr>
              </thead>
              <tbody>
                {monthStaff.map((r: any, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                    <Td className="font-semibold">{r.full_name}</Td>
                    <Td>{r.role}</Td>
                    <Td className="font-bold text-indigo-700">
                      {formatPrice(r.monthly_salary)}
                    </Td>
                  </tr>
                ))}
                <tr className="bg-indigo-100 font-bold">
                  <td
                    colSpan={2}
                    className="px-3 py-2 text-sm text-right text-gray-700"
                  >
                    Jami oylik maosh:
                  </td>
                  <Td className="text-indigo-700">
                    {formatPrice(salary.total_monthly)}
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="bg-purple-100 rounded-lg p-3 text-sm font-bold text-purple-800 text-right">
          Jami maoshlar: {formatPrice(salary.total)}
        </div>
      </Section>

      {/* 3. Kommunal xarajatlar */}
      <Section
        title="🔌 Kommunal xarajatlar"
        color="bg-yellow-50 border-yellow-200"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-yellow-50">
              <Th>Tur</Th>
              <Th>Narxi</Th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "⚡ Elektr energiya", val: util.electricity },
              { label: "💧 Suv", val: util.water },
              { label: "🔥 Gaz", val: util.gas },
            ].map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                <Td className="font-semibold">{item.label}</Td>
                <Td className="font-bold text-yellow-700">
                  {formatPrice(item.val)}
                </Td>
              </tr>
            ))}
            <tr className="bg-yellow-100 font-bold">
              <td className="px-3 py-2 text-sm text-right text-gray-700">
                Jami kommunal:
              </td>
              <Td className="text-yellow-700">{formatPrice(util.total)}</Td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* 4. Buyurtmalar va QQS */}
      <Section
        title="🧾 Buyurtmalar va QQS (oxirgi 30 kun)"
        color="bg-green-50 border-green-200"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-50">
              <Th>Ko'rsatkich</Th>
              <Th>Miqdor</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td className="font-semibold">Jami buyurtmalar soni</Td>
              <Td className="font-bold text-green-700">
                {fmt(orders.total_orders)} ta
              </Td>
            </tr>
            <tr className="bg-gray-50">
              <Td className="font-semibold">Umumiy daromad</Td>
              <Td className="font-bold text-green-700">
                {formatPrice(orders.total_revenue)}
              </Td>
            </tr>
            <tr>
              <Td className="font-semibold">QQS (12%) — to'lanadigan</Td>
              <Td className="font-bold text-red-600">
                {formatPrice(orders.vat_amount)}
              </Td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* 5. Umumiy harajat */}
      <div className="bg-gray-900 rounded-xl p-5 text-white">
        <p className="text-sm text-gray-400 mb-3 font-medium uppercase tracking-wide">
          Umumiy harajat (oxirgi 30 kun)
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Ombor harajati:</span>
            <span className="font-semibold">{formatPrice(inv.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Maoshlar:</span>
            <span className="font-semibold">{formatPrice(salary.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Kommunal xarajatlar:</span>
            <span className="font-semibold">{formatPrice(util.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">QQS (12%):</span>
            <span className="font-semibold text-red-400">
              {formatPrice(orders.vat_amount)}
            </span>
          </div>
          <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between text-base">
            <span className="font-bold">JAMI HARAJAT:</span>
            <span className="font-bold text-xl text-yellow-400">
              {formatPrice(data.grand_total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 10. DOSTAVKA BUYURTMALARI ────────────────────────────────
function DeliveryReport({ data }: any) {
  const rows: any[] = data?.rows || [];
  const daily: any[] = data?.daily || [];
  const s = data?.summary || {};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <SummaryCard
          label="Jami buyurtmalar"
          value={fmt(s.total_orders) + " ta"}
          color="text-indigo-700"
        />
        <SummaryCard
          label="Jami mahsulotlar"
          value={fmt(s.total_items) + " ta"}
          color="text-indigo-700"
        />
        <SummaryCard
          label="Jami daromad"
          value={formatPrice(s.total_revenue)}
          color="text-indigo-700"
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Kunlik statistika
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-indigo-50">
                <Th>Sana</Th>
                <Th>Buyurtmalar</Th>
                <Th>Mahsulotlar</Th>
                <Th>Daromad</Th>
              </tr>
            </thead>
            <tbody>
              {daily.map((r: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <Td className="font-semibold">{r.date}</Td>
                  <Td className="font-bold text-indigo-700">
                    {fmt(r.order_count)} ta
                  </Td>
                  <Td>{fmt(r.item_count)} ta</Td>
                  <Td className="font-bold text-green-700">
                    {formatPrice(r.revenue)}
                  </Td>
                </tr>
              ))}
              {!daily.length && <EmptyRow cols={4} />}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Barcha buyurtmalar
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <Th>Sana</Th>
                <Th>Vaqt</Th>
                <Th>Kassir</Th>
                <Th>Mahsulotlar</Th>
                <Th>Jami</Th>
                <Th>To'lov</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <Td>{r.date}</Td>
                  <Td>{r.time}</Td>
                  <Td>{r.cashier_name}</Td>
                  <Td>
                    <div className="space-y-0.5">
                      {(r.items || []).map((item: any, j: number) => (
                        <div key={j} className="text-xs text-gray-600">
                          {item.name} x{item.quantity}
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
              {!rows.length && <EmptyRow cols={6} />}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── 11. SABOY BUYURTMALARI ───────────────────────────────────
function TakeawayReport({ data }: any) {
  const rows: any[] = data?.rows || [];
  const daily: any[] = data?.daily || [];
  const s = data?.summary || {};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3 bg-cyan-50 border border-cyan-200 rounded-xl p-4">
        <SummaryCard
          label="Jami buyurtmalar"
          value={fmt(s.total_orders) + " ta"}
          color="text-cyan-700"
        />
        <SummaryCard
          label="Jami mahsulotlar"
          value={fmt(s.total_items) + " ta"}
          color="text-cyan-700"
        />
        <SummaryCard
          label="Jami daromad"
          value={formatPrice(s.total_revenue)}
          color="text-cyan-700"
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Kunlik statistika
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cyan-50">
                <Th>Sana</Th>
                <Th>Buyurtmalar</Th>
                <Th>Mahsulotlar</Th>
                <Th>Daromad</Th>
              </tr>
            </thead>
            <tbody>
              {daily.map((r: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <Td className="font-semibold">{r.date}</Td>
                  <Td className="font-bold text-cyan-700">
                    {fmt(r.order_count)} ta
                  </Td>
                  <Td>{fmt(r.item_count)} ta</Td>
                  <Td className="font-bold text-green-700">
                    {formatPrice(r.revenue)}
                  </Td>
                </tr>
              ))}
              {!daily.length && <EmptyRow cols={4} />}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Barcha buyurtmalar
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <Th>Sana</Th>
                <Th>Vaqt</Th>
                <Th>Kassir</Th>
                <Th>Mahsulotlar</Th>
                <Th>Jami</Th>
                <Th>To'lov</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <Td>{r.date}</Td>
                  <Td>{r.time}</Td>
                  <Td>{r.cashier_name}</Td>
                  <Td>
                    <div className="space-y-0.5">
                      {(r.items || []).map((item: any, j: number) => (
                        <div key={j} className="text-xs text-gray-600">
                          {item.name} x{item.quantity}
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
              {!rows.length && <EmptyRow cols={6} />}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── 12. 30 KUN SOLISHTIRISH (haftalik/oylik/yillik) ─────────
function Last30ExtendedReport({ data }: any) {
  if (!data) return <EmptyRow cols={1} />;
  const cur = data.current_30 || {};
  const prev = data.previous_30 || {};
  const og = data.order_growth_pct;
  const rg = data.revenue_growth_pct;
  const weekly: any[] = data.weekly || [];
  const monthly: any[] = data.monthly || [];
  const yearly: any[] = data.yearly || [];

  const growthBadge = (val: number | null) => {
    if (val === null) return <span className="text-gray-400 text-xs">—</span>;
    const positive = val >= 0;
    return (
      <span
        className={clsx(
          "text-xs font-bold px-2 py-0.5 rounded-full",
          positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
        )}
      >
        {positive ? "▲" : "▼"} {Math.abs(val)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Joriy vs O'tgan 30 kun */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: "Joriy 30 kun",
            data: cur,
            color: "bg-emerald-50 border-emerald-200",
          },
          {
            label: "O'tgan 30 kun",
            data: prev,
            color: "bg-gray-50 border-gray-200",
          },
        ].map(({ label, data: d, color }) => (
          <div key={label} className={clsx("border rounded-xl p-4", color)}>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {label}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              {fmtDate(d.from)} — {fmtDate(d.to)}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Buyurtmalar:</span>
                <span className="font-bold">{fmt(d.orders)} ta</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Daromad:</span>
                <span className="font-bold text-green-700">
                  {formatPrice(d.revenue)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* O'sish foizlari */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
          O'tgan oyga nisbatan o'zgarish
        </p>
        <div className="flex gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Buyurtmalar:</span>
            {growthBadge(og)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Daromad:</span>
            {growthBadge(rg)}
          </div>
        </div>
      </div>

      {/* Haftalik solishtirish */}
      <Section
        title="📅 Haftalik solishtirish"
        color="bg-blue-50 border-blue-200"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-50">
              <Th>Hafta boshi</Th>
              <Th>Buyurtmalar</Th>
              <Th>Daromad</Th>
            </tr>
          </thead>
          <tbody>
            {weekly.map((r: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                <Td>{fmtDate(r.week_start)}</Td>
                <Td className="font-bold text-blue-700">{fmt(r.orders)} ta</Td>
                <Td className="font-bold text-green-700">
                  {formatPrice(r.revenue)}
                </Td>
              </tr>
            ))}
            {!weekly.length && <EmptyRow cols={3} />}
          </tbody>
        </table>
      </Section>

      {/* Oylik solishtirish */}
      <Section
        title="📆 Oylik solishtirish (12 oy)"
        color="bg-violet-50 border-violet-200"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-violet-50">
              <Th>Oy</Th>
              <Th>Buyurtmalar</Th>
              <Th>Daromad</Th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((r: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                <Td className="font-semibold">{r.month}</Td>
                <Td className="font-bold text-violet-700">
                  {fmt(r.orders)} ta
                </Td>
                <Td className="font-bold text-green-700">
                  {formatPrice(r.revenue)}
                </Td>
              </tr>
            ))}
            {!monthly.length && <EmptyRow cols={3} />}
          </tbody>
        </table>
      </Section>

      {/* Yillik solishtirish */}
      <Section
        title="📊 Yillik solishtirish"
        color="bg-amber-50 border-amber-200"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-amber-50">
              <Th>Yil</Th>
              <Th>Buyurtmalar</Th>
              <Th>Daromad</Th>
            </tr>
          </thead>
          <tbody>
            {yearly.map((r: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                <Td className="font-bold">{r.year}</Td>
                <Td className="font-bold text-amber-700">{fmt(r.orders)} ta</Td>
                <Td className="font-bold text-green-700">
                  {formatPrice(r.revenue)}
                </Td>
              </tr>
            ))}
            {!yearly.length && <EmptyRow cols={3} />}
          </tbody>
        </table>
      </Section>
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
const SummaryCard = ({
  label,
  value,
  color = "text-green-700",
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <div className="text-center">
    <div className={clsx("text-lg font-bold", color)}>{value}</div>
    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
  </div>
);
const Section = ({
  title,
  children,
  color,
}: {
  title: string;
  children: React.ReactNode;
  color: string;
}) => (
  <div className={clsx("border rounded-xl p-4", color)}>
    <p className="text-sm font-bold text-gray-700 mb-3">{title}</p>
    <div className="overflow-x-auto">{children}</div>
  </div>
);
