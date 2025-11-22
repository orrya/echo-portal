// app/auth/redirect/route.ts
import { NextResponse } from "next/server";
import { CANONICAL_URL } from "@/lib/constants";

export async function GET() {
  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const clientId = process.env.AZURE_CLIENT_ID;

  if (!clientId) {
    console.error("AZURE_CLIENT_ID missing");
    return NextResponse.json({ error: "Azure config missing" }, { status: 500 });
  }

  const redirectUri = `${CANONICAL_URL}/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    response_mode: "query",
    redirect_uri: redirectUri,
    scope: "openid email offline_access profile User.Read",
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`
  );
}
