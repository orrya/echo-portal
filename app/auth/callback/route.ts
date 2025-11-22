// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { CANONICAL_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const siteUrl = CANONICAL_URL;
  const url = new URL(req.url);
  const authCode = url.searchParams.get("code");

  if (!authCode) {
    console.error("Missing ?code from Azure");
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=missing_code`);
  }

  // -------------------------
  // 1) Azure token exchange
  // -------------------------
  const tenant = process.env.AZURE_TENANT_ID || "common";
  const clientId =
    process.env.AZURE_CLIENT_ID || process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Azure credentials missing");
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=azure_config`);
  }

  const redirectUri = `${siteUrl}/auth/callback`;

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: authCode,
        redirect_uri: redirectUri,
      }),
    }
  );

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error("Azure token exchange failed:", tokenData);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=token_exchange`);
  }

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token ?? null;
  const expiresIn = tokenData.expires_in ?? 3600;

  // -------------------------
  // 2) Fetch Microsoft profile
  // -------------------------
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileRes.json();

  const email =
    profile.mail ||
    profile.userPrincipalName ||
    (Array.isArray(profile.otherMails) ? profile.otherMails[0] : null);

  if (!email) {
    console.error("Azure profile returned no usable email:", profile);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=no_email`);
  }

  // -------------------------
  // 3) Supabase admin client
  // -------------------------
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // -------------------------
  // 4) Find or create user
  // -------------------------
  const { data: list } = await supabase.auth.admin.listUsers();
  let user =
    list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ??
    null;

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error || !data?.user) {
      console.error("Failed to create Supabase user:", error);
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=create_user`);
    }
    user = data.user;
  }

  // -------------------------
  // 5) Store MS tokens + profile
  // -------------------------
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await supabase.from("profiles").upsert({
    id: user.id,
    display_name: profile.displayName ?? null,
  });

  await supabase.from("user_connections").upsert({
    user_id: user.id,
    provider: "azure",
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
  });

  // -------------------------
  // 6) Generate magic link to create Supabase session
  // -------------------------
  const { data: linkData, error: linkErr } =
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  if (linkErr || !linkData) {
    console.error("generateLink error:", linkErr);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=generate_link`);
  }

  // Real token lives here, NOT .token
  const oneTimeToken =
    (linkData.properties as any)?.email_otp ??
    (linkData.properties as any)?.hashed_token ??
    null;

  if (!oneTimeToken) {
    console.error("Missing magic link token:", linkData);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=no_token`);
  }

  // -------------------------
  // 7) Create session via setSession
  // -------------------------
  const routeClient = createRouteHandlerClient({ cookies });

  const { error: sessionErr } = await routeClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionErr) {
    console.error("setSession error:", sessionErr);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=session_write`);
  }

  // -------------------------
  // 8) Redirect to dashboard
  // -------------------------
  return NextResponse.redirect(`${siteUrl}/dashboard`);
}
