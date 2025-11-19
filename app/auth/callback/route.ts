import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  // Env vars
  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const redirectUri = `${siteUrl}/auth/callback`;

  // 1️⃣ Exchange authorization code for tokens
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
    console.error("Token exchange failed:", tokenJson);
    return new Response("Token exchange failed", { status: 400 });
  }

  const access_token = tokenJson.access_token;
  const refresh_token = tokenJson.refresh_token;
  const expires_in = tokenJson.expires_in;

  // 2️⃣ Fetch Microsoft profile
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const profile = await profileRes.json();

  if (!profile.id || !profile.mail) {
    console.error("Microsoft profile error:", profile);
    return new Response("Microsoft profile error", { status: 400 });
  }

  const authEmail = profile.mail.toLowerCase();

  // 3️⃣ Get or create Supabase user
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: existingUser } = await admin
    .from("auth.users")
    .select("*")
    .eq("email", authEmail)
    .maybeSingle();

  let userId = existingUser?.id;

  if (!userId) {
    const { data: createdUser, error: createErr } = await admin.auth.admin.createUser(
      {
        email: authEmail,
        email_confirm: true,
      }
    );

    if (createErr) {
      console.error("User creation failed:", createErr);
      return new Response("User creation failed", { status: 500 });
    }

    userId = createdUser.user.id;
  }

  // 4️⃣ Store MS tokens
  const { error: connErr } = await admin.from("user_connections").upsert({
    user_id: userId,
    provider: "microsoft",
    access_token,
    refresh_token,
    expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
  });

  if (connErr) {
    console.error("DB insert failed:", connErr);
    return new Response("Database error", { status: 500 });
  }

  // 5️⃣ Create a Supabase session cookie (no generateSession)
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: session, error: sessErr } = await supabase.auth.signInWithIdToken({
    provider: "azure",
    token: access_token,
  });

  if (sessErr) {
    console.error("Session creation failed:", sessErr);
    return new Response("Session creation failed", { status: 500 });
  }

  // Attach session cookie to response
  const response = NextResponse.redirect(`${siteUrl}/dashboard`);
  supabase.auth.setSession(session.session);
  return response;
}
