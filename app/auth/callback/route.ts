import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
    }

  // Env vars
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!clientId || !clientSecret || !siteUrl || !supabaseUrl || !serviceKey) {
    console.error("Missing env vars");
    return new Response("Server configuration error", { status: 500 });
  }

  const redirectUri = `${siteUrl}/auth/callback`;

  // 1️⃣ Exchange CODE → TOKENS
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

  // 2️⃣ Get Microsoft user profile
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const profile = await profileRes.json();

  if (!profile.id || !profile.mail) {
    console.error("Microsoft profile error:", profile);
    return new Response("Microsoft profile error", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 3️⃣ Ensure Supabase Auth user exists
  const authUserEmail = profile.mail.toLowerCase();

  let { data: existingUser } = await supabase
    .from("auth.users")
    .select("*")
    .eq("email", authUserEmail)
    .maybeSingle();

  if (!existingUser) {
    // Create user via service key
    const { data: createdUser, error: createErr } =
      await supabase.auth.admin.createUser({
        email: authUserEmail,
        email_confirm: true,
      });

    if (createErr) {
      console.error("User creation failed:", createErr);
      return new Response("User creation failed.", { status: 500 });
    }

    existingUser = createdUser.user;
  }

  // 4️⃣ Store MS tokens in your user_connections table
  await supabase.from("user_connections").upsert({
    user_id: existingUser.id,
    provider: "microsoft",
    access_token,
    refresh_token,
    expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
  });

  // 5️⃣ Create a Supabase session cookie (sign user in)
  const sessionClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: sessionData } = await sessionClient.auth.admin.generateSession({
    user_id: existingUser.id,
  });

  // Send cookie to browser
  const response = NextResponse.redirect(`${siteUrl}`);

  response.cookies.set("sb-access-token", sessionData.session.access_token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  response.cookies.set("sb-refresh-token", sessionData.session.refresh_token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  return response;
}
