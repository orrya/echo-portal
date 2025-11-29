// app/api/echojar/today/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceKey);

  // TODO: later – use auth. For now we stick with your hard-coded ID.
  const userId = "75925360-ebf2-4542-a672-2449d2cf84a1";
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("echo_jar")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("EchoJar fetch error", error);
    return NextResponse.json({ jar: null }, { status: 200 });
  }

  return NextResponse.json({ jar: data }, { status: 200 });
}
