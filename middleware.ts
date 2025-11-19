import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const session = req.cookies.get("sb-access-token");

  // Allow public routes
  if (req.nextUrl.pathname.startsWith("/auth")) return NextResponse.next();

  // If no session → redirect to login
  if (!session) {
    const redirectUrl = new URL("/auth/sign-in", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Protect all routes EXCEPT /auth/*
export const config = {
  matcher: ["/((?!auth).*)"],
};
