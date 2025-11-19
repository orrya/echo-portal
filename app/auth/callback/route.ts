import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  // -----------------------------
  // ✅ Required Environment Vars
  // -----------------------------
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!clientId || !clientSecret || !siteUrl || !supabaseUrl || !serviceKey) {
    console.error("❌ Missing environment variables");
    return new Response("Server configuration error", { status: 500 });
  }

  const redirectUri = `${siteUrl}/auth/callback`;

  // -----------------------------
  // 1️⃣ Exchange code → Tokens
  // -----------------------------
  const tokenRes = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  const tokenJson = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("❌ Token exchange failed:", tokenJson);
    return new Response("Token exchange failed", { status: 400 });
  }

  const access_token = tokenJson.access_token;
  const refresh_token = tokenJson.refresh_token;
  const expires_in = tokenJson.expires_in;

  // -----------------------------
  // 2️⃣ Fetch Microsoft Profile
  // -----------------------------
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const profile = await profileRes.json();

  if (!profile || !profile.id) {
    console.error("❌ Failed to fetch Microsoft profile:", profile);
    return new Response("Microsoft profile error", { status: 400 });
  }

  // Extract usable email
  const email = profile.mail || profile.userPrincipalName;
  if (!email) {
    console.error("❌ Microsoft returned no email:", profile);
    return new Response("Email missing from Microsoft", { status: 400 });
  }

  // -----------------------------
  // 3️⃣ Ensure Supabase User Exists
  // -----------------------------
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  // Try to find existing supabase user
  let { data: existingUser } = await supabaseAdmin
    .from("auth.users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  // If not found, create user
  if (!existingUser) {
    const newUser = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (newUser.error) {
      console.error("❌ Failed to create Supabase user:", newUser.error);
      return new Response("User creation failed", { status: 500 });
    }

    existingUser = newUser.data.user;
  }

  const supabaseUserId = existingUser.id;

  // -----------------------------
  // 4️⃣ Store tokens in user_connections
  // -----------------------------
  const supabaseDb = createClient(supabaseUrl, serviceKey);

  const { error } = await supabaseDb.from("user_connections").upsert({
    user_id: supabaseUserId,
    provider: "microsoft",
    access_token,
    refresh_token,
    expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
  });

  if (error) {
    console.error("❌ Database insert error:", error);
    return new Response("Database error", { status: 500 });
  }

  // -----------------------------
  // 5️⃣ Redirect to dashboard
  // -----------------------------
  return NextResponse.redirect(siteUrl);
}
