import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Make sure this path is correct for your project structure
import { CANONICAL_URL } from "./lib/constants"; 

// Get the expected canonical host (e.g., echo.orrya.co.uk) from the constant.
const CANONICAL_HOST = new URL(CANONICAL_URL).host;

// List of URL prefixes that do NOT require authentication.
const PUBLIC_PATH_PREFIXES = [
  "/auth/sign-in",
  "/auth/callback",
  "/auth/redirect",
  "/api/auth/callback",
  "/favicon.ico",
];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const currentHost = req.headers.get('host');
  const url = req.nextUrl.clone();

  console.log("🟦 MIDDLEWARE START");
  console.log("➡️ Path:", path);
  console.log("➡️ Current Host:", currentHost);
  console.log("➡️ Canonical Host:", CANONICAL_HOST);

  // --- CRITICAL FIX: HOST ENFORCEMENT ---
  // If the request's host is NOT the canonical host (e.g., it's a Vercel preview URL),
  // we force a redirect to the correct host to break the infinite loop.
  if (currentHost && currentHost !== CANONICAL_HOST) {
    console.log(`⚠️ Host Mismatch: Forcing redirect from ${currentHost} -> ${CANONICAL_HOST}`);
    const redirectUrl = `https://${CANONICAL_HOST}${path}${url.search}`;
    // Using a 307 redirect preserves the method (GET) and is generally safer.
    return NextResponse.redirect(redirectUrl);
  }

  // 1. Check if the path is publicly accessible (via startsWith logic)
  const isPublicPath = PUBLIC_PATH_PREFIXES.some(prefix => path.startsWith(prefix));

  if (isPublicPath) {
    console.log("🟩 Middleware Skipped (Public Prefix Match):", path);
    return NextResponse.next();
  }
  
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
  // Apply to all paths EXCEPT the ones excluded here.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/callback).*)"],
};