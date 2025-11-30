import { getUser } from "@/lib/getUser";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardSubscription from "./dashboard-subscription";
import { Zap, Mail, Bell } from "lucide-react";

// -------- TYPES --------
type DailySummaryRow = {
  Date: string;
  Mode?: string | null;
  reflection?: string | null;
  wins?: any;
  themes?: any;
  metrics?: any;
};

type EmailRecordRow = {
  Category: string | null;
  "Email Status"?: string | null;
  "Date Received"?: string | null;
  Subject?: string | null;
  From?: string | null;
  Summary?: string | null;
};

// Calendar snapshot (loosely typed to stay robust)
type CalendarSnapshotRow = {
  date: string;
  calendarInsights?: any | null;
  calendar_insights?: any | null;
};

// EchoJar daily row (loosely typed)
type EchoJarRow = {
  id: string;
  date: string;
  behavioural_summary?: string | null;
  focus_score?: number | null;
  strain_score?: number | null;
  momentum_score?: number | null;
  consistency_score?: number | null;
  predictive_signals?: any;
  raw_email?: any;
  raw_calendar?: any;
  tags?: any;
};

// -------- SMALL HELPERS --------

function parseJsonArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((x) => typeof x === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((x) => typeof x === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}

function parseMetrics(value: any): {
  emailsReceived?: number | null;
  emailsSent?: number | null;
  actionEmailsResolved?: number | null;
  meetings?: number | null;
} {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return {};
    }
  }
  return {};
}

function formatTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Same story logic as CalendarClient, so the language stays consistent
function renderTodayWorkStory(workAbility: number) {
  if (workAbility > 75)
    return "Today is steady and spacious, with healthy pockets of clarity to lean into.";

  if (workAbility > 60)
    return "The morning is a little fractured but the afternoon clears; focus remains workable.";

  if (workAbility > 45)
    return "The day is mixed — meetings and gaps are interleaved, so focus will need protection.";

  return "Today is structurally noisy with limited uninterrupted time — small, deliberate wins matter most.";
}

// Echo persona helper (lightweight version of the EchoJar persona logic)
function derivePersonaFromScores(
  focus: number | null | undefined,
  strain: number | null | undefined,
  momentum: number | null | undefined
) {
  const f = focus ?? 0;
  const s = strain ?? 0;
  const m = momentum ?? 0;

  if (f >= 7 && s <= 4) {
    return {
      id: "deep-operator",
      label: "Deep Operator",
      headline: "Your day is built for deep work.",
      summary:
        "Focus windows stay clean and meetings aren’t overwhelming. Echo sees a pattern of deliberate work and low fragmentation.",
    };
  }

  if (s >= 7 && f <= 5) {
    return {
      id: "load-bearer",
      label: "Load Bearer",
      headline: "You’re carrying a heavy operational load.",
      summary:
        "Calendar and email drag are eating into focus. Echo flags this pattern as structurally noisy and energy intensive.",
    };
  }

  if (m >= 6 && f >= 5) {
    return {
      id: "builder",
      label: "Momentum Builder",
      headline: "You’re steadily compounding progress.",
      summary:
        "Days aren’t perfectly clean, but important work keeps moving forward. Echo sees momentum building across your week.",
    };
  }

  return {
    id: "recalibrating",
    label: "Recalibrating",
    headline: "Today’s pattern is still settling.",
    summary:
      "Signals are mixed — some focus, some drag. Echo treats this as a calibration day rather than a strong pattern.",
  };
}

// Very defensive JSON parser for EchoJar internals
function parseJson<T = any>(value: any, fallback: T): T {
  if (value == null) return fallback;
  if (Array.isArray(value) || typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// Same time-saved estimation as EchoJar, trimmed for safety
function computeTimeSaved(entry: EchoJarRow | null) {
  if (!entry) {
    return { total: 0, breakdown: null as any };
  }

  const rawEmail = parseJson<any[]>(entry.raw_email, []);
  const rawCalendar = parseJson<any>(entry.raw_calendar, {});

  // 1) Action-like emails → 45s each
  const actionEmails = rawEmail.filter((e) => {
    const category = (e?.Category || "").toLowerCase();
    const theme = (e?.theme || "").toLowerCase();
    return (
      category === "action" ||
      category === "urgent" ||
      theme === "action" ||
      theme === "followup"
    );
  }).length;
  const emailMinutes = (actionEmails * 45) / 60;

  // 2) Meeting load → assume 20% protected / avoided / shortened
  const today = rawCalendar?.today || {};
  const calInsights = today?.calendar_insights || today?.calendarInsights || {};
  const meetingMinutes = Number(calInsights.meetingMinutes ?? 0);
  const meetingSaved = meetingMinutes * 0.2;

  // 3) High-energy deep blocks from predictive_signals.energyMap → 10 min each
  const signals = parseJson<any>(entry.predictive_signals, {});
  const energyMap = signals.energyMap || {};
  const deepBlocks = Object.values<string | unknown>(energyMap).filter((v) =>
    typeof v === "string"
      ? v.toLowerCase().startsWith("high") &&
        !v.toLowerCase().includes("meeting")
      : false
  ).length;
  const deepMinutes = deepBlocks * 10;

  const total = Math.round(emailMinutes + meetingSaved + deepMinutes);

  return {
    total,
    breakdown: {
      actionEmails,
      emailMinutes: Math.round(emailMinutes),
      meetingMinutes,
      meetingSaved: Math.round(meetingSaved),
      deepBlocks,
      deepMinutes,
    },
  };
}

// -------- MAIN PAGE --------

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-slate-200/90">
          Please{" "}
          <a className="text-sky-300 underline" href="/auth/sign-in">
            sign in
          </a>{" "}
          to access your Echo dashboard.
        </p>
      </div>
    );
  }

  const cookieStore = cookies();

  const supabase = createServerComponentClient(
    { cookies: () => cookieStore },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    }
  );

  // -------- SUMMARY STATUS --------
  const { data: summaryRowsRaw } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("Date", { ascending: false });

  const summaryRows = (summaryRowsRaw ?? []) as DailySummaryRow[];

  const todayStr = new Date().toISOString().slice(0, 10);

  const todayAM = summaryRows.find(
    (r) =>
      r.Date.startsWith(todayStr) &&
      (r.Mode?.toLowerCase() === "am" || r.Mode?.toLowerCase() === "morning")
  );

  const todayPM = summaryRows.find(
    (r) =>
      r.Date.startsWith(todayStr) &&
      (r.Mode?.toLowerCase() === "pm" || r.Mode?.toLowerCase() === "evening")
  );

  const nextWindow = new Date().getHours() < 12 ? "8:00 AM" : "5:00 PM";

  const latestSummary = summaryRows[0];
  const latestThemes = latestSummary ? parseJsonArray(latestSummary.themes) : [];
  const latestWins = latestSummary ? parseJsonArray(latestSummary.wins) : [];
  const latestMetrics = latestSummary
    ? parseMetrics(latestSummary.metrics)
    : {};

  // -------- CALENDAR SNAPSHOT (for Today's Work Story card) --------
  const { data: calendarRowsRaw } = await supabase
    .from("calendar_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(2);

  const calendarRows = (calendarRowsRaw ?? []) as CalendarSnapshotRow[];
  const todayCalendar = calendarRows[0] ?? null;

  const calendarInsights =
    todayCalendar?.calendarInsights ??
    todayCalendar?.calendar_insights ??
    null;

  const workAbilityToday: number | null =
    calendarInsights?.workAbility ?? null;

  const deepWorkWindows =
    calendarInsights?.deepWorkWindows && Array.isArray(calendarInsights.deepWorkWindows)
      ? calendarInsights.deepWorkWindows
      : [];

  const primaryDeepStart =
    deepWorkWindows.length > 0 && deepWorkWindows[0]?.start
      ? formatTime(deepWorkWindows[0].start)
      : null;

  const todayWorkStory =
    typeof workAbilityToday === "number"
      ? renderTodayWorkStory(workAbilityToday)
      : null;

  // -------- ECHOJAR SNAPSHOT (for Echo Signals card) --------
  const { data: echoRowsRaw } = await supabase
    .from("echojar_daily")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1);

  const latestEcho: EchoJarRow | null =
    (echoRowsRaw?.[0] as EchoJarRow | undefined) ?? null;

  const focusScore = latestEcho?.focus_score ?? null;
  const strainScore = latestEcho?.strain_score ?? null;
  const momentumScore = latestEcho?.momentum_score ?? null;
  const consistencyScore = latestEcho?.consistency_score ?? null;

  const echoPersona = latestEcho
    ? derivePersonaFromScores(focusScore, strainScore, momentumScore)
    : null;

  const echoTimeSaved = computeTimeSaved(latestEcho);

  // -------- EMAIL BANDS --------
  const { data: emailsRaw } = await supabase
    .from("email_records")
    .select('Category,"Email Status","Date Received",Subject,From,Summary')
    .eq("user_id", user.id);

  const emails = (emailsRaw ?? []) as EmailRecordRow[];

  const unresolvedEmails = emails.filter(
    (e) => e["Email Status"] !== "Resolved"
  );

  const getBand = (c: string | null) => {
    if (!c) return "action";
    const cc = c.toLowerCase();
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

  const unresolvedAction = unresolvedEmails.filter(
    (e) => getBand(e.Category) === "action"
  );
  const unresolvedFollow = unresolvedEmails.filter(
    (e) => getBand(e.Category) === "follow_up"
  );
  const unresolvedNoise = unresolvedEmails.filter(
    (e) => getBand(e.Category) === "noise"
  );

  const outstandingActionCount = unresolvedAction.length;
  const followCount = unresolvedFollow.length;
  const noiseCount = unresolvedNoise.length;

  const keyEmail =
    unresolvedAction
      .filter((e) => !!e["Date Received"])
      .slice()
      .sort(
        (a, b) =>
          new Date(b["Date Received"] as string).getTime() -
          new Date(a["Date Received"] as string).getTime()
      )[0] ?? null;

  const isConnected = emails.length > 0;

  // -------- RENDER --------
  return (
    <>
      <DashboardSubscription />

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Eyebrow + hero */}
        <div className="space-y-4 pt-6">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/70">
            ECHO · DASHBOARD
          </p>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3 max-w-xl translate-y-[6px]">
              <h1
                className="
                text-white text-3xl sm:text-4xl lg:text-[2.25rem]
                font-semibold leading-tight
                drop-shadow-[0_0_16px_rgba(0,0,0,0.45)]
              "
              >
                Quiet tools for{" "}
                <span className="bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)] bg-clip-text text-transparent">
                  louder thinking.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed">
                Your control surface for summaries, email intelligence, and daily
                signal optimisation.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div
                className="
                flex items-center gap-2
                rounded-full
                border border-white/20
                bg-white/[0.06]
                px-3 py-1.5
                text-[11px] sm:text-xs
                font-medium text-slate-200
                backdrop-blur-xl
              "
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected
                      ? "bg-gradient-to-r from-sky-400 to-fuchsia-400 shadow-[0_0_8px_rgba(168,85,247,0.55)]"
                      : "bg-slate-500"
                  }`}
                />
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
              </div>

              {outstandingActionCount > 0 && (
                <div
                  className="
                  inline-flex items-center gap-1
                  rounded-full
                  border border-fuchsia-400/30
                  bg-fuchsia-500/10
                  px-3 py-1
                  text-[11px]
                  text-fuchsia-100
                "
                >
                  <Zap size={12} className="opacity-80" />
                  <span>{outstandingActionCount} action threads outstanding</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN GRID – Option A (left intelligence stack, right email engine) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* LEFT COLUMN – DAILY INTELLIGENCE STACK */}
          <div className="space-y-6">
            {/* SUMMARY CARD (unchanged) */}
            <div
              className="
                relative overflow-hidden rounded-2xl backdrop-blur-2xl
                bg-white/[0.09] border border-white/14 shadow-[0_20px_70px_rgba(0,0,0,0.58)]
                hover:shadow-[0_24px_90px_rgba(0,0,0,0.7)] transition-all p-6 sm:p-7
                bg-[linear-gradient(to_bottom,rgba(255,255,255,0.07),rgba(255,255,255,0.02))]
              "
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(255,255,255,0.04)]" />

              <div className="relative space-y-4">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
                  SUMMARY · ECHO AM / PM
                </p>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-semibold text-white">
                    Today&apos;s Summary
                  </h2>
                  {todayAM || todayPM ? (
                    <p className="text-sm text-slate-200/90 leading-relaxed">
                      {todayPM
                        ? "Your PM reflection is ready."
                        : "Your AM reflection is ready."}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-200/90">
                      Echo will generate a calm AM/PM digest once Microsoft 365 is
                      connected.
                    </p>
                  )}
                </div>

                <div className="mt-3 grid gap-3 text-sm text-slate-200/95">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300/90">Status</span>
                    <span className="rounded-full border border-slate-500/40 bg-slate-900/40 px-2.5 py-1 text-[11px] uppercase tracking-[0.13em]">
                      {todayAM || todayPM ? "Generated" : "Waiting"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-300/80">Next window</span>
                    <span className="text-slate-100/95">{nextWindow}</span>
                  </div>

                  {latestThemes.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-[11px] text-slate-400/90">
                        Today’s themes
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {latestThemes.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="
                              rounded-full border border-sky-400/60
                              bg-sky-500/10 px-2.5 py-0.5
                              text-[11px] text-sky-100
                            "
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestWins.length > 0 && (
                    <p className="text-[11px] text-slate-400/90 pt-1">
                      Echo’s highlight:{" "}
                      <span className="text-slate-100">
                        {latestWins[0]}
                      </span>
                    </p>
                  )}

                  {Object.keys(latestMetrics).length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-slate-200/90">
                      {latestMetrics.emailsReceived != null && (
                        <span className="rounded-full border border-slate-600/70 bg-slate-950/70 px-2.5 py-0.5">
                          {latestMetrics.emailsReceived} emails
                        </span>
                      )}
                      {latestMetrics.emailsSent != null && (
                        <span className="rounded-full border border-slate-600/70 bg-slate-950/70 px-2.5 py-0.5">
                          {latestMetrics.emailsSent} sent
                        </span>
                      )}
                      {latestMetrics.meetings != null && (
                        <span className="rounded-full border border-slate-600/70 bg-slate-950/70 px-2.5 py-0.5">
                          {latestMetrics.meetings} meetings
                        </span>
                      )}
                    </div>
                  )}

                  <p className="pt-1 text-[11px] text-slate-400/85">
                    Echo generates summaries twice a day using your real email
                    activity.
                  </p>
                </div>
              </div>
            </div>

            {/* CALENDAR · TODAY’S WORK STORY (CALM CARD) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/75 shadow-[0_0_40px_rgba(15,23,42,0.7)] px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
                CALENDAR · TODAY&apos;S WORK STORY
              </p>

              <p className="mt-3 text-sm text-slate-200/90 leading-relaxed">
                {todayWorkStory
                  ? todayWorkStory
                  : "Echo will start shaping a work story once it has a few days of calendar insight to lean on."}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {primaryDeepStart
                  ? `Best deep-work window starts around ${primaryDeepStart}.`
                  : "Protect at least one 60–90 minute block for uninterrupted work."}
              </p>
            </div>

            {/* ECHO · DAILY SIGNALS (GOLD, ULTRA-CALM) */}
            <div className="rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 shadow-[0_0_55px_rgba(245,158,11,0.35)] px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-amber-200/90 uppercase">
                ECHO · DAILY SIGNALS
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 max-w-xs">
                  <p className="text-sm font-semibold text-amber-50">
                    {echoPersona
                      ? echoPersona.headline
                      : "Echo is still forming your pattern."}
                  </p>
                  <p className="text-xs text-amber-100/80 leading-relaxed">
                    {echoPersona
                      ? echoPersona.summary
                      : "As more days accumulate, Echo will learn how your focus, load and momentum tend to behave."}
                  </p>
                </div>

                {echoPersona && (
                  <span className="inline-flex items-center rounded-full border border-amber-400/70 bg-amber-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100/90">
                    {echoPersona.label}
                  </span>
                )}
              </div>

              {/* Ultra-calm metrics row */}
              <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-amber-100/90">
                <SignalChip label="Focus" value={focusScore} />
                <SignalChip label="Load" value={strainScore} />
                <SignalChip label="Momentum" value={momentumScore} />
                <SignalChip label="Consistency" value={consistencyScore} />
              </div>

              <p className="mt-4 text-[11px] text-amber-100/80">
                {echoTimeSaved.total > 0
                  ? `Echo estimates it defended around ${echoTimeSaved.total} minutes of your time today.`
                  : "Once Echo has enough signal, it will estimate how many minutes of noise it’s helping you defend each day."}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN – EMAIL INTELLIGENCE (UNCHANGED) */}
          <div
            className="
              relative overflow-hidden rounded-2xl backdrop-blur-2xl
              bg-white/[0.09] border border-white/14 shadow-[0_20px_70px_rgba(0,0,0,0.58)]
              hover:shadow-[0_24px_90px_rgba(0,0,0,0.7)] transition-all p-6 sm:p-7
              bg-[linear-gradient(to_bottom,rgba(255,255,255,0.07),rgba(255,255,255,0.02))]
            "
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(255,255,255,0.04)]" />

            <div className="relative space-y-4">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
                EMAIL · SIGNAL BANDS
              </p>

              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Email Intelligence
              </h2>

              <p className="text-sm text-slate-200/90">
                Echo classifies messages into action, follow-up, and noise — only
                counting threads that still need attention.
              </p>

              <div className="mt-4 grid gap-2 text-sm text-slate-200/95">
                {/* ACTION */}
                <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(244,114,182,0.25)]">
                  <span className="flex items-center gap-1">
                    <Zap size={14} className="text-fuchsia-400 opacity-80" /> Action
                  </span>
                  <span className="text-slate-400/90 text-xs">
                    {outstandingActionCount} threads outstanding
                  </span>
                </div>

                {/* FOLLOW UP */}
                <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(129,140,248,0.26)]">
                  <span className="flex items-center gap-1">
                    <Mail size={14} className="text-violet-300 opacity-80" />{" "}
                    Follow-up
                  </span>
                  <span className="text-slate-400/90 text-xs">
                    {followCount} threads tracking
                  </span>
                </div>

                {/* NOISE */}
                <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(56,189,248,0.28)]">
                  <span className="flex items-center gap-1">
                    <Bell size={14} className="text-sky-300 opacity-80" /> Noise
                  </span>
                  <span className="text-slate-400/90 text-xs">
                    {noiseCount} threads muted
                  </span>
                </div>
              </div>

              {/* KEY EMAIL – unchanged behaviour */}
              <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs sm:text-[13px] text-slate-200/95">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400/85 mb-1.5">
                  Today&apos;s key email
                </p>

                {keyEmail ? (
                  <>
                    <p className="font-medium line-clamp-2 text-slate-50">
                      {keyEmail.Subject || "Untitled thread"}
                    </p>

                    <p className="mt-0.5 text-slate-400/90 line-clamp-1">
                      {keyEmail.From}
                    </p>

                    {keyEmail.Summary && (
                      <p className="mt-1 text-slate-300/90 line-clamp-2">
                        {keyEmail.Summary}
                      </p>
                    )}

                    <p className="mt-2 text-[10px] text-slate-500/90">
                      Pulled from your Action band · unresolved only.
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400/90">
                    Once Echo has outstanding action threads, your highest-signal
                    one will appear here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 text-center text-[11px] text-slate-400/80">
          Designed by Orrya · The Quiet Intelligence Layer.
        </div>
      </div>
    </>
  );
}

// Tiny helper component for the ultra-calm Echo signals row
function SignalChip({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const display = value == null ? "—" : `${value}/10`;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500/10 px-2.5 py-0.5">
      <span className="text-[10px] uppercase tracking-[0.18em] text-amber-200/90">
        {label}
      </span>
      <span className="text-[11px] font-semibold text-amber-50">{display}</span>
    </span>
  );
}
