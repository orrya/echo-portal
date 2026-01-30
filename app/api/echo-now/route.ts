import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/getUser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* -------------------------------------------------
   HELPERS
------------------------------------------------- */

function firstName(full?: string | null) {
  if (!full) return null;
  return full.trim().split(" ")[0] || null;
}

function formatTime(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Removes RE:/FW:/FWD: and normalises shouting
 */
function normaliseSubject(subject?: string | null) {
  if (!subject) return "a thread";

  let cleaned = subject.replace(/^(re:|fw:|fwd:)\s*/gi, "").trim();

  const letters = cleaned.replace(/[^A-Za-z]/g, "");
  if (!letters) return cleaned;

  const upperRatio =
    letters.replace(/[^A-Z]/g, "").length / letters.length;

  if (upperRatio > 0.7) {
    const lower = cleaned.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  return cleaned;
}

function normaliseTitle(title?: string | null) {
  if (!title) return null;

  let cleaned = title
    .replace(/\[.*?\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const letters = cleaned.replace(/[^A-Za-z]/g, "");
  if (!letters) return cleaned;

  const upperRatio =
    letters.replace(/[^A-Z]/g, "").length / letters.length;

  if (upperRatio > 0.7) {
    const lower = cleaned.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  return cleaned;
}

/* -------------------------------------------------
   ARCHETYPE SELECTION (LOCKED)
------------------------------------------------- */

type Archetype =
  | "clear-runway"
  | "holding-ground"
  | "carrying-load"
  | "light-day";

function selectArchetype({
  meetingMinutes,
  workAbility,
  hasNoisyMeeting,
  diffFromYesterday,
}: {
  meetingMinutes: number;
  workAbility: number;
  hasNoisyMeeting: boolean;
  diffFromYesterday: number | null;
}): Archetype {
  // Priority order matters — do not reorder
  if (meetingMinutes >= 180 || hasNoisyMeeting) {
    return "carrying-load";
  }

  if (meetingMinutes < 90 && workAbility >= 70) {
    return "clear-runway";
  }

  if (
    meetingMinutes < 60 &&
    diffFromYesterday != null &&
    diffFromYesterday <= -30
  ) {
    return "light-day";
  }

  return "holding-ground";
}

/* -------------------------------------------------
   MAIN
------------------------------------------------- */

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({
      narrative: "Nothing needs your attention right now.",
    });
  }

  const today = new Date();
  const yyyyMmDd = today.toISOString().slice(0, 10);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const startOfTodayIso = new Date(`${yyyyMmDd}T00:00:00.000Z`).toISOString();

  /* -------------------------------------------------
     1) WHAT ECHO ALREADY HANDLED
  ------------------------------------------------- */

  const { data: drafts } = await supabase
    .from("prepared_email_drafts")
    .select("email_record_id, subject, created_at")
    .eq("user_id", user.id)
    .eq("active", true)
    .gte("created_at", startOfTodayIso)
    .order("created_at", { ascending: false })
    .limit(5);

  let handledLine: string | null = null;

  if (drafts && drafts.length > 0) {
    const emailIds = drafts.map(d => d.email_record_id).filter(Boolean);

    const { data: emails } = await supabase
      .from("email_records")
      .select('id, "From", "Subject"')
      .eq("user_id", user.id)
      .in("id", emailIds);

    const emailMap = new Map(
      (emails ?? []).map((e: any) => [e.id, e])
    );

    const mentions = drafts.slice(0, 3).map((d: any) => {
      const email = emailMap.get(d.email_record_id);
      const from = email?.["From"] ?? "";
      const name =
        from.split("<")[0]?.trim() ||
        from.split("@")[0] ||
        "someone";

      const subject = normaliseSubject(
        email?.["Subject"] ?? d.subject
      );

      return `${name} about “${subject}”`;
    });

    const extra = Math.max(0, drafts.length - mentions.length);

    handledLine =
      mentions.length === 1
        ? `I’ve already handled the reply to ${mentions[0]}.`
        : `I’ve already handled replies to ${mentions.join(", ")}${
            extra > 0 ? `, and ${extra} more` : ""
          }.`;
  }

  /* -------------------------------------------------
     2) TODAY — MEETINGS THAT MATTER
  ------------------------------------------------- */

  const { data: todaySnap } = await supabase
    .from("calendar_snapshots")
    .select("calendar_insights, day_timeline")
    .eq("user_id", user.id)
    .eq("date", yyyyMmDd)
    .maybeSingle();

  const insights = todaySnap?.calendar_insights ?? {};
  const timeline = (todaySnap?.day_timeline ?? []) as any[];

  const meaningfulMeetings = timeline
    .filter(m => {
      const title = m?.title?.toLowerCase() ?? "";
      if (m?.raw?.isOrganizer === true) return false;
      if (title.includes("lunch")) return false;
      if (title.includes("focus")) return false;
      if (title.includes("hold")) return false;
      return Boolean(m?.raw?.organizer?.emailAddress?.name);
    })
    .slice(0, 2);

  let meetingLine: string | null = null;
  let hasNoisyMeeting = false;

  if (meaningfulMeetings.length > 0) {
    const phrases = meaningfulMeetings.map(m => {
      const organiser = firstName(m.raw.organizer?.emailAddress?.name);
      const title = normaliseTitle(m.title);
      return organiser ? `${title} with ${organiser}` : title;
    });

    meetingLine =
      phrases.length === 1
        ? `You’ve got ${phrases[0]} today.`
        : `You’ve got ${phrases.join(" and ")} today.`;

    hasNoisyMeeting = meaningfulMeetings.some(
      m => Number(m.noiseScore ?? 0) >= 6
    );
  }

  /* -------------------------------------------------
     3) TOMORROW — FACT ONLY
  ------------------------------------------------- */

  let tomorrowLine: string | null = null;

  const { data: tomorrowSnap } = await supabase
    .from("calendar_snapshots")
    .select("day_timeline")
    .eq("user_id", user.id)
    .eq("date", tomorrowStr)
    .maybeSingle();

  const tomorrowTimeline = (tomorrowSnap?.day_timeline ?? []) as any[];

  const firstTomorrow = tomorrowTimeline.find(
    m => m?.raw?.isOrganizer !== true
  );

  if (firstTomorrow) {
    const organiser = firstName(firstTomorrow.raw?.organizer?.emailAddress?.name);
    const time = formatTime(firstTomorrow.start);
    const title = normaliseTitle(firstTomorrow.title);

    if (organiser && time && title) {
      tomorrowLine = `Tomorrow starts with ${title} with ${organiser} at ${time}.`;
    }
  }

  /* -------------------------------------------------
     4) CONTINUITY (RELATIVE MEMORY)
  ------------------------------------------------- */

  const { data: yesterdaySnap } = await supabase
    .from("calendar_snapshots")
    .select("calendar_insights")
    .eq("user_id", user.id)
    .eq("date", yesterdayStr)
    .maybeSingle();

  const diffFromYesterday =
    yesterdaySnap?.calendar_insights?.meetingMinutes != null &&
    insights.meetingMinutes != null
      ? insights.meetingMinutes -
        yesterdaySnap.calendar_insights.meetingMinutes
      : null;

  /* -------------------------------------------------
     5) ARCHETYPE + NARRATIVE ASSEMBLY
  ------------------------------------------------- */

  const archetype = selectArchetype({
    meetingMinutes: insights.meetingMinutes ?? 0,
    workAbility: insights.workAbility ?? 0,
    hasNoisyMeeting,
    diffFromYesterday,
  });

  const parts: string[] = [];

  const { data: cognitive } = await supabase
  .from("cognitive_state")
  .select("instruction")
  .eq("user_id", user.id)
  .order("updated_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (cognitive?.instruction) {
  parts.push(cognitive.instruction);
}

  if (handledLine) parts.push(handledLine);
  if (meetingLine) parts.push(meetingLine);

  switch (archetype) {
    case "clear-runway":
      parts.push(
        "The day has a clear runway — nothing else is pulling on your attention."
      );
      break;

    case "holding-ground":
      parts.push(
        "The meeting load is noticeable, but the day still has shape."
      );
      break;

    case "carrying-load":
      parts.push(
        "Today is carrying a heavier operational load. Focus will come in shorter pockets."
      );
      parts.push(
        "I’m holding follow-ups from this and will bring them back when there’s more space."
      );
      break;

    case "light-day":
      parts.push(
        "Today is lighter than yesterday. There’s nothing you need to respond to right now."
      );
      break;
  }

  if (tomorrowLine) parts.push(tomorrowLine);

  parts.push("Nothing else needs your attention right now.");
  parts.push("I’m fully up to date with your email and calendar.");

  return NextResponse.json({
    narrative: parts.join(" "),
  });
}
