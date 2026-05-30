import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated =
    request.cookies.get("is_authenticated")?.value === "true";

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/login", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
