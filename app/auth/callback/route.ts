// app/auth/callback/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SESSION_TTL_HOURS = 24;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return new Response("Missing authorization code", { status: 400 });
    }

    // --- ENV VARS ---
    const clientId =
      process.env.AZURE_CLIENT_ID || process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;

    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID || "common";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
    const redirectUri =
      process.env.AZURE_REDIRECT_URI ?? `${siteUrl}/auth/callback`;

    console.log("🔎 ENV CHECK", {
      supabaseUrl,
      serviceKey: serviceKey ? "present" : "missing",
      siteUrl,
      redirectUri,
      clientId,
      hasSecret: !!clientSecret,
      tenantId,
    });

    // --- 1) Exchange Microsoft auth code for tokens ---
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
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

    const accessToken = tokenJson.access_token as string;
    const refreshToken = tokenJson.refresh_token as string | undefined;
    const expiresIn = tokenJson.expires_in ?? 3600;

    // --- 2) Fetch Microsoft profile ---
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = await profileRes.json();

    const email =
      profile.mail ?? profile.userPrincipalName ?? undefined;

    if (!email) {
      console.error("❌ Microsoft profile missing email:", profile);
      return new Response("Microsoft profile error", { status: 400 });
    }

    // --- 3) Supabase Admin Client ---
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // --- 4) Ensure auth user exists in Supabase Auth ---
    let authUserId: string;

    // Vercel-safe version: list users
    const { data: userList, error: listErr } =
      await supabase.auth.admin.listUsers();

    if (listErr) {
      console.error("❌ Error listing users:", listErr);
      return new Response("Auth lookup failed", { status: 400 });
    }

    const match = userList.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (match) {
      authUserId = match.id;
    } else {
      const { data: created, error: createErr } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
        });

      if (createErr || !created?.user) {
        console.error("❌ Failed to create auth user:", createErr);
        return new Response("Failed to create auth user", { status: 500 });
      }

      authUserId = created.user.id;
    }

    // --- 5) Upsert into profiles table ---
    await supabase.from("profiles").upsert(
      {
        id: authUserId,
        display_name: profile.displayName ?? null,
        notion_db_row_id: null,
        n8n_user_id: null,
      },
      { onConflict: "id" }
    );

    // --- 6) Upsert Microsoft tokens ---
    await supabase.from("user_connections").upsert(
      {
        user_id: authUserId,
        provider: "microsoft",
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    // --- 7) Create session row ---
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { error: sessionErr } = await supabase.from("sessions").insert({
      user_id: authUserId,
      session_token: sessionToken,
      expires_at: expiresAt,
    });

    if (sessionErr) {
      console.error("❌ Session creation failed:", sessionErr);
      return new Response("Session creation failed", { status: 500 });
    }

    // --- 8) Set cookie with REQUIRED domain ---
    const response = NextResponse.redirect(`${siteUrl}/dashboard`);

    response.cookies.set("echo-session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: "echo-portal.vercel.app", // 🔥 REQUIRED FIX
      path: "/",
      maxAge: SESSION_TTL_HOURS * 60 * 60,
    });

    console.log("🍪 COOKIE SET:", {
      domain: "echo-portal.vercel.app",
      value: sessionToken,
    });

    return response;
  } catch (err) {
    console.error("❌ Unhandled /auth/callback error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
