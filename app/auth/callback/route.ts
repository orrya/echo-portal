import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { CANONICAL_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const siteUrl = CANONICAL_URL;
  const url = new URL(req.url);

  // ───────────────────────────────────────────────────────────────
  // 1. Ensure we received ?code= from Azure
  // ───────────────────────────────────────────────────────────────
  const authCode = url.searchParams.get("code");

  if (!authCode) {
    console.error("Missing Microsoft auth code");
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=missing_code`);
  }

  // ───────────────────────────────────────────────────────────────
  // 2. Load Azure credentials
  // ───────────────────────────────────────────────────────────────
  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const clientId =
    process.env.AZURE_CLIENT_ID || process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Azure credentials missing");
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=azure_config`);
  }

  const redirectUri = `${siteUrl}/auth/callback`;

  // ───────────────────────────────────────────────────────────────
  // 3. Exchange authorization code for tokens
  // ───────────────────────────────────────────────────────────────
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
  const refreshToken = tokenData.refresh_token ?? null;
  const expiresIn = tokenData.expires_in ?? 3600;

  // ───────────────────────────────────────────────────────────────
  // 4. Fetch Microsoft Graph profile
  // ───────────────────────────────────────────────────────────────
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const profile = await profileRes.json();

  const email =
    profile.mail ||
    profile.userPrincipalName ||
    (Array.isArray(profile.otherMails) ? profile.otherMails[0] : null);

  if (!email) {
    console.error("Azure profile did not return an email:", profile);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=no_email`);
  }

  // ───────────────────────────────────────────────────────────────
  // 5. Supabase Admin Client
  // ───────────────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  });

  // ───────────────────────────────────────────────────────────────
  // 6. Find or create user in Supabase
  // ───────────────────────────────────────────────────────────────
  const { data: listData } = await admin.auth.admin.listUsers();
  let user =
    listData?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ??
    null;

  // Create user if not exists
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (error || !data?.user) {
      console.error("Supabase user creation failed:", error);
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=create_user`);
    }

    user = data.user;
  }

  // ───────────────────────────────────────────────────────────────
  // 7. Store tokens + display name
  // ───────────────────────────────────────────────────────────────
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await admin.from("profiles").upsert({
    id: user.id,
    display_name: profile.displayName ?? null,
  });

  await admin.from("user_connections").upsert({
    user_id: user.id,
    provider: "microsoft",
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
  });

  // ───────────────────────────────────────────────────────────────
  // 8. Create a Supabase session for this user
  // ───────────────────────────────────────────────────────────────
  const adminAuth: any = (admin as any).auth.admin;
  const { data: sessionData, error: sessionErr } =
    await adminAuth.createSessionForUser({
      user_id: user.id,
    });

  if (sessionErr || !sessionData?.session) {
    console.error("Supabase session creation failed:", sessionErr);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=session_err`);
  }

  const session = sessionData.session;

  // ───────────────────────────────────────────────────────────────
  // 9. Write Supabase cookies
  // ───────────────────────────────────────────────────────────────
  const routeClient = createRouteHandlerClient({ cookies });

  const { error: cookieErr } = await routeClient.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (cookieErr) {
    console.error("Cookie write failed:", cookieErr);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=cookie_write`);
  }

  // ───────────────────────────────────────────────────────────────
  // 10. Redirect user to dashboard
  // ───────────────────────────────────────────────────────────────
  return NextResponse.redirect(`${siteUrl}/dashboard`);
}
