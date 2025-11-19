import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Allow public routes (sign-in + OAuth callback + assets)
  const publicPaths = [
    "/auth/sign-in",
    "/auth/callback",
    "/auth/redirect",
    "/favicon.ico",
    "/_next",
    "/public",
  ];

  if (publicPaths.some((path) => url.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check Supabase auth cookies
  const accessToken = req.cookies.get("sb-access-token");

  // If no session → redirect
  if (!accessToken) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/sign-in";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Match everything EXCEPT static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
