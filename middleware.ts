import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { PUBLIC_PATHS, getHome, canAccess } from "@/lib/auth-constants";

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

  // Public yo'llar — hech nima tekshirilmaydi
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Token yo'q
  if (!accessToken) {
    // Refresh bor — AuthProvider client-side handle qiladi
    if (refreshToken) return NextResponse.next();

    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(accessToken);

  // Root "/" — rolga qarab yo'naltirish
  if (pathname === "/") {
    if (!payload) {
      if (refreshToken) return NextResponse.next();
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL(getHome(payload.role), request.url));
  }

  // Token yaroqsiz
  if (!payload) {
    if (refreshToken) return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rol tekshiruvi
  if (!canAccess(payload.role, pathname)) {
    return NextResponse.redirect(new URL(getHome(payload.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|public).*)",
  ],
};
