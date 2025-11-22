// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { CANONICAL_URL } from "@/lib/constants";

const CANONICAL_HOST = new URL(CANONICAL_URL).host;

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const host = req.headers.get("host");

  // 1) Let the callback route run without session lookups
  if (path.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // 2) Enforce canonical domain (production only)
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

  // 3) Normal Supabase session refresh
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
