import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/auth/sign-in",
  "/auth/callback",
  "/favicon.ico",
  "/api/auth/callback",
];

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Debug log
  console.log("🟦 MIDDLEWARE START");
  console.log("➡️ Path:", path);

  // Skip middleware for public routes
  if (PUBLIC_PATHS.includes(path)) {
    console.log("🟩 Middleware Skipped:", path);
    return NextResponse.next();
  }

  const session = req.cookies.get("echo-session");
  console.log("🍪 Session Cookie:", session?.value ?? "❌ No cookie");

  // If NO session cookie → redirect to sign-in
  if (!session) {
    console.log("🔁 No session cookie → redirecting to /auth/sign-in");
    const signInUrl = new URL("/auth/sign-in", req.url);
    return NextResponse.redirect(signInUrl);
  }

  console.log("🟢 Session exists → allow access");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"], // apply to all except static files
};
