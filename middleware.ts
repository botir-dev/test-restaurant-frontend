import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cookiedan token yoki sessiyani tekshirish (o'zingizning token nomingizga o'zgartiring)
  const isAuthenticated = request.cookies.get("token");

  // 1. Foydalanuvchi bosh sahifaga (/) kirdi
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 2. Foydalanuvchi himoyalangan sahifaga (masalan /dashboard) kirdi, lekin login qilmagan
  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Foydalanuvchi login qilgan bo'lsa-yu, yana /login sahifasiga kirmoqchi bo'lsa
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Middleware qaysi url'lar uchun ishlashini belgilash
export const config = {
  matcher: ["/", "/dashboard/:path*", "/login"],
};
