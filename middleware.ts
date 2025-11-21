import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Make sure this path is correct for your project structure
import { CANONICAL_URL } from "./lib/constants"; 

// Get the expected canonical host (e.g., echo.orrya.co.uk) from the constant.
const CANONICAL_HOST = new URL(CANONICAL_URL).host;

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const currentHost = req.headers.get('host');
  const url = req.nextUrl.clone();

  console.log("🟦 MIDDLEWARE START");
  console.log("➡️ Path:", path);
  console.log("➡️ Current Host:", currentHost);
  console.log("➡️ Canonical Host:", CANONICAL_HOST);

  // 1. HOST ENFORCEMENT (This logic correctly fixed the Vercel host bounce)
  if (currentHost && currentHost !== CANONICAL_HOST) {
    console.log(`⚠️ Host Mismatch: Forcing redirect from ${currentHost} -> ${CANONICAL_HOST}`);
    const redirectUrl = `https://${CANONICAL_HOST}${path}${url.search}`;
    return NextResponse.redirect(redirectUrl);
  }
  
  // If we reach here, we know the request is for a protected route 
  // because all public/auth paths are excluded by the 'config.matcher' below.

  // 2. Auth check for protected routes
  const session = req.cookies.get("echo-session");
  console.log("🍪 Session Cookie:", session?.value ? "✅ Found" : "❌ No cookie");

  // If NO session cookie → redirect to sign-in
  if (!session) {
    console.log("🔁 No session cookie found. Redirecting to /auth/sign-in");
    url.pathname = "/auth/sign-in";
    
    // Set a redirect query param so the user lands back on the original protected page
    url.searchParams.set("redirect", path); 
    
    return NextResponse.redirect(url);
  }

  // 3. Session exists → allow access
  console.log("🟢 Session exists → allow access to:", path);
  return NextResponse.next();
}

export const config = {
  // CRITICAL FIX: Match all paths EXCEPT the ones explicitly listed below.
  // This prevents the middleware from running on the sign-in page itself.
  matcher: [
    '/((?!auth/sign-in|auth/callback|auth/redirect|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};