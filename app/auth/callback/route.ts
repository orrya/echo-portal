// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { CANONICAL_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const siteUrl = CANONICAL_URL;
  const url = new URL(req.url);
  const authCode = url.searchParams.get("code");

  if (!authCode) {
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=missing_code`);
  }

  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Azure env missing");
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=azure_config`);
  }

  const redirectUri = `${siteUrl}/auth/callback`;

  // 1. Exchange code → tokens
  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
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
  const refreshToken = tokenData.refresh_token || null;
  const expiresIn = tokenData.expires_in || 3600;

  // Decode tenant ID
  let userTenantId: string | null = null;
  if (tokenData.id_token) {
    try {
      const base64Payload = tokenData.id_token.split(".")[1];
      const decodedPayload = JSON.parse(
        Buffer.from(base64Payload, "base64").toString()
      );
      userTenantId = decodedPayload?.tid || null;
    } catch (err) {
      console.error("Failed to decode id_token:", err);
    }
  }

  // 2. Fetch Azure profile
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileRes.json();

  const email =
    profile.mail ||
    profile.userPrincipalName ||
    (profile.otherMails?.[0] ?? null);

  if (!email) {
    console.error("No email in Microsoft profile:", profile);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=no_email`);
  }

  // 3. Supabase admin client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // 4. Find or create Supabase user by email
  const { data: listData } = await supabase.auth.admin.listUsers();
  let user =
    listData?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    ) ?? null;

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (error || !data?.user) {
      console.error("Create user failed:", error);
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=create_user`);
    }

    user = data.user;
  }

  // 5. Store tokens + profile
  const expiresAtIso = new Date(Date.now() + expiresIn * 1000).toISOString();

  await supabase.from("profiles").upsert({
    id: user.id,
    display_name: profile.displayName ?? null,
  });

  await supabase.from("user_connections").upsert({
    user_id: user.id,
    provider: "azure",
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAtIso,
    tenant_id: userTenantId,
  });

  // ❌ REMOVE subscription call from callback
  // It causes cookie not to be written.

  // 6. Write auth cookie
  const cookieStore = cookies();
  cookieStore.set(
    "echo-auth",
    JSON.stringify({
      user_id: user.id,
      email,
    }),
    {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
    }
  );

  // 7. Redirect → Dashboard
  return NextResponse.redirect(`${siteUrl}/dashboard`);
}
