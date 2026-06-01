import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ROLE_ROUTES: Record<string, string[]> = {
  super_admin: ["/admin", "/restaurants", "/branches"],
  manager: [
    "/dashboard",
    "/tables",
    "/orders",
    "/archive",
    "/staff",
    "/settings",
    "/qr",
    "/earnings",
    "/cashier",
    "/reports",
    "/inventory",
    "/menumanage",
  ],
  waiter: ["/tables", "/orders", "/earnings"],
  cashier: ["/cashier", "/orders", "/archive", "/earnings"],
  storekeeper: ["/inventory", "/menumanage", "/archive", "/earnings"],
  cook: ["/kitchen", "/menumanage", "/earnings"],
  baker: ["/kitchen", "/menumanage", "/earnings"],
  somsa_maker: ["/kitchen", "/menumanage", "/earnings"],
  grill_master: ["/kitchen", "/menumanage", "/earnings"],
  turkish_cook: ["/kitchen", "/menumanage", "/earnings"],
  bartender: ["/kitchen", "/menumanage", "/earnings"],
  icecream_maker: ["/kitchen", "/menumanage", "/earnings"],
  tea_master: ["/kitchen", "/menumanage", "/earnings"],
};

const ROLE_HOME: Record<string, string> = {
  super_admin: "/admin",
  manager: "/dashboard",
  waiter: "/tables",
  cashier: "/cashier",
  storekeeper: "/inventory",
};

const PUBLIC_PATHS = [
  "/login",
  "/qr",
  "/menu",
  "/manifest.json",
  "/sw.js",
  "/icons",
];

const verifyToken = async (token: string): Promise<{ role: string } | null> => {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return { role: payload.role as string };
  } catch {
    return null;
  }
};

// Middleware da refresh qila olmaymiz (edge runtime — HttpOnly cookie o'qib bo'lmaydi to'liq)
// Shuning uchun: access_token yo'q bo'lsa, refresh_token borligini tekshirib,
// /api/silent-refresh ga yo'naltiramiz — u yerda yangi access_token cookie o'rnatiladi
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // "/" root path
  if (pathname === "/") {
    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (accessToken) {
      const payload = await verifyToken(accessToken);
      if (payload) {
        const home = ROLE_HOME[payload.role] ?? "/kitchen";
        return NextResponse.redirect(new URL(home, request.url));
      }
    }
    // access_token yo'q lekin refresh_token bor — silent-refresh sahifasiga
    if (refreshToken) {
      const silentUrl = new URL("/silent-refresh", request.url);
      silentUrl.searchParams.set("from", "/");
      return NextResponse.redirect(silentUrl);
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Silent-refresh sahifasi — loop oldini olish
  if (pathname === "/silent-refresh") {
    return NextResponse.next();
  }

  // Access token yo'q
  if (!accessToken) {
    // Refresh token bor — silent refresh orqali tiklaymiz
    if (refreshToken) {
      const silentUrl = new URL("/silent-refresh", request.url);
      silentUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(silentUrl);
    }
    // Ikkalasi ham yo'q — login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Access token bor — verify
  const payload = await verifyToken(accessToken);
  if (!payload) {
    // Token yaroqsiz
    if (refreshToken) {
      const silentUrl = new URL("/silent-refresh", request.url);
      silentUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(silentUrl);
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoutes = ROLE_ROUTES[payload.role] ?? [
    "/kitchen",
    "/menumanage",
    "/earnings",
  ];
  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!hasAccess) {
    const home = ROLE_HOME[payload.role] ?? "/kitchen";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|public).*)",
  ],
};
