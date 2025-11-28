// app/api/calendar/tomorrow/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const userId = "75925360-ebf2-4542-a672-2449d2cf84a1";

  const tomorrow = new Date(Date.now() + 86400000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("calendar_snapshots")
    .select("*")
    .eq("user_id", userId)
    .eq("date", tomorrow)
    .single();

  if (error || !data) {
    return NextResponse.json({ snapshot: null });
  }

  const snapshot = {
    date: data.date,
    dayTimeline: safeParse(data.day_timeline),
    calendarInsights: safeParse(data.calendar_insights),
    flaggedMeetings: safeParse(data.flagged_meetings),
    deepWorkWindows: safeParse(data.deep_work_windows),
    forecast: safeParse(data.forecast),
    aiStory: data.ai_story ?? "",
  };

  return NextResponse.json({ snapshot });
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
