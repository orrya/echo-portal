import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // secure + server-side
  );

  // Hardcoded user
  const userId = "75925360-ebf2-4542-a672-2449d2cf84a1";

  // FIX: Local UK date instead of UTC date
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  console.log("CALENDAR API HIT → using date:", today);

  const { data, error } = await supabase
    .from("work_state_snapshots")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (error) {
    console.error("API ERROR:", error.message);
    return NextResponse.json({ snapshot: null });
  }

  // Return full row
  return NextResponse.json({ snapshot: data });
}
