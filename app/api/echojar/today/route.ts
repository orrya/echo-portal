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
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = getLocalDateString();

  // 1 — try today exactly
  let { data } = await supabase
    .from("echojar_daily")
    .select("*")
    .eq("user_id", USER_ID)
    .eq("date", today)
    .maybeSingle();

  if (!data) {
    // 2 — fallback to latest <= today
    const fallback = await supabase
      .from("echojar_daily")
      .select("*")
      .eq("user_id", USER_ID)
      .lte("date", today)             // 🔥 ignore future rows
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    data = fallback.data ?? null;
  }

  return NextResponse.json({ entry: data });
}
