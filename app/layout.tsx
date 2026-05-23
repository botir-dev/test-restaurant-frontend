import type { Metadata, Viewport } from "next"; // ← Viewport turini qo'shdik
import "./globals.css";
import { Toaster } from "react-hot-toast";
import QueryProvider from "@/components/providers/QueryProvider";
import OfflineIndicator from "@/components/OfflineIndicator";

// 1. Faqat matnli va standart metadatalar qoladi
export const metadata: Metadata = {
  title: "Restoran Boshqaruv Tizimi",
  description: "Restoran boshqaruv tizimi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Restoran",
  },
};

// 2. Next.js 16 talabi bo'yicha viewport va themeColor alohida eksport qilinadi
export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        {/* 
          Eslatma: Next.js metadatalarni o'zi avtomatik generatsiya qiladi.
          Shuning uchun <head> ichidagi manifest va apple teglari bu yerda shart emas, 
          chunki ular yuqorida `metadata` ob'ektida allaqachon bor.
        */}
      </head>
      <body>
        <QueryProvider>
          {children}
          <OfflineIndicator />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "12px",
                fontFamily: "Nunito Sans",
                fontSize: "14px",
              },
              success: {
                style: {
                  background: "#f0fdf4",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                },
              },
              error: {
                style: {
                  background: "#fef2f2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                },
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}