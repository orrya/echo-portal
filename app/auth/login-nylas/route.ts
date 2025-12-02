// app/auth/login-nylas/route.ts
import { NextResponse } from "next/server";
import { CANONICAL_URL } from "@/lib/constants";

export async function GET() {
  const clientId = process.env.NYLAS_CLIENT_ID;
  const redirectUri =
    process.env.NYLAS_REDIRECT_URI || `${CANONICAL_URL}/auth/callback`;

  if (!clientId) {
    console.error("NYLAS_CLIENT_ID missing");
    return NextResponse.redirect(
      `${CANONICAL_URL}/auth/sign-in?error=nylas_config`
    );
  }

  const authUrl = new URL("https://api.nylas.com/v3/connect/auth");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("access_type", "offline"); // Needed for refresh token
  authUrl.searchParams.set("state", "nylas");

  // OPTIONAL:
  // Force Microsoft only: authUrl.searchParams.set("provider", "microsoft_graph");
  // Force Google only: authUrl.searchParams.set("provider", "google");

  return NextResponse.redirect(authUrl.toString());
}
