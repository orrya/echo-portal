import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    // ✅ FIXED: safe searchParams extraction (no static generation bailout)
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return new Response("No code provided", { status: 400 });
    }

    // -----------------------------
    // ENV VARS
    // -----------------------------
    const clientId = process.env.AZURE_CLIENT_ID!;
    const clientSecret = process.env.AZURE_CLIENT_SECRET!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!clientId || !clientSecret || !siteUrl || !supabaseUrl || !serviceKey) {
      console.error("❌ Missing env vars", {
        clientId,
        clientSecret,
        siteUrl,
        supabaseUrl,
        serviceKey,
      });
      return new Response("Server configuration error", { status: 500 });
    }

    const redirectUri = `${siteUrl}/auth/callback`;

    // -----------------------------
    // 1. Exchange code → Tokens
    // -----------------------------
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
      console.error("❌ Token exchange failed:", tokenJson);
      return new Response("Token exchange failed", { status: 400 });
    }

    const access_token = tokenJson.access_token;
    const refresh_token = tokenJson.refresh_token;
    const expires_in = tokenJson.expires_in;

    // -----------------------------
    // 2. Fetch Microsoft Profile
    // -----------------------------
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = await profileRes.json();

    if (!profile.mail && !profile.userPrincipalName) {
      console.error("❌ Microsoft profile error:", profile);
      return new Response("Microsoft profile error", { status: 400 });
    }

    const email = profile.mail ?? profile.userPrincipalName;

    // -----------------------------
    // 3. Init Supabase admin client
    // -----------------------------
    const admin = createClient(supabaseUrl, serviceKey);

    // -----------------------------
    // 4. Find or create Supabase User
    // -----------------------------
    const { data: existingUser } = await admin
      .from("auth.users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    let user = existingUser;

    if (!user) {
      console.log("Creating new user:", email);

      const { data: createdUser, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          email_confirm: true,
        });

      if (createErr) {
        console.error("❌ User creation failed:", createErr);
        return new Response("User creation failed", { status: 500 });
      }

      user = createdUser;
    }

    if (!user) {
      console.error("❌ Could not resolve user object");
      return new Response("User resolution error", { status: 500 });
    }

    // -----------------------------
    // 5 – Create Supabase session (bypass TS safely)
    // -----------------------------
    const adminAny = admin as any;

    const { data: sessionData, error: sessionErr } =
      await adminAny.auth.admin.createSession({
        user_id: user.id,
      });

    if (sessionErr || !sessionData?.session?.access_token) {
      console.error("❌ Session creation failed:", sessionErr);
      return new Response("Session creation failed", { status: 500 });
    }

    // -----------------------------
    // 6. Store Microsoft tokens
    // -----------------------------
    await admin.from("user_connections").upsert({
      user_id: user.id,
      provider: "Microsoft",
      access_token,
      refresh_token,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
    });

    // -----------------------------
    // 7. Set Supabase auth cookie
    // -----------------------------
    const response = NextResponse.redirect(`${siteUrl}/dashboard`);

    response.cookies.set("sb-access-token", sessionData.session.access_token, {
      httpOnly: true,
      path: "/",
    });

    response.cookies.set("sb-refresh-token", sessionData.session.refresh_token, {
      httpOnly: true,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("❌ Unhandled error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
