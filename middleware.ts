import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATH_PREFIXES = [
  "/",
  "/auth/sign-in",
  "/auth/callback",
  "/auth/redirect", // <-- Added this path
  "/api/auth/callback",
  "/favicon.ico", // Can be here for clarity, though matcher usually handles it
];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Debug log
  console.log("🟦 MIDDLEWARE START");
  console.log("➡️ Path:", path);

  // Use startsWith to check if the path is a public prefix
  const isPublicPath = PUBLIC_PATH_PREFIXES.some(prefix => path.startsWith(prefix));

  if (isPublicPath) {
    console.log("🟩 Middleware Skipped (Public Prefix Match):", path);
    return NextResponse.next();
  }

  const session = req.cookies.get("echo-session");
  console.log("🍪 Session Cookie:", session?.value ?? "❌ No cookie");

  // If NO session cookie → redirect to sign-in
  if (!session) {
    console.log("🔁 No session cookie → redirecting to /auth/sign-in");
    const signInUrl = new URL("/auth/sign-in", req.url);
    // If you want to redirect back to the current page after successful login:
    // signInUrl.searchParams.set("redirect", req.nextUrl.pathname); 
    return NextResponse.redirect(signInUrl);
  }

  console.log("🟢 Session exists → allow access");
  return NextResponse.next();
}

export const config = {
  // Apply to all except Next.js internal files, static assets, etc.
  matcher: ["/((?!_next|.*\\..*).*)"],
};