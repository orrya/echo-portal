// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  // Create a response we can attach refreshed cookies to
  const res = NextResponse.next();

  // Refresh Supabase session cookies on each request (if needed)
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
