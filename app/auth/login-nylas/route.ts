import { NextResponse } from "next/server";
import { CANONICAL_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

function generateCodeVerifier(length = 64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  const siteUrl = CANONICAL_URL;
  const clientId = process.env.NYLAS_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(
      `${siteUrl}/auth/sign-in?error=missing_nylas_config`
    );
  }

  // PKCE
  const codeVerifier = generateCodeVerifier();
  const cookieStore = require("next/headers").cookies;
  cookieStore().set("nylas_code_verifier", codeVerifier, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  // Correct Hosted Auth
  const nylasAuthUrl = new URL(
    "https://api.eu.nylas.com/v3/connect/auth"
  );
  nylasAuthUrl.searchParams.set("client_id", clientId);
  nylasAuthUrl.searchParams.set("redirect_uri", `${siteUrl}/auth/callback`);
  nylasAuthUrl.searchParams.set("response_type", "code");
  nylasAuthUrl.searchParams.set("access_type", "offline");
  nylasAuthUrl.searchParams.set("state", "nylas");

  return NextResponse.redirect(nylasAuthUrl.toString());
}
