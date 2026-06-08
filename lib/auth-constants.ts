/**
 * lib/auth-constants.ts
 *
 * Auth bilan bog'liq konstantalar — bitta joyda.
 * Middleware (Edge Runtime) ham import qila oladi.
 */

export const ROLE_HOME: Record<string, string> = {
  super_admin: "/admin",
  manager: "/dashboard",
  waiter: "/tables",
  cashier: "/cashier",
  storekeeper: "/inventory",
};

export const getHome = (role: string): string => ROLE_HOME[role] ?? "/kitchen";

export const ROLE_ROUTES: Record<string, string[]> = {
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

/** Foydalanuvchi bu sahifaga kira oladimi? */
export const canAccess = (role: string, pathname: string): boolean => {
  const allowed = ROLE_ROUTES[role] ?? ["/kitchen", "/menumanage", "/earnings"];
  return allowed.some((route) => pathname.startsWith(route));
};

export const PUBLIC_PATHS = [
  "/login",
  "/qr",
  "/menu",
  "/manifest.json",
  "/sw.js",
  "/icons",
  "/silent-refresh",
];
