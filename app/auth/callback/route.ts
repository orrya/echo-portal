// app/auth/callback/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SESSION_TTL_HOURS = 24;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return new Response("Missing authorization code", { status: 400 });
    }

    const clientId =
      process.env.AZURE_CLIENT_ID ?? process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID || "common";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const redirectUri =
      process.env.AZURE_REDIRECT_URI ?? `${siteUrl}/auth/callback`;

    if (!clientId || !clientSecret || !supabaseUrl || !serviceKey || !siteUrl) {
      console.error("❌ Missing env vars", {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!serviceKey,
        siteUrl: !!siteUrl,
      });
      return new Response("Server configuration error", { status: 500 });
    }

    // 1) Exchange code → Microsoft tokens
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

    // 2) Fetch Microsoft profile
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = await profileRes.json();

    const email: string | undefined =
      profile.mail ?? profile.userPrincipalName ?? undefined;

    if (!email) {
      console.error("❌ Microsoft profile missing email:", profile);
      return new Response("Microsoft profile error", { status: 400 });
    }

    // 3) Supabase DB client
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 4) Upsert user profile
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .upsert(
        {
          email,
          display_name: profile.displayName,
          ms_user_id: profile.id,
        },
        { onConflict: "email" }
      )
      .select("*")
      .single();

    if (userErr || !userRow) {
      console.error("❌ User upsert failed:", userErr);
      return new Response("User upsert failed", { status: 500 });
    }

    const userId = userRow.id;

    // 5) Store Microsoft tokens in DB
    console.log("🔵🔵 DEBUG — ENTERING TOKEN UPSERT STEP 🔵🔵");
    console.log("🔵 userRow:", userRow);
    console.log("🔵 userRow.id:", userRow?.id);
    console.log("🔵 incoming userId variable:", userId);

    const { error: connErr } = await supabase
      .from("user_connections")
      .upsert(
        {
          user_id: userId,
          provider: "microsoft",
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: new Date(
            Date.now() + expiresIn * 1000
          ).toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    console.log("🔴 token upsert result error:", connErr);

    // 6) Create portal session
    const sessionToken = crypto.randomUUID();

    const expiresAt = new Date(
      Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { error: sessionErr } = await supabase.from("sessions").insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt,
    });

    if (sessionErr) {
      console.error("❌ Failed to create session:", sessionErr);
      return new Response("Session creation failed", { status: 500 });
    }

    // 7) Set cookie and redirect to dashboard
    const response = NextResponse.redirect(`${siteUrl}/dashboard`);

    response.cookies.set("echo-session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_HOURS * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error("❌ Unhandled error in /auth/callback:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
