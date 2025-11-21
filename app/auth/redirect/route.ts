// app/auth/redirect/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin; // e.g. https://echo-portal.vercel.app or preview

  const clientId =
    process.env.AZURE_CLIENT_ID ?? process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
  const tenantId = process.env.AZURE_TENANT_ID || "common";

  // Always point back to *this* deployment
  const redirectUri =
    process.env.AZURE_REDIRECT_URI ?? `${origin}/auth/callback`;

  if (!clientId || !redirectUri) {
    console.error("❌ Missing Azure env vars", {
      clientId,
      tenantId,
      redirectUri,
    });
    return new Response("Server configuration error", { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: "openid email offline_access profile User.Read",
  });

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
