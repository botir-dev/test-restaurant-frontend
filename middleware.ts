import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  cashier: ["/cashier", "/orders", "/archive"],
  storekeeper: ["/inventory", "/menumanage", "/archive"],
  cook: ["/kitchen", "/menumanage"],
  baker: ["/kitchen", "/menumanage"],
  somsa_maker: ["/kitchen", "/menumanage"],
  grill_master: ["/kitchen", "/menumanage"],
  turkish_cook: ["/kitchen", "/menumanage"],
  bartender: ["/kitchen", "/menumanage"],
  icecream_maker: ["/kitchen", "/menumanage"],
  tea_master: ["/kitchen", "/menumanage"],
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const isAuth = request.cookies.get("is_authenticated")?.value === "true";
    const role = request.cookies.get("user_role")?.value;
    if (isAuth && role) {
      const home = ROLE_HOME[role] ?? "/kitchen";
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isAuth = request.cookies.get("is_authenticated")?.value === "true";
  const role = request.cookies.get("user_role")?.value;

  if (!isAuth || !role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoutes = ROLE_ROUTES[role] ?? ["/kitchen", "/menumanage"];
  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!hasAccess) {
    const home = ROLE_HOME[role] ?? "/kitchen";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|public).*)",
  ],
};
