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

  // ✅ Correct endpoint
  const authUrl = new URL("https://api.nylas.com/v3/connect/authorize");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("provider", "microsoft_graph");
  authUrl.searchParams.set("access_type", "offline"); // allow refresh_token
  authUrl.searchParams.set("state", "nylas");

  return NextResponse.redirect(authUrl.toString());
}
