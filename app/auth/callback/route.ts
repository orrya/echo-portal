// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { CANONICAL_URL } from "@/lib/constants";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const siteUrl = CANONICAL_URL;
  const url = new URL(req.url);
  const authCode = url.searchParams.get("code");

  if (!authCode) {
    console.error("Missing `code` in Azure redirect");
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=missing_code`);
  }

  // Azure credentials
  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const clientId =
    process.env.AZURE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Azure env vars missing");
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=azure_config`);
  }

  const redirectUri = `${siteUrl}/auth/callback`;

  // 1. Exchange code for tokens
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
  const refreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in ?? 3600;

  // 2. Fetch Microsoft profile
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileRes.json();

  const email =
    profile.mail ||
    profile.userPrincipalName ||
    (Array.isArray(profile.otherMails) ? profile.otherMails[0] : null);

  if (!email) {
    console.error("No usable email in Microsoft profile:", profile);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=no_email`);
  }

  // 3. Supabase admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  });

  // 4. Find or create user
  const { data: users } = await admin.auth.admin.listUsers();

  let user = users?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (error || !data?.user) {
      console.error("Failed creating Supabase user:", error);
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=create_user`);
    }

    user = data.user;
  }

  // 5. Store tokens + profile
  await admin.from("profiles").upsert({
    id: user.id,
    display_name: profile.displayName ?? null,
  });

  await admin.from("user_connections").upsert({
    user_id: user.id,
    provider: "microsoft",
    access_token: accessToken,
    refresh_token: refreshToken ?? null,
    expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
  });

  // 6. Create a Supabase session
  const { data: sessionData, error: sessionErr } =
    await admin.auth.admin.createSession(user.id);

  if (sessionErr || !sessionData?.session) {
    console.error("createSession error:", sessionErr);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=session_err`);
  }

  const session = sessionData.session;

  // 7. Write session cookies using official helper
  const res = NextResponse.redirect(`${siteUrl}/dashboard`);
  const routeClient = createRouteHandlerClient({ cookies });

  const { error: writeError } = await routeClient.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (writeError) {
    console.error("setSession error:", writeError);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=cookie_write`);
  }

  return res;
}
