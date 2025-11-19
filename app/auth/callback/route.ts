import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
    }

  // ENV Vars
  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const redirectUri = `${siteUrl}/auth/callback`;

  // 1 — Exchange auth code → tokens
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

  // 2 — Fetch Microsoft profile
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const profile = await profileRes.json();

  if (!profile.mail && !profile.userPrincipalName) {
    console.error("Microsoft profile error:", profile);
    return new Response("Microsoft profile error", { status: 400 });
  }

  const email = profile.mail ?? profile.userPrincipalName;

  // 3 — Upsert in Supabase Auth
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if user exists
  const { data: existingUser } = await admin.auth.admin.listUsers();

  let user = existingUser?.users?.find((u) => u.email === email);

  if (!user) {
    // Create user if not found
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    if (createErr || !created) {
      console.error("Create user error:", createErr);
      return new Response("User creation failed", { status: 500 });
    }

    user = created.user;
  }

  // 4 — Create Supabase session
  // @ts-expect-error createSession exists but missing TS types
  const { data: sessionData, error: sessionErr } =
    await admin.auth.admin["createSession"]({
      user_id: user.id,
    });

  if (sessionErr || !sessionData) {
    console.error("Session creation failed:", sessionErr);
    return new Response("Session creation failed", { status: 500 });
  }

  // 5 — Store cookie (same cookie Supabase creates)
  const response = NextResponse.redirect(`${siteUrl}/dashboard`);

  response.cookies.set("sb-access-token", sessionData.session.access_token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  response.cookies.set("sb-refresh-token", sessionData.session.refresh_token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
