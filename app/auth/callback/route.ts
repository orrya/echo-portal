import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  // ---- CREATE SUPABASE SERVER CLIENT ----
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // MUST be service role
  );

  // ---- Exchange code for tokens ----
  const tokenRes = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID!,
        client_secret: process.env.AZURE_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      }),
    }
  );

  const tokens = await tokenRes.json();

  const access_token = tokens.access_token;
  const refresh_token = tokens.refresh_token;
  const expires_in = tokens.expires_in;

  // ---- Get Microsoft profile ----
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const profile = await profileRes.json();

  // ---- Save connection in Supabase ----
  const { error } = await supabase
    .from("user_connections")
    .upsert({
      user_id: profile.id,           // IMPORTANT: this is the MS user id
      provider: "microsoft",
      access_token,
      refresh_token,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
    });

  if (error) {
    console.error("Supabase insert error:", error);
  }

  // ---- Redirect user into app ----
  return NextResponse.redirect(process.env.NEXT_PUBLIC_SITE_URL!);
}
