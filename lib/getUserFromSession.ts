import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function getUserFromSession() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("echo-session")?.value;

  if (!sessionToken) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Get session
  const { data: session } = await supabase
    .from("sessions")
    .select("user_id")
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (!session) return null;

  // 2) Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user_id)
    .maybeSingle();

  return profile ?? null;
}
