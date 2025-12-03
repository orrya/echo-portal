// app/auth/callback/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { CANONICAL_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const siteUrl = CANONICAL_URL;
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=missing_code`);
  }

  if (state === "nylas") {
    return handleNylas(code, siteUrl);
  }

  return handleMicrosoft(code, siteUrl);
}

/* -------------------------------------------------------------------------- */
/*  MICROSOFT SINGLE TENANT LOGIN                                             */
/* -------------------------------------------------------------------------- */

async function handleMicrosoft(code: string, siteUrl: string) {
  const tenantId = "7bb868c2-184b-4410-a2b5-e3dc218422db";
  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;
  const redirectUri = `${siteUrl}/auth/callback`;

  // Exchange auth code for token
  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    }
  );

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("MS Token Error:", tokenData);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=token_exchange`);
  }

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token ?? null;

  // Get Microsoft profile
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileRes.json();

  const email =
    profile.mail ||
    profile.userPrincipalName ||
    profile.otherMails?.[0] ||
    null;

  if (!email) {
    console.error("MS Missing email:", profile);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=no_email`);
  }

  // Supabase Admin
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: list } = await supabase.auth.admin.listUsers();

  let user =
    list?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    ) ?? null;

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (error || !data?.user) {
      console.error("Create MS user failed:", error);
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=create_user`);
    }

    user = data.user;
  }

  await supabase.from("user_connections").upsert({
    user_id: user.id,
    provider: "microsoft",
    access_token: accessToken,
    refresh_token: refreshToken,
    active: true,
  });

  // Set login cookie
  cookies().set(
    "echo-auth",
    JSON.stringify({ user_id: user.id, email }),
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }
  );

  return NextResponse.redirect(`${siteUrl}/dashboard`);
}

/* -------------------------------------------------------------------------- */
/*  NYLAS HOSTED OAUTH                                                        */
/* -------------------------------------------------------------------------- */

async function handleNylas(code: string, siteUrl: string) {
  const clientId = process.env.NYLAS_CLIENT_ID!;
  const apiKey = process.env.NYLAS_API_KEY!;
  const redirectUri = `${siteUrl}/auth/callback`;

  const codeVerifier = cookies().get("nylas_code_verifier")?.value;

  const tokenRes = await fetch("https://api.eu.nylas.com/v3/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: apiKey,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("Nylas Token Error:", tokenData);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=nylas_failed`);
  }

  const {
    email,
    access_token,
    refresh_token,
    grant_id,
    provider,
    scope,
  } = tokenData;

  if (!email || !grant_id) {
    console.error("Nylas invalid:", tokenData);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=nylas_invalid`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: list } = await supabase.auth.admin.listUsers();

  let user =
    list?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    ) ?? null;

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (error || !data?.user) {
      console.error("Create Nylas user failed:", error);
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=create_user`);
    }

    user = data.user;
  }

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

  cookies().set(
    "echo-auth",
    JSON.stringify({ user_id: user.id, email }),
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }
  );

  return NextResponse.redirect(`${siteUrl}/dashboard`);
}
