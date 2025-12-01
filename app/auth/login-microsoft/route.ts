import { NextResponse } from "next/server";
import { CANONICAL_URL } from "@/lib/constants";

export async function GET() {
  const siteUrl = CANONICAL_URL;

  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const clientId = process.env.AZURE_CLIENT_ID!;
  const redirectUri = `${siteUrl}/auth/callback`;

  const authUrl = new URL(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
  );

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "User.Read offline_access openid email profile");

  return NextResponse.redirect(authUrl.toString());
}
