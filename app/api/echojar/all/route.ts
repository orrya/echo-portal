// app/api/echojar/all/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Single-user for now (same id you used in calendar endpoints)
const USER_ID = "75925360-ebf2-4542-a672-2449d2cf84a1";

export async function GET() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[echojar/all] Missing Supabase env vars");
    return NextResponse.json(
      { entries: [], error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("echojar_daily")
    .select("*")
    .eq("user_id", USER_ID)
    .order("date", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[echojar/all] Supabase error:", error);
    return NextResponse.json({ entries: [] }, { status: 200 });
  }

  return NextResponse.json({ entries: data ?? [] });
}
