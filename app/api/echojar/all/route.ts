import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const userId = "75925360-ebf2-4542-a672-2449d2cf84a1";

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("echojar_daily")
    .select("*")
    .eq("user_id", userId)
    .lte("date", today)            // 🔥 ignore future rows
    .order("date", { ascending: false });

  if (error) {
    console.error("[echojar/all] Error:", error);
    return NextResponse.json({ entries: [] });
  }

  return NextResponse.json({ entries: data ?? [] });
}
