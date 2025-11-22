// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { CANONICAL_URL } from "@/lib/constants";

// Supabase will handle the OAuth token exchange.
// We only save provider tokens & redirect.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${CANONICAL_URL}/auth/sign-in?error=missing_code`);
  }

  const routeClient = createRouteHandlerClient({ cookies });

  // 1️⃣ Exchange code for Supabase session
  const { data, error } = await routeClient.auth.exchangeCodeForSession(code);

  if (error || !data?.session) {
    console.error("exchangeCodeForSession failed:", error);
    return NextResponse.redirect(`${CANONICAL_URL}/auth/sign-in?error=session_failed`);
  }

  const session = data.session;
  const user = session.user;

  // Provider tokens Supabase gives you
  const providerAccessToken = session.provider_token;
  const providerRefreshToken = (session as any).provider_refresh_token ?? null;

  // 2️⃣ Store tokens in your user_connections table
  await routeClient.from("user_connections").upsert({
    user_id: user.id,
    provider: "azure",
    access_token: providerAccessToken ?? session.access_token,
    refresh_token: providerRefreshToken ?? session.refresh_token ?? null,
    expires_at: session.expires_at,
    updated_at: new Date().toISOString(),
  });

  // 3️⃣ Redirect → dashboard
  return NextResponse.redirect(`${CANONICAL_URL}/dashboard`);
}
