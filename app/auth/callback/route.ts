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
  const state =
    url.searchParams.get("state") || url.searchParams.get("provider");

  if (!authCode) {
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=missing_code`);
  }

  // Nylas Hosted OAuth
  if (state === "nylas") {
    return handleNylasCallback(authCode, siteUrl);
  }

  // Microsoft multi-tenant default
  return handleMicrosoftCallback(authCode, siteUrl);
}

/* -------------------------------------------------------------------------- */
/*                    🔹 MICROSOFT MULTI-TENANT FLOW                          */
/* -------------------------------------------------------------------------- */

async function handleMicrosoftCallback(code: string, siteUrl: string) {
  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Azure env missing");
    return NextResponse.redirect(
      `${siteUrl}/auth/sign-in?error=azure_config`
    );
  }

  const redirectUri = `${siteUrl}/auth/callback`;

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("Azure token exchange failed:", tokenData);
    return NextResponse.redirect(
      `${siteUrl}/auth/sign-in?error=token_exchange`
    );
  }

  const accessToken = tokenData.access_token as string;
  const refreshToken = (tokenData.refresh_token as string) || null;
  const expiresIn = (tokenData.expires_in as number) || 3600;

  // Decode tenant ID
  let userTenantId: string | null = null;
  if (tokenData.id_token) {
    try {
      const payload = tokenData.id_token.split(".")[1];
      const decoded = JSON.parse(
        Buffer.from(payload, "base64").toString()
      );
      userTenantId = decoded?.tid || null;
    } catch (err) {
      console.error("Failed to decode Microsoft id_token:", err);
    }
  }

  // Fetch Microsoft profile
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

  // Supabase admin
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Find/create user
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
      return NextResponse.redirect(
        `${siteUrl}/auth/sign-in?error=create_user`
      );
    }

    user = data.user;
  }

  // Store in user_connections (provider=microsoft)
  const expiresAtIso = new Date(Date.now() + expiresIn * 1000).toISOString();

  await supabase.from("user_connections").upsert({
    user_id: user.id,
    provider: "microsoft",
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAtIso,
    tenant_id: userTenantId,
    active: true,
  });

  // Cookie
  cookies().set(
    "echo-auth",
    JSON.stringify({ user_id: user.id, email }),
    {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
    }
  );

  return NextResponse.redirect(`${siteUrl}/dashboard`);
}

/* -------------------------------------------------------------------------- */
/*                    🔹 NYLAS HOSTED OAUTH FLOW                              */
/* -------------------------------------------------------------------------- */

async function handleNylasCallback(code: string, siteUrl: string) {
  const redirectUri =
    process.env.NYLAS_REDIRECT_URI || `${siteUrl}/auth/callback`;

  const clientId = process.env.NYLAS_CLIENT_ID!;
  const apiKey = process.env.NYLAS_API_KEY!;

  if (!clientId || !apiKey) {
    console.error("Nylas env missing");
    return NextResponse.redirect(
      `${siteUrl}/auth/sign-in?error=nylas_config`
    );
  }

  // ⭐ REQUIRED BY HOSTED OAUTH ⭐
  const tokenRes = await fetch("https://api.eu.nylas.com/v3/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: apiKey,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: cookies().get("nylas_code_verifier")?.value, // 💥 correct PKCE
    }),
});

  const tokens = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("Nylas token exchange failed:", tokens);
    return NextResponse.redirect(
      `${siteUrl}/auth/sign-in?error=nylas_failed`
    );
  }

  const {
    email,
    access_token,
    refresh_token,
    grant_id,
    provider,
    scope,
  } = tokens;

  if (!email || !grant_id) {
    console.error("Invalid Nylas token payload:", tokens);
    return NextResponse.redirect(
      `${siteUrl}/auth/sign-in?error=nylas_invalid`
    );
  }

  // Supabase admin
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

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
      console.error("Create Nylas user failed:", error);
      return NextResponse.redirect(
        `${siteUrl}/auth/sign-in?error=create_user`
      );
    }

    user = data.user;
  }

  // Store Nylas grant
  await supabase.from("user_connections").upsert({
    user_id: user.id,
    provider: "nylas",
    grant_id,
    email,
    access_token,
    refresh_token,
    provider_raw: provider ?? null,
    scope: scope ?? null,
    active: true,
  });

  // Cookie
  cookies().set(
    "echo-auth",
    JSON.stringify({ user_id: user.id, email }),
    {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
    }
  );

  return NextResponse.redirect(`${siteUrl}/dashboard`);
}
