export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return new Response("No authorization code provided", { status: 400 });
    }

    const clientId =
      process.env.AZURE_CLIENT_ID ?? process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID || "common";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
    const redirectUri =
      process.env.AZURE_REDIRECT_URI ?? `${siteUrl}/auth/callback`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // ---- SAFETY ----
    if (!clientId || !clientSecret || !supabaseUrl || !serviceKey || !siteUrl) {
      console.error("❌ Missing environment variables!");
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
      console.error("❌ Microsoft profile missing email:", profile);
      return new Response("Profile error", { status: 400 });
    }

    // 3) Supabase admin client
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
    const admin = (supabase as any).auth.admin;

    ///
    /// 4) FIND EXISTING USER — using listUsers()
    ///
    const { data: usersPage, error: listErr } = await admin.listUsers();

    if (listErr) {
      console.error("❌ listUsers() failed:", listErr);
      return new Response("User lookup failed", { status: 500 });
    }

    // Case-insensitive match
    const existingUser = usersPage.users.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let user = existingUser;

    ///
    /// 5) CREATE USER IF NOT FOUND
    ///
    if (!user) {
      const { data: created, error: createErr } = await admin.createUser({
        email,
        email_confirm: true,
      });

      if (createErr) {
        // Prevent duplicate creation error breaking login
        if (createErr.code === "email_exists") {
          console.log("ℹ User already exists. Fetching again...");
          // Try again after creation conflict
          const { data: retryPage } = await admin.listUsers();
          user = retryPage.users.find(
            (u: any) => u.email?.toLowerCase() === email.toLowerCase()
          );
        } else {
          console.error("❌ User creation failed:", createErr);
          return new Response("User creation failed", { status: 500 });
        }
      } else {
        user = created.user;
      }
    }

    if (!user) {
      console.error("❌ Could not resolve user");
      return new Response("User lookup failure", { status: 500 });
    }

    ///
    /// 6) CREATE SESSION — via magic link (Supabase JS v2)
    ///
    const { data: linkData, error: linkErr } = await admin.generateLink({
      type: "magiclink",
      email: user.email,
    });

    if (linkErr || !linkData?.action_link) {
      console.error("❌ Failed to generate link:", linkErr);
      return new Response("Session creation failed", { status: 500 });
    }

    const actionUrl = new URL(linkData.action_link);
    const sessionToken = actionUrl.searchParams.get("token");

    if (!sessionToken) {
      console.error("❌ Missing session token");
      return new Response("Session token error", { status: 500 });
    }

    ///
    /// 7) Save Microsoft tokens in user_connections
    ///
    const { error: connErr } = await supabase.from("user_connections").upsert({
      user_id: user.id,
      provider: "microsoft",
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });

    if (connErr) {
      console.error("⚠️ Failed to save connection:", connErr);
    }

    ///
    /// 8) SET COOKIE AND REDIRECT
    ///
    const response = NextResponse.redirect(`${siteUrl}/dashboard`);

    response.cookies.set("sb-access-token", sessionToken, {
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
