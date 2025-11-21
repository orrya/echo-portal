import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Check for session cookie
  const sessionToken = req.cookies.get("echo-session")?.value;

  if (!sessionToken) {
    console.log("🔁 No session cookie → redirect to sign-in");
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/sign-in";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  console.log("✔ Session cookie present");
  return NextResponse.next();
}

// 🔥 Correct matcher — does NOT apply middleware to /auth/*
export const config = {
  matcher: [
    "/((?!auth|api|_next|favicon.ico).*)", // protect everything except /auth/*
  ],
};
