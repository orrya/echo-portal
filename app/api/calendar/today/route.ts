// app/api/calendar/today/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getLocalDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const userId = "75925360-ebf2-4542-a672-2449d2cf84a1";
  const today = getLocalDate();

  // 1 — try today's calendar snapshot
  let { data } = await supabase
    .from("calendar_snapshots")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (!data) {
    // 2 — fallback to most recent snapshot <= today
    const fallback = await supabase
      .from("calendar_snapshots")
      .select("*")
      .eq("user_id", userId)
      .lte("date", today)             // 🔥 avoids future-dated Dec 2
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    data = fallback.data ?? null;
  }

  if (!data) return NextResponse.json({ snapshot: null });

  return NextResponse.json({
    snapshot: {
      date: data.date,
      dayTimeline: safeParse(data.day_timeline),
      calendarInsights: safeParse(data.calendar_insights),
      flaggedMeetings: safeParse(data.flagged_meetings),
      deepWorkWindows: safeParse(data.deep_work_windows),
      forecast: safeParse(data.forecast),
      aiStory: data.ai_story ?? "",
    },
  });
}

function safeParse(v: any) {
  try {
    if (!v) return [];
    if (typeof v === "string") return JSON.parse(v);
    return v;
  } catch {
    return [];
  }
}
