import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) return new Response("Missing code", { status: 400 });

  // 1. Exchange code for tokens from Microsoft
  const tokenRes = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID!,
        client_secret: process.env.AZURE_CLIENT_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        code,
      }),
    }
  );

  const tokens = await tokenRes.json();

  if (tokens.error) {
    console.error(tokens);
    return new Response("Token exchange failed", { status: 400 });
  }

  const access_token = tokens.access_token;
  const refresh_token = tokens.refresh_token;
  const expires_in = tokens.expires_in;

  // 2. Fetch Microsoft profile
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const profile = await profileRes.json();

  if (!profile.id)
    return new Response("Failed to get profile", { status: 400 });

  // 3. Upsert user into Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: profile.mail || profile.userPrincipalName,
      password: profile.id, // deterministic fallback
    });

  // If user didn't exist → sign up
  if (authError) {
    await supabase.auth.signUp({
      email: profile.mail || profile.userPrincipalName,
      password: profile.id,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Store tokens in user_connections
  await supabase.from("user_connections").upsert({
    user_id: user!.id,
    provider: "microsoft",
    access_token,
    refresh_token,
    expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
  });

  return NextResponse.redirect(process.env.NEXT_PUBLIC_SITE_URL!);
}
