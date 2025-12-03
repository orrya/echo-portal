// app/auth/login-nylas/route.ts

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
    console.error("Missing NYLAS_CLIENT_ID");
    return NextResponse.redirect(
      `${siteUrl}/auth/sign-in?error=nylas_config`
    );
  }

  // PKCE verifier
  const codeVerifier = generateCodeVerifier();
  const cookieStore = require("next/headers").cookies;
  cookieStore().set("nylas_code_verifier", codeVerifier, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  const authUrl = new URL("https://api.eu.nylas.com/v3/connect/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", `${siteUrl}/auth/callback`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("state", "nylas");

  return NextResponse.redirect(authUrl.toString());
}
