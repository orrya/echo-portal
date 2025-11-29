import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const userId = "75925360-ebf2-4542-a672-2449d2cf84a1";

  const { data, error } = await supabase
    .from("echojar_daily")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(30);

  if (error) {
    console.error("EchoJar error:", error);
    return NextResponse.json({ entries: [] });
  }

  return NextResponse.json({ entries: data ?? [] });
}
