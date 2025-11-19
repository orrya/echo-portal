import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// -----------------------------
//  AUTH CALLBACK ROUTE
// -----------------------------
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  // -----------------------------
  //  ENV Vars (validated safely)
  // -----------------------------
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!clientId || !clientSecret || !siteUrl || !supabaseUrl || !serviceKey) {
    console.error("❌ Missing env vars", {
      clientId,
      clientSecret,
      siteUrl,
      supabaseUrl,
      serviceKey,
    });

    return new Response("Server configuration error", { status: 500 });
  }

  const redirectUri = `${siteUrl}/auth/callback`;

  // -----------------------------
  // 1️⃣ Exchange code → Tokens
  // -----------------------------
  const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenJson = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("❌ Token exchange failed:", tokenJson);
    return new Response("Token exchange failed", { status: 400 });
  }

  const access_token = tokenJson.access_token;
  const refresh_token = tokenJson.refresh_token;
  const expires_in = tokenJson.expires_in;

  // -----------------------------
  // 2️⃣ Fetch profile from Graph
  // -----------------------------
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const profile = await profileRes.json();

  if (!profile.id) {
    console.error("❌ Failed to fetch Microsoft user profile:", profile);
    return new Response("Microsoft profile error", { status: 400 });
  }

  // -----------------------------
  // 3️⃣ Store in Supabase (Service role)
  // -----------------------------
  const supabase = createClient(supabaseUrl, serviceKey);

  const { error } = await supabase.from("user_connections").upsert({
    user_id: profile.id,
    provider: "microsoft",
    access_token,
    refresh_token,
    expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
  });

  if (error) {
    console.error("❌ DB Insert error:", error);
    return new Response("Database error", { status: 500 });
  }

  // -----------------------------
  // 4️⃣ Redirect to portal
  // -----------------------------
  return NextResponse.redirect(siteUrl);
}
