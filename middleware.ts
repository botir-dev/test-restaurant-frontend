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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // access_token yo'q — lekin refresh_token bor bo'lsa
  // AuthProvider client-side da refresh qiladi, shuning uchun
  // biz bu yerda LOGIN ga redirect QILMAYMIZ —
  // sahifani o'tkazib yuboramiz, AuthProvider handle qilsin
  if (!accessToken) {
    if (refreshToken) {
      // Refresh token bor — sahifani ko'rsatamiz, AuthProvider refresh qiladi
      return NextResponse.next();
    }
    // Hech narsa yo'q — login
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Access token bor — verify
  const payload = await verifyToken(accessToken);

  if (pathname === "/") {
    if (!payload) {
      if (refreshToken) return NextResponse.next();
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const home = ROLE_HOME[payload.role] ?? "/kitchen";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (!payload) {
    // Token yaroqsiz — refresh_token bor bo'lsa AuthProvider hal qilsin
    if (refreshToken) return NextResponse.next();
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
