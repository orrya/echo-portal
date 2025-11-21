// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow public routes (auth + static)
  const isPublic =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public");

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = req.cookies.get("echo-session")?.value;

  if (!sessionToken) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/sign-in";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();}
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/email/:path*",
    "/summary/:path*",
    "/settings/:path*",
    "/activity/:path*",
  ],
};
