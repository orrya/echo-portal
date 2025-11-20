import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // --- Allow public + special routes ---
  if (
    pathname.startsWith("/auth") || 
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // --- Custom session cookie check ---
  const sessionToken = req.cookies.get("echo-session")?.value;

  if (!sessionToken) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/sign-in";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// --- Clean matcher: protect only actual app pages ---
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/email/:path*",
    "/summary/:path*",
    "/settings/:path*",
    "/activity/:path*",
    "/((?!_next|favicon.ico|auth|api).*)",
  ],
};
