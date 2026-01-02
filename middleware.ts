// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CANONICAL_URL } from "@/lib/constants";

const CANONICAL_HOST = new URL(CANONICAL_URL).host;

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  // ✅ Allow all auth routes (magic link, callbacks, etc.)
  if (path.startsWith("/auth")) {
    return NextResponse.next();
  }

  // Canonical domain enforcement
  if (
    process.env.NODE_ENV === "production" &&
    host &&
    host !== CANONICAL_HOST &&
    !path.startsWith("/_next") &&
    !path.startsWith("/api")
  ) {
    const url = req.nextUrl.clone();
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
