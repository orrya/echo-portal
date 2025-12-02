// app/auth/redirect/route.ts
import { NextResponse } from "next/server";
import { CANONICAL_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = CANONICAL_URL;

  const tenant = process.env.AZURE_TENANT_ID || "common";
  // Use server-side AZURE_CLIENT_ID, not NEXT_PUBLIC_
  const clientId = process.env.AZURE_CLIENT_ID;

  if (!clientId) {
    console.error("Missing AZURE_CLIENT_ID");
    return NextResponse.redirect(
      `${siteUrl}/auth/sign-in?error=azure_config`
    );
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
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
  );

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_mode", "query");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", "ms"); // mark this as MS flow

  return NextResponse.redirect(authUrl.toString());
}
