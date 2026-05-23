import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rollarga qarab ruxsat etilgan marshrutlar
const ROLE_ROUTES: Record<string, string[]> = {
  super_admin: ["/admin", "/restaurants", "/branches"],
  manager: [
    "/dashboard",
    "/products",
    "/tables",
    "/orders",
    "/archive",
    "/staff",
    "/settings",
  ],
  waiter: ["/tables", "/orders"],
  cashier: ["/cashier", "/archive"],
  storekeeper: ["/products", "/archive"],
  cook: ["/kitchen"],
  baker: ["/kitchen"],
  somsa_maker: ["/kitchen"],
  grill_master: ["/kitchen"],
  turkish_cook: ["/kitchen"],
  bartender: ["/kitchen"],
  icecream_maker: ["/kitchen"],
  tea_master: ["/kitchen"],
};

// Barcha autentifikatsiya kerak bo'lgan marshrut prefikslari
const PROTECTED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/products",
  "/tables",
  "/orders",
  "/archive",
  "/staff",
  "/settings",
  "/cashier",
  "/kitchen",
  "/restaurants",
  "/branches",
];

// Ochiq marshrut — token kerak emas
const PUBLIC_PATHS = ["/login", "/qr"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ochiq marshrut — o'tkazib yuborish
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Himoyalangan marshrut emasmi?
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Cookie dan auth-storage ni o'qish (zustand persist)
  const authCookie = request.cookies.get("auth-storage")?.value;
  let role: string | null = null;

  if (authCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(authCookie));
      role = parsed?.state?.user?.role ?? null;
    } catch {
      role = null;
    }
  }

  // Token yo'q — login ga yo'naltirish
  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rolga mos marshrutlarni tekshirish
  const allowedRoutes = ROLE_ROUTES[role] ?? [];
  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!hasAccess) {
    // Ruxsatsiz sahifaga kirmoqchi — asosiy sahifasiga yo'naltirish
    const homeRoute = allowedRoutes[0] ?? "/login";
    return NextResponse.redirect(new URL(homeRoute, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api).*)"],
};
