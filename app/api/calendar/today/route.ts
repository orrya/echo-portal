// app/api/calendar/today/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const userId = "75925360-ebf2-4542-a672-2449d2cf84a1";
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("work_state_snapshots")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (error) {
    return NextResponse.json({ snapshot: null });
  }

  // Construct the proper camelCase API response
  const snapshot = {
    date: data.date,
    calendarInsights: {
      workAbility: Number(data.work_ability_score ?? 0),
      meetingCount: Number(data.meeting_count ?? 0),
      meetingLoadMinutes: Number(data.meeting_load_minutes ?? 0),
      fragments: Number(data.fragments ?? 0),
      lostFragmentMinutes: Number(data.lost_fragment_minutes ?? 0),
      contextSwitches: Number(data.context_switches ?? 0),
      contextSwitchCost: Number(data.context_switch_cost ?? 0),
      deepWorkWindows: safeParse(data.deep_work_windows),
      likelyFollowUp: safeParse(data.likely_follow_up),
    },
    dayTimeline: safeParse(data.day_timeline),
  };

  return NextResponse.json({ snapshot });
}

function safeParse(value: any) {
  try {
    if (!value) return [];
    if (typeof value === "string") return JSON.parse(value);
    return value;
  } catch {
    return [];
  }
}
