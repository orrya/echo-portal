// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { CANONICAL_URL } from "@/lib/constants";

const CANONICAL_HOST = new URL(CANONICAL_URL).host;

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;
  const currentHost = req.headers.get("host");

  // 1) Enforce canonical domain only in production
  if (
    process.env.NODE_ENV === "production" &&
    currentHost &&
    currentHost !== CANONICAL_HOST &&
    // prevent rewriting API routes and static files
    !path.startsWith("/api") &&
    !path.startsWith("/_next") &&
    !path.startsWith("/favicon.ico")
  ) {
    const url = req.nextUrl.clone();
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url);
  }

  // 2) Refresh Supabase session cookies
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
