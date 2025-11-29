import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getLocalDateString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const userId = "75925360-ebf2-4542-a672-2449d2cf84a1";
  const today = getLocalDateString();

  const { data, error } = await supabase
    .from("echojar_daily")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (error || !data) {
    console.error("[today] No EchoJar entry for today:", error);
    return NextResponse.json({ entry: null });
  }

  return NextResponse.json({ entry: data });
}
