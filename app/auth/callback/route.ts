export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return new Response("No code provided", { status: 400 });
    }

    const clientId =
      process.env.AZURE_CLIENT_ID ?? process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID || "common";
    const redirectUri =
      process.env.AZURE_REDIRECT_URI ??
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!clientId || !clientSecret || !supabaseUrl || !serviceKey || !siteUrl) {
      console.error("❌ Missing env vars for callback", {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!serviceKey,
        siteUrl: !!siteUrl,
      });
      return new Response("Server configuration error", { status: 500 });
    }

    // 1) Exchange code → tokens
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
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
      console.error("❌ Token exchange failed:", tokenJson);
      return new Response("Token exchange failed", { status: 400 });
    }

    const accessToken: string = tokenJson.access_token;
    const refreshToken: string | undefined = tokenJson.refresh_token;
    const expiresIn: number = tokenJson.expires_in ?? 3600;

    // 2) Fetch profile from Microsoft Graph
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();

    const email: string | undefined =
      profile.mail ?? profile.userPrincipalName ?? undefined;

    if (!email) {
      console.error("❌ Microsoft profile did not return an email:", profile);
      return new Response("Microsoft profile error", { status: 400 });
    }

    // 3) Supabase admin client
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 4) Find or create Supabase user
    const { data: existingUser, error: selectErr } = await admin
      .from("auth.users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (selectErr) {
      console.error("❌ Error selecting auth.users:", selectErr);
    }

    let user = existingUser;

    if (!user) {
      console.log("Creating new Supabase user for", email);

      const adminAny = admin as any;
      const {
        data: created,
        error: createErr,
      } = await adminAny.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createErr || !created?.user) {
        console.error("❌ User creation failed:", createErr);
        return new Response("User creation failed", { status: 500 });
      }

      user = created.user;
    }

    const userId: string = (user as any).id ?? (user as any).user_id;

    if (!userId) {
      console.error("❌ Could not resolve user id from user object:", user);
      return new Response("User resolution error", { status: 500 });
    }

    // 5) Create Supabase session (admin API, untyped – cast to any)
    const adminAny = admin as any;
    const {
      data: sessionData,
      error: sessionErr,
    } = await adminAny.auth.admin.createSession({
      user_id: userId,
    });

    if (sessionErr || !sessionData?.session) {
      console.error("❌ Session creation failed:", sessionErr);
      return new Response("Session creation failed", { status: 500 });
    }

    // 6) Store Microsoft tokens for n8n / later use
    const { error: connErr } = await admin.from("user_connections").upsert({
      user_id: userId,
      provider: "microsoft",
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });

    if (connErr) {
      console.error("⚠️ user_connections upsert error:", connErr);
    }

    // 7) Set Supabase auth cookies & redirect to dashboard
    const response = NextResponse.redirect(`${siteUrl}/dashboard`);

    response.cookies.set("sb-access-token", sessionData.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    response.cookies.set("sb-refresh-token", sessionData.session.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("❌ Unhandled error in /auth/callback:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
