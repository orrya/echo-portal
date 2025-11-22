// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { CANONICAL_URL } from "@/lib/constants";

const CANONICAL_HOST = new URL(CANONICAL_URL).host;

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const host = req.headers.get("host");
  const path = req.nextUrl.pathname;

  // Enforce canonical domain (production only)
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

  // Refresh Supabase session cookies
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
