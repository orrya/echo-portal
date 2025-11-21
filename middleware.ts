// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // If we got here, this path is protected (see matcher below)
  const sessionToken = req.cookies.get("echo-session")?.value;

  if (!sessionToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Protect everything EXCEPT auth, api, _next, static, favicon
export const config = {
  matcher: [
    "/((?!auth|api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
