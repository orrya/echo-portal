// app/auth/login-nylas/route.ts
import { NextResponse } from "next/server";
import { CANONICAL_URL } from "@/lib/constants";

export async function GET() {
  const redirectUri =
    process.env.NYLAS_REDIRECT_URI || `${CANONICAL_URL}/auth/callback`;

  const authUrl = new URL("https://api.nylas.com/v3/connect/authorize");
  authUrl.searchParams.set("client_id", process.env.NYLAS_CLIENT_ID!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("provider", "microsoft_graph");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("state", "nylas"); // 👈 used in callback

  return NextResponse.redirect(authUrl.toString());
}
