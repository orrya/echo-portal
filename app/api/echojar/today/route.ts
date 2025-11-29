// app/api/echojar/today/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const USER_ID = "75925360-ebf2-4542-a672-2449d2cf84a1";

function getLocalDateString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
}

export async function GET() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[echojar/today] Missing Supabase env vars");
    return NextResponse.json(
      { entry: null, error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = getLocalDateString();

  // Try today first
  let { data, error } = await supabase
    .from("echojar_daily")
    .select("*")
    .eq("user_id", USER_ID)
    .eq("date", today)
    .maybeSingle();

  // If no row for today, fall back to latest entry
  if ((error && error.code === "PGRST116") || !data) {
    const fallback = await supabase
      .from("echojar_daily")
      .select("*")
      .eq("user_id", USER_ID)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    data = fallback.data ?? null;
  }

  if (!data) {
    return NextResponse.json({ entry: null });
  }

  return NextResponse.json({ entry: data });
}
