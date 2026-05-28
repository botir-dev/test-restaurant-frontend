import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  super_admin: ["/admin", "/restaurants", "/branches"],
  manager: [
    "/dashboard", "/products", "/tables", "/orders",
    "/archive", "/staff", "/settings", "/qr", "/earnings", "/cashier",
  ],
  waiter:       ["/tables", "/orders", "/earnings"],
  cashier:      ["/cashier", "/orders", "/archive"],
  storekeeper:  ["/products", "/archive"],
  cook:         ["/kitchen", "/products"],
  baker:        ["/kitchen", "/products"],
  somsa_maker:  ["/kitchen", "/products"],
  grill_master: ["/kitchen", "/products"],
  turkish_cook: ["/kitchen", "/products"],
  bartender:    ["/kitchen", "/products"],
  icecream_maker:["/kitchen", "/products"],
  tea_master:   ["/kitchen", "/products"],
};

const ROLE_HOME: Record<string, string> = {
  super_admin: "/admin",
  manager:     "/dashboard",
  waiter:      "/tables",
  cashier:     "/cashier",
  storekeeper: "/products",
};

const PUBLIC_PATHS = ["/login", "/qr", "/menu", "/manifest.json", "/sw.js", "/icons"];

// ← "middleware" o'rniga "proxy" — Next.js yangi talabi
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isAuth = request.cookies.get("is_authenticated")?.value === "true";
  const role   = request.cookies.get("user_role")?.value;

  if (!isAuth || !role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoutes = ROLE_ROUTES[role] ?? ["/kitchen", "/products"];
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