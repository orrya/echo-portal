// lib/getUserFromSession.ts
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function getUserFromSession() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("echo-session")?.value;

  if (!sessionToken) {
    console.log("SESSION DEBUG: no echo-session cookie");
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Look up session row
  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("session_token", sessionToken)
    .maybeSingle();

  console.log("SESSION DEBUG: lookup", { sessionToken, session, sessionErr });

  if (!session || sessionErr) return null;

  // Optional: basic expiry check (don’t block yet if you’d rather)
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    console.log("SESSION DEBUG: session expired");
    return null;
  }

  // 2) Fetch profile (this is your “user” object)
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user_id)
    .maybeSingle();

  console.log("SESSION DEBUG: profile", { profile, profileErr });

  if (!profile || profileErr) return null;

  return profile;
}
