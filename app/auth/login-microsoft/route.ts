// app/auth/login-microsoft/route.ts
import { NextResponse } from "next/server";
import { CANONICAL_URL } from "@/lib/constants";

export async function GET() {
  const clientId = process.env.AZURE_CLIENT_ID;
  const tenantId = process.env.AZURE_TENANT_ID || "common";

  if (!clientId) {
    console.error("Missing AZURE_CLIENT_ID");
    return NextResponse.redirect(
      `${CANONICAL_URL}/auth/sign-in?error=azure_config`
    );
  }

  const redirectUri = `${CANONICAL_URL}/auth/callback`;

  // Request broad-enough scopes for Orrya + n8n
  const scope = [
    "offline_access",
    "openid",
    "profile",
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
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", "ms"); // marker to say "this is our MS flow"

  return NextResponse.redirect(authUrl.toString());
}
