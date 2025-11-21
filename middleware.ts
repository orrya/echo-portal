// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get("echo-session")?.value;

  // Routes that NEVER require auth
  const PUBLIC_PATHS = new Set<string>([
    "/",
    "/auth/sign-in",
    "/auth/redirect",
    "/auth/callback",
  ]);

  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public");

  if (isPublic) {
    console.log("MIDDLEWARE: public path", {
      pathname,
      hasSession: !!sessionToken,
    });
    return NextResponse.next();
  }

  if (!sessionToken) {
    console.log("MIDDLEWARE: no session, redirecting to /auth/sign-in", {
      pathname,
    });

    const url = req.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  console.log("MIDDLEWARE: authenticated", { pathname });
  return NextResponse.next();
}

// Only protect actual app pages (homepage is left public)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/email/:path*",
    "/summary/:path*",
    "/settings/:path*",
    "/activity/:path*",
  ],
};
