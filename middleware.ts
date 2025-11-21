import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of URL prefixes that do NOT require authentication.
const PUBLIC_PATH_PREFIXES = [  "/auth/sign-in",
  "/auth/callback",
  "/auth/redirect",
  "/api/auth/callback",
  "/favicon.ico",
];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const url = req.nextUrl.clone();

  // Debug log (Crucial for identifying the host causing the bounce)
  console.log("🟦 MIDDLEWARE START");
  console.log("➡️ Path:", path);
  console.log("➡️ Host:", req.headers.get('host')); // Log the host being accessed

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
    console.log("🔁 No session cookie → redirecting to /auth/sign-in");
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