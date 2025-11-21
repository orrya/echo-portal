import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'; 
import { CANONICAL_URL } from "./lib/constants"; 

// Get the expected canonical host (e.g., echo.orrya.co.uk) from the constant.
const CANONICAL_HOST = new URL(CANONICAL_URL).host;

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const currentHost = req.headers.get('host');
  const url = req.nextUrl.clone();
  
  // CRITICAL: We need a response object to write refreshed cookies back to the browser
  const res = NextResponse.next(); 

  // 1. HOST ENFORCEMENT
  if (currentHost && currentHost !== CANONICAL_HOST) {
    const redirectUrl = `https://${CANONICAL_HOST}${path}${url.search}`;
    return NextResponse.redirect(redirectUrl);
  }
  
  // 2. SUPABASE SESSION REFRESH (THE CORE FIX)
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession(); 

  return res; 
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};