import { NextResponse } from "next/server";

export function GET() {
  const tenant = process.env.AZURE_TENANT_ID || "common";
  const clientId = process.env.AZURE_CLIENT_ID!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const redirectUri = `${siteUrl}/auth/callback`;

  const url = new URL(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
  );

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set(
    "scope",
    "openid email offline_access profile User.Read Mail.ReadWrite Mail.Send"
  );

  return NextResponse.redirect(url.toString());
}
