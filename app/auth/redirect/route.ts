// app/auth/redirect/route.ts

import { NextResponse } from "next/server";
import { CANONICAL_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = CANONICAL_URL;

  // SINGLE TENANT
  const tenantId = "7bb868c2-184b-4410-a2b5-e3dc218422db";
  const clientId = process.env.AZURE_CLIENT_ID;

  if (!clientId) {
    console.error("Missing AZURE_CLIENT_ID");
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=azure_config`);
  }

  const redirectUri = `${siteUrl}/auth/callback`;

  const scopes = [
    "openid",
    "email",
    "profile",
    "offline_access",
    "User.Read",
    "Mail.Read",
    "Mail.ReadWrite",
    "Mail.Send",
    "Calendars.Read",
    "Calendars.ReadWrite",
  ].join(" ");

  const authUrl = new URL(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
  );

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_mode", "query");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", "ms");

  return NextResponse.redirect(authUrl.toString());
}
