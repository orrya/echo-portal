export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) return new Response("Missing code", { status: 400 });

    // ENV
    const clientId = process.env.AZURE_CLIENT_ID!;
    const clientSecret = process.env.AZURE_CLIENT_SECRET!;
    const tenantId = process.env.AZURE_TENANT_ID || "common";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

    const redirectUri =
      process.env.AZURE_REDIRECT_URI ??
      `${siteUrl}/auth/callback`;

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
      console.error("Token exchange error:", tokenJson);
      return new Response("Token exchange failed", { status: 400 });
    }

    const accessToken = tokenJson.access_token;
    const refreshToken = tokenJson.refresh_token;
    const expiresIn = tokenJson.expires_in ?? 3600;

    // 2) Fetch Microsoft profile
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = await profileRes.json();
    const email = profile.mail ?? profile.userPrincipalName;

    if (!email) {
      console.error("No email from Microsoft:", profile);
      return new Response("Invalid profile", { status: 400 });
    }

    // SUPABASE ADMIN
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 3) Lookup or create user
    const admin = (supabase as any).auth.admin;

    const { data: page } = await admin.listUsers();
    let user = page.users.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      const { data: created, error: createErr } = await admin.createUser({
        email,
        email_confirm: true,
      });

      if (createErr) {
        console.error("User creation failed:", createErr);
        return new Response("User creation failed", { status: 500 });
      }

      user = created.user;
    }

    // 4) Create Supabase session USING PASSWORDLESS LOGIN (no email sent)
    const loginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apiKey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: "", // empty because we use passwordless auth
      }),
    });

    const loginJson = await loginRes.json();

    if (!loginRes.ok || !loginJson.access_token) {
      console.error("Supabase login failed:", loginJson);
      return new Response("Session creation failed", { status: 500 });
    }

    const supabaseAccessToken = loginJson.access_token;

    // 5) Store Microsoft tokens
    await supabase.from("user_connections").upsert({
      user_id: user.id,
      provider: "microsoft",
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });

    // 6) Set cookie & redirect
    const response = NextResponse.redirect(`${siteUrl}/dashboard`);
    response.cookies.set("sb-access-token", supabaseAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("❌ Callback error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
