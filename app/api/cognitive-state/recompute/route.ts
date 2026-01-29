// app/api/cognitive-state/recompute/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* -------------------------------------------------------------------------- */
/*  Supabase (service role)                                                    */
/* -------------------------------------------------------------------------- */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* -------------------------------------------------------------------------- */
/*  Static copy (do NOT tune yet)                                              */
/* -------------------------------------------------------------------------- */

const COPY = {
  overloaded: {
    instruction:
      "Do not react to new email. Nothing here requires an immediate decision.",
    relief:
      "Echo has already prepared replies for high-pressure threads.",
  },
  defensive: {
    instruction:
      "Do not expand scope. Resolve one action thread only.",
    relief:
      "Echo is tracking follow-ups and holding draft replies.",
  },
  contained: {
    instruction:
      "You don’t need to scan your inbox. Focus on the task you already chose.",
    relief:
      "Replies are drafted and outstanding threads are stable.",
  },
  clear: {
    instruction:
      "This is a safe window for deep work. No inbox pressure is building.",
    relief:
      "Echo is monitoring incoming load for you.",
  },
} as const;

type CognitiveState = keyof typeof COPY;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function minutesAgo(n: number) {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

/* -------------------------------------------------------------------------- */
/*  POST                                                                      */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id" },
        { status: 400 }
      );
    }

    /* ---------------------------------------------------------------------- */
    /*  1. Calendar snapshot (today)                                           */
    /* ---------------------------------------------------------------------- */

    const { data: calendarRow } = await supabase
      .from("calendar_snapshots")
      .select("*")
      .eq("user_id", user_id)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    const insights =
      calendarRow?.calendarInsights ??
      calendarRow?.calendar_insights ??
      null;

    const workAbility =
      typeof insights?.workAbility === "number"
        ? insights.workAbility
        : null;

    const meetingLoadMinutes =
      typeof insights?.meetingLoadMinutes === "number"
        ? insights.meetingLoadMinutes
        : 0;

    const contextSwitches =
      typeof insights?.contextSwitches === "number"
        ? insights.contextSwitches
        : 0;

    /* ---------------------------------------------------------------------- */
    /*  2. Email pressure                                                      */
    /* ---------------------------------------------------------------------- */

    const { data: emailsRaw } = await supabase
      .from("email_records")
      .select('Category,"Email Status","Date Received"')
      .eq("user_id", user_id);

    const emails = emailsRaw ?? [];

    const unresolved = emails.filter(
      (e) =>
        !e["Email Status"] ||
        e["Email Status"]?.toLowerCase() !== "resolved"
    );

    const getBand = (c: string | null) => {
      const cc = (c ?? "").toLowerCase();
      if (cc.includes("follow")) return "follow_up";
      if (
        cc.includes("info") ||
        cc.includes("promo") ||
        cc.includes("newsletter") ||
        cc === "informational"
      ) {
        return "noise";
      }
      return "action";
    };

    const unresolvedAction = unresolved.filter(
      (e) => getBand(e.Category) === "action"
    ).length;

    const unresolvedFollow = unresolved.filter(
      (e) => getBand(e.Category) === "follow_up"
    ).length;

    const emailsLast60Min = emails.filter(
      (e) =>
        e["Date Received"] &&
        e["Date Received"] >= minutesAgo(60)
    ).length;

    const emailsLast90Min = emails.filter(
      (e) =>
        e["Date Received"] &&
        e["Date Received"] >= minutesAgo(90)
    ).length;

    /* ---------------------------------------------------------------------- */
    /*  3. Relief signals                                                      */
    /* ---------------------------------------------------------------------- */

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: draftsToday } = await supabase
      .from("prepared_email_drafts")
      .select("id")
      .eq("user_id", user_id)
      .eq("active", true)
      .gte("created_at", startOfDay.toISOString());

    const preparedDraftsToday = draftsToday?.length ?? 0;

    const resolvedToday = emails.filter(
      (e) =>
        e["Email Status"]?.toLowerCase() === "resolved" &&
        e["Date Received"] &&
        e["Date Received"] >= startOfDay.toISOString()
    ).length;

    /* ---------------------------------------------------------------------- */
    /*  4. Derived signals                                                     */
    /* ---------------------------------------------------------------------- */

    const inboxSpike =
      emailsLast90Min >= 8 || emailsLast60Min >= 6;

    const actionLoad =
      unresolvedAction >= 6 ||
      unresolvedAction + unresolvedFollow >= 9;

    const calendarHeavy =
      workAbility !== null &&
      (workAbility < 50 ||
        meetingLoadMinutes > 240 ||
        contextSwitches > 10);

    const reliefPresent =
      preparedDraftsToday > 0 || resolvedToday >= 2;

    /* ---------------------------------------------------------------------- */
    /*  5. State machine                                                       */
    /* ---------------------------------------------------------------------- */

    let state: CognitiveState;

    if (calendarHeavy && inboxSpike) {
      state = "overloaded";
    } else if (calendarHeavy || actionLoad) {
      state = "defensive";
    } else if (reliefPresent) {
      state = "contained";
    } else {
      state = "clear";
    }

    /* ---------------------------------------------------------------------- */
    /*  6. Persist                                                            */
    /* ---------------------------------------------------------------------- */

    const drivers = {
      workAbility,
      meetingLoadMinutes,
      contextSwitches,
      unresolvedAction,
      unresolvedFollow,
      emailsLast60Min,
      emailsLast90Min,
      preparedDraftsToday,
      resolvedToday,
    };

    await supabase.from("cognitive_state").insert({
  user_id,
  state,
  drivers,
  instruction: COPY[state].instruction,
  relief_statement: COPY[state].relief,
  confidence: 0.85,
  updated_at: new Date().toISOString(),
});



    /* ---------------------------------------------------------------------- */
    /*  7. Return                                                             */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      state,
      instruction: COPY[state].instruction,
      relief: COPY[state].relief,
      drivers,
    });
  } catch (err) {
    console.error("cognitive-state recompute error:", err);
    return NextResponse.json(
      { error: "Failed to recompute cognitive state" },
      { status: 500 }
    );
  }
}
