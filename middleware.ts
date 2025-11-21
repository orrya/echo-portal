import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // 🔥 1. HARD EXCLUDE AUTH PAGES
  if (path.startsWith("/auth")) {
    console.log("🟢 AUTH ROUTE — middleware skipped:", path);
    return NextResponse.next();
  }

  // 🔥 2. EXCLUDE STATIC & PUBLIC FILES
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.startsWith("/assets") ||
    path.startsWith("/api")
  ) {
    console.log("🟢 STATIC/API ROUTE — middleware skipped:", path);
    return NextResponse.next();
  }

  // 🔥 3. CHECK COOKIE
  const session = req.cookies.get("echo-session");
  if (!session) {
    console.log("🔁 No session cookie — redirecting to /auth/sign-in", path);
    url.pathname = "/auth/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  console.log("✔ Cookie found — allowed:", path);
  return NextResponse.next();
}

// 🔥 MATCH EVERYTHING — middleware will manually skip auth
export const config = {
  matcher: ["/:path*"],
};
