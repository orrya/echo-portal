import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  // Exchange OAuth code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth error:", error);
    return new Response("OAuth Error", { status: 400 });
  }

  const session = data.session;

  const access_token =
    session.provider_token || session.access_token;

  const refresh_token =
    session.provider_refresh_token || session.refresh_token;

  const expires_at = session.expires_at
    ? new Date(session.expires_at * 1000).toISOString()
    : null;

  // Store tokens in Supabase
  const { error: dbError } = await supabase
    .from("user_connections")
    .upsert({
      user_id: session.user.id,
      provider: "microsoft",
      access_token,
      refresh_token,
      expires_at,
    });

  if (dbError) {
    console.error("DB Error:", dbError);
  }

  // Redirect to dashboard
  return Response.redirect("https://echo-portal.vercel.app");
}
