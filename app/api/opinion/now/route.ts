import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v
    )
  );
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function getBandForCategory(category: string | null) {
  const c = (category ?? "").toLowerCase().trim();
  if (c.includes("follow")) return "follow_up";
  if (
    c.includes("info") ||
    c.includes("promo") ||
    c.includes("newsletter") ||
    c === "informational"
  )
    return "noise";
  return "action";
}

/* ------------------------------------------------------------------ */
/*  CORE PRESSURE MODEL (simple, tunable, interpretable)               */
/* ------------------------------------------------------------------ */
function computeCPI(input: {
  unresolvedAction: number;
  unresolvedFollow: number;
  emailRate60: number;
  meetingMinutesToday: number;
}) {
  const drivers: string[] = [];

  const backlog = input.unresolvedAction * 6 + input.unresolvedFollow * 2;
  if (backlog > 12) drivers.push("unresolved_backlog");

  const emailSpike = input.emailRate60 * 4;
  if (emailSpike > 12) drivers.push("email_spike");

  const meetings = input.meetingMinutesToday * 0.12;
  if (meetings > 10) drivers.push("calendar_density");

  const cpi = clamp(backlog + emailSpike + meetings, 0, 100);

  return { cpi, drivers };
}

/* ------------------------------------------------------------------ */
/*  DETERMINISTIC OPINION (fallback + baseline)                        */
/* ------------------------------------------------------------------ */
function heuristicOpinion(args: {
  cpi: number;
  drivers: string[];
  unresolvedAction: number;
}) {
  const { cpi, drivers, unresolvedAction } = args;

  if (cpi >= 80) {
    return {
      primary_focus:
        "Reduce pressure immediately: close one action thread before doing anything else.",
      reason: `Cognitive load is high (${cpi}/100) driven by ${drivers.join(
        ", "
      )}. Clearing one obligation will materially lower mental load.`,
      explicit_do_not: [
        "Start new tasks",
        "Check low-priority email",
        "Schedule more meetings",
      ],
      suggested_window: "15–25 minutes",
      confidence: 85,
    };
  }

  if (cpi >= 60) {
    return {
      primary_focus:
        "Stabilise the day: resolve the smallest actionable email, then protect a short focus block.",
      reason: `Pressure is rising (${cpi}/100). You still have control if you remove one obligation.`,
      explicit_do_not: [
        "Context-switch repeatedly",
        "Let inbox recency dictate priorities",
      ],
      suggested_window: "25–45 minutes",
      confidence: 82,
    };
  }

  if (cpi >= 40) {
    return {
      primary_focus:
        "Use the calm window to make progress on one meaningful task.",
      reason: `Cognitive pressure is moderate (${cpi}/100). This is the best time to convert clarity into progress.`,
      explicit_do_not: [
        "Fill the gap with busywork",
        "Start parallel tasks",
      ],
      suggested_window: "45–60 minutes",
      confidence: 78,
    };
  }

  return {
    primary_focus:
      "Exploit low pressure: plan or execute deep work before the day fills up.",
    reason: `Mental load is low (${cpi}/100). This is borrowed time — use it deliberately.`,
    explicit_do_not: [
      "Drift into reactive email checking",
      "Add unnecessary commitments",
    ],
    suggested_window: "60–90 minutes",
    confidence: 75,
  };
}

/* ------------------------------------------------------------------ */
/*  ROUTE                                                             */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!isUuid(user_id)) {
      return NextResponse.json(
        { error: "Invalid or missing user_id" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    /* ---------------- Email signals ---------------- */
    const { data: emailsRaw, error: emailsErr } = await supabase
  .from("email_records")
  .select(
    `Category,
     "Email Status",
     "Date Received",
     Summary,
     urgency,
     importance`
  )
  .eq("user_id", user_id);

if (emailsErr) {
  console.error("email_records query error:", emailsErr);
}

const emails = emailsRaw ?? [];

    const unresolved = emails.filter(
      (e) => !e["Email Status"] || e["Email Status"] !== "Resolved"
    );

    const unresolvedAction = unresolved.filter(
      (e) => getBandForCategory(e.Category) === "action"
    ).length;

    const unresolvedFollow = unresolved.filter(
      (e) => getBandForCategory(e.Category) === "follow_up"
    ).length;

    const since60 = new Date(Date.now() - 60 * 60 * 1000);
    const emailRate60 = emails.filter((e) => {
  const d = e["Date Received"];
  if (!d) return false;
  return new Date(d).getTime() >= since60.getTime();
}).length;

    /* ---------------- Calendar signals ---------------- */
    const today = new Date().toISOString().slice(0, 10);

    const { data: cal } = await supabase
      .from("calendar_snapshots")
      .select("calendar_insights")
      .eq("user_id", user_id)
      .eq("date", today)
      .single();

    const meetingMinutesToday =
      cal?.calendar_insights?.meetingLoadMinutes ?? 0;

    /* ---------------- Compute cognition ---------------- */
    const { cpi, drivers } = computeCPI({
      unresolvedAction,
      unresolvedFollow,
      emailRate60,
      meetingMinutesToday,
    });

    const opinion = heuristicOpinion({
      cpi,
      drivers,
      unresolvedAction,
    });

    /* ---------------- Persist cognitive state ---------------- */
    await supabase.from("cognitive_state").upsert({
      user_id,
      pressure_index: cpi,
      drivers,
      primary_focus: opinion.primary_focus,
      reason: opinion.reason,
      explicit_do_not: opinion.explicit_do_not,
      suggested_window: opinion.suggested_window,
      confidence: opinion.confidence,
      computed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ...opinion,
      meta: {
        cpi,
        drivers,
        unresolved_action: unresolvedAction,
        unresolved_follow_up: unresolvedFollow,
        emails_last_60m: emailRate60,
      },
    });
  } catch (err: any) {
    console.error("[opinion/now]", err);
    return NextResponse.json(
      { error: "Failed to compute cognitive state" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: true, message: "POST { user_id } to compute cognitive opinion" },
    { status: 200 }
  );
}
