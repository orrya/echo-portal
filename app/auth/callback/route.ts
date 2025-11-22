// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { CANONICAL_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const siteUrl = CANONICAL_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const url = new URL(req.url);
    const authCode = url.searchParams.get("code");

    if (!authCode) {
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=missing_code`);
    }

    const tenantId = process.env.AZURE_TENANT_ID ?? "common";
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Azure env vars missing");
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=azure_config`);
    }

    const redirectUri = `${siteUrl}/auth/callback`;

    // 1. Exchange Microsoft code for tokens
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
      console.error("Azure token error:", tokenData);
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=token_exchange`);
    }

    const accessToken: string = tokenData.access_token;
    const refreshToken: string | undefined = tokenData.refresh_token;
    const expiresIn: number = tokenData.expires_in ?? 3600;

    // 2. Fetch Microsoft profile
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = await profileRes.json();

    const email: string | undefined =
      profile.mail ||
      profile.userPrincipalName ||
      (Array.isArray(profile.otherMails) ? profile.otherMails[0] : undefined);

    if (!email) {
      console.error("No email in Microsoft profile:", profile);
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=no_email`);
    }

    // 3. Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Supabase env vars missing");
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=supabase_config`);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 4. Find or create auth user
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("listUsers error:", listError);
    }

    let user =
      listData?.users.find(
        (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
      ) ?? null;

    if (!user) {
      const { data: created, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
        });

      if (createError || !created?.user) {
        console.error("createUser error:", createError);
        return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=create_user`);
      }

      user = created.user;
    }

    // 5. Store profile + tokens
    const expiresAtIso = new Date(Date.now() + expiresIn * 1000).toISOString();

    await supabaseAdmin.from("profiles").upsert({
      id: user.id,
      display_name: profile.displayName ?? null,
    });

    await supabaseAdmin.from("user_connections").upsert({
      user_id: user.id,
      provider: "microsoft",
      access_token: accessToken,
      refresh_token: refreshToken ?? null,
      expires_at: expiresAtIso,
    });

    // 6. Create Supabase session for this user (admin “log in as user”)
    // NOTE: createSession is relatively new; we cast to any so TS won’t complain
    const adminAuth: any = (supabaseAdmin as any).auth.admin;
    const { data: sessionData, error: sessionError } =
      await adminAuth.createSession(user.id);

    if (sessionError || !sessionData?.session) {
      console.error("createSession error:", sessionError);
      return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=create_session`);
    }

    const session = sessionData.session;

    // 7. Set Supabase auth cookies
    const cookieStore = cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    };

    cookieStore.set("sb-access-token", session.access_token, cookieOptions);
    cookieStore.set("sb-refresh-token", session.refresh_token, cookieOptions);

    // 8. Redirect into the app
    return NextResponse.redirect(`${siteUrl}/dashboard`);
  } catch (err) {
    console.error("Callback fatal error:", err);
    return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=callback_exception`);
  }
}
