// app/auth/redirect/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const clientId =
    process.env.AZURE_CLIENT_ID || process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!clientId) {
    console.error("AZURE_CLIENT_ID is missing");
    return NextResponse.json(
      { error: "Azure configuration missing" },
      { status: 500 }
    );
  }

  // This MUST match the Azure “Redirect URI”
  const redirectUri = `${siteUrl}/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    response_mode: "query",
    redirect_uri: redirectUri,
    scope: "openid email offline_access profile User.Read",
  });

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
