import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  // Exchange the code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth Error:", error);
    return new Response("OAuth Error", { status: 400 });
  }

  const session = data.session;

  // Microsoft Graph tokens
  const access_token = session.provider_token || session.access_token;
  const refresh_token = session.provider_refresh_token || session.refresh_token;
  const expires_at = session.expires_at
    ? new Date(session.expires_at * 1000).toISOString()
    : null;

  // Store in your user_connections table
  await supabase.from("user_connections").upsert({
    user_id: session.user.id,
    provider: "microsoft",
    access_token,
    refresh_token,
    expires_at,
  });

  // Redirect to your dashboard
  return Response.redirect("https://echo-portal.vercel.app");
}
