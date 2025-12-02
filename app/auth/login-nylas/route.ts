import { NextResponse } from "next/server";
import { CANONICAL_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = CANONICAL_URL;

  const clientId = process.env.NYLAS_CLIENT_ID;
  if (!clientId) {
    console.error("Missing NYLAS_CLIENT_ID");
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=nylas_config`);
  }

  // Nylas Hosted OAuth start
  const nylasAuthUrl = new URL("https://api.nylas.com/v3/connect/auth");

  nylasAuthUrl.searchParams.set("client_id", clientId);
  nylasAuthUrl.searchParams.set("redirect_uri", `${siteUrl}/auth/callback`);
  nylasAuthUrl.searchParams.set("response_type", "code");
  nylasAuthUrl.searchParams.set("state", "nylas");
  nylasAuthUrl.searchParams.set("access_type", "offline");

  return NextResponse.redirect(nylasAuthUrl.toString());
}
