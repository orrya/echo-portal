// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get("echo-session")?.value;

  // If no session cookie, force sign-in
  if (!sessionToken) {
    const loginUrl = new URL("/auth/sign-in", req.url);
    loginUrl.search = ""; // drop any old query
    return NextResponse.redirect(loginUrl);
  }

  // Otherwise let the request through
  return NextResponse.next();
}

// Protect only these routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/email/:path*",
    "/summary/:path*",
    "/settings/:path*",],
};
