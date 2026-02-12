import { getUser } from "@/lib/getUser";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardSubscription from "./dashboard-subscription";
import { Zap, Mail, Bell } from "lucide-react";
import { PersonaCard, Persona } from "@/components/echojar/PersonaCard";

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

type CalendarInsights = {
  workAbility?: number | null;
};

type CalendarSnapshotRow = {
  date: string;
  calendarInsights?: CalendarInsights | null;
  calendar_insights?: CalendarInsights | null;
};

type EchoJarRow = {
  date: string;
  persona_label?: string | null;
  persona_headline?: string | null;
  persona_summary?: string | null;
};

type CognitiveStateRow = {
  state: "clear" | "contained" | "defensive" | "overloaded";
  instruction: string;
  relief_statement: string;
  confidence?: number | null;
  drivers?: Record<string, any> | null;
  updated_at?: string;
};

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

/* ---------------------------------------------------------
   WORK STORY HELPER (same logic as calendar page)
--------------------------------------------------------- */
function renderTodayWorkStory(workAbility: number | null) {
  const w = workAbility ?? 0;

  if (w > 75)
    return "Today is steady and spacious, with healthy pockets of clarity to lean into.";
  if (w > 60)
    return "The morning is a little fractured but the afternoon clears; focus remains workable.";
  if (w > 45)
    return "The day is mixed — meetings and gaps are interleaved, so focus will need protection.";
  return "Today is structurally noisy with limited uninterrupted time — small, deliberate wins matter most.";
}

function getTomorrowOutlookLabel(workAbility: number | null) {
  if (workAbility == null) return "Outlook still forming";
  if (workAbility >= 75) return "⚡ High clarity day";
  if (workAbility >= 55) return "Balanced, workable load";
  if (workAbility >= 40) return "Heavy but manageable";
  return "Structurally noisy day";
}

/* =========================================================
   MAIN DASHBOARD PAGE
========================================================= */

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

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  /* -------------------------------------------------------
     SUMMARY STATUS
  ------------------------------------------------------- */
  const { data: summaryRowsRaw } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("Date", { ascending: false });

  const summaryRows = (summaryRowsRaw ?? []) as DailySummaryRow[];

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

  const latestSummary = summaryRows[0];
  const latestMetrics = latestSummary ? parseMetrics(latestSummary.metrics) : {};
  const latestReflection = (latestSummary?.reflection || "").trim();

  // Short preview for calm UI (Option A)
  const maxSummaryChars = 260;
  const summaryIsLong = latestReflection.length > maxSummaryChars;
  const summaryPreview = summaryIsLong
    ? latestReflection.slice(0, maxSummaryChars).trimEnd() + "…"
    : latestReflection;

  /* -------------------------------------------------------
     EMAIL BANDS
  ------------------------------------------------------- */
  const { data: emailsRaw } = await supabase
    .from("email_records")
    .select('Category,"Email Status","Date Received",Subject,From,Summary')
    .eq("user_id", user.id);

  const emails = (emailsRaw ?? []) as EmailRecordRow[];

  const unresolvedEmails = emails.filter(
  (e) =>
    !e["Email Status"] ||
    e["Email Status"].toLowerCase() !== "resolved"
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

  const scoreEmail = (e: any) => {
  const urgencyScore =
    e.urgency === "high" ? 3 : e.urgency === "medium" ? 2 : 1;

  const relationshipScore =
    e.relationshipImpact === "high"
      ? 3
      : e.relationshipImpact === "medium"
      ? 2
      : 1;

  const recencyScore = e["Date Received"]
    ? Math.max(
        0,
        5 -
          Math.floor(
            (Date.now() - new Date(e["Date Received"]).getTime()) /
              (1000 * 60 * 60 * 24)
          )
      )
    : 0;

  return urgencyScore * relationshipScore + recencyScore;
};

const unresolvedActionToday = unresolvedAction.filter(
  (e) => e["Date Received"]?.startsWith(todayStr)
);

const keyEmail =
  unresolvedActionToday
    .slice()
    .sort((a: any, b: any) => scoreEmail(b) - scoreEmail(a))[0] ?? null;

  const isConnected = emails.length > 0;

  /* -------------------------------------------------------
     PREPARED EMAIL DRAFTS (for dashboard surfacing)
  ------------------------------------------------------- */
  const { count: preparedDraftCountToday } = await supabase
    .from("prepared_email_drafts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("active", true)
    .gte("created_at", `${todayStr}T00:00:00.000Z`)
    .lt("created_at", `${tomorrowStr}T00:00:00.000Z`);

  /* -------------------------------------------------------
     CALENDAR SNAPSHOTS (for Work Story + Tomorrow Outlook)
  ------------------------------------------------------- */
  const { data: calendarRowsRaw } = await supabase
    .from("calendar_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(6);

  const calendarRows = (calendarRowsRaw ?? []) as CalendarSnapshotRow[];

  const todaySnapshot = calendarRows.find((r) => r.date?.startsWith(todayStr));
  const tomorrowSnapshot = calendarRows.find((r) =>
    r.date?.startsWith(tomorrowStr)
  );

  const todayInsights =
    todaySnapshot?.calendarInsights ?? todaySnapshot?.calendar_insights ?? null;
  const todayWorkAbility =
    typeof todayInsights?.workAbility === "number" ? todayInsights.workAbility : null;

  const tomorrowInsights =
    tomorrowSnapshot?.calendarInsights ??
    tomorrowSnapshot?.calendar_insights ??
    null;
  const tomorrowWorkAbility =
    typeof tomorrowInsights?.workAbility === "number"
      ? tomorrowInsights.workAbility
      : null;

  /* -------------------------------------------------------
     ECHO OPINION (Cognitive State)
  ------------------------------------------------------- */
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/cognitive-state/recompute`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: user.id }),
});
  
  const { data: cognitiveRow } = await supabase
  .from("cognitive_state")
  .select(`
    state,
    drivers,
    instruction,
    relief_statement,
    confidence,
    updated_at
  `)
  .eq("user_id", user.id)
  .order("updated_at", { ascending: false })
  .limit(1)
  .maybeSingle();

  const opinion = (cognitiveRow as CognitiveStateRow | null) ?? null;

  /* -------------------------------------------------------
     ECHOJAR — PERSONA + PREVIEW
  ------------------------------------------------------- */
  const { data: echoJarRowsRaw } = await supabase
    .from("echojar_daily")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1);

  const echoJarRow = (echoJarRowsRaw ?? [])[0] as EchoJarRow | undefined;

  const persona: Persona =
    echoJarRow && echoJarRow.persona_label
      ? {
          label: echoJarRow.persona_label,
          headline:
            echoJarRow.persona_headline || "Your day is built for deliberate work.",
          summary:
            echoJarRow.persona_summary ||
            "Echo sees a pattern of deliberate pacing and helpful meeting structure.",
        }
      : {
          label: "Quiet Operator",
          headline: "Your day is built for deep, deliberate work.",
          summary:
            "Echo sees a calm rhythm with manageable load and enough space for meaningful progress.",
        };

  // Small static preview line (CEO point D – keeps UI calm)
  const echoJarPreviewText =
    "EchoJar is watching today’s themes across communication, follow-up load, and context switching.";

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  const dateLabel = new Date(todayStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const loadLabel =
    (todayWorkAbility ?? 0) >= 80
      ? "Light load"
      : (todayWorkAbility ?? 0) >= 65
      ? "Comfortable"
      : (todayWorkAbility ?? 0) >= 50
      ? "Manageable"
      : "Heavy load";

  const tomorrowOutlookLabel = getTomorrowOutlookLabel(tomorrowWorkAbility);
  const suggestionContext = [
    outstandingActionCount > 0
      ? `${outstandingActionCount} action thread${outstandingActionCount === 1 ? "" : "s"} need attention`
      : "No outstanding action threads",
    preparedDraftCountToday && preparedDraftCountToday > 0
      ? `Echo prepared ${preparedDraftCountToday} email${preparedDraftCountToday === 1 ? "" : "s"} today`
      : "No new prepared drafts today",
    typeof todayWorkAbility === "number"
      ? `Focus capacity ${todayWorkAbility}%`
      : "Focus capacity still forming",
  ].join(" · ");

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
                Your control surface for summaries, calendar intelligence, email
                bands, and daily signal optimisation.
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

              {/* Tomorrow outlook badge (CEO point C) */}
              <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] text-sky-100">
                <span className="uppercase tracking-[0.18em] text-sky-300/90">
                  Tomorrow
                </span>
                <span className="font-medium">
                  {tomorrowOutlookLabel}
                  {typeof tomorrowWorkAbility === "number"
                    ? ` (${tomorrowWorkAbility}% focus capacity)`
                    : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)]">
          {/* LEFT STACK --------------------------------------------------- */}
          <div className="flex h-full flex-col gap-6">
            {/* 1) ECHO SUGGESTS */}
            <div
  className="
    relative overflow-hidden rounded-2xl backdrop-blur-2xl
    bg-fuchsia-500/10 border border-fuchsia-400/30
    shadow-[0_20px_70px_rgba(0,0,0,0.55)]
    p-6 sm:p-7
  "
>
  <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(255,255,255,0.05)]" />

  <div className="relative space-y-3">
    <p className="text-[11px] font-semibold tracking-[0.22em] text-fuchsia-200 uppercase">
      Echo suggests
    </p>

    {opinion ? (
      <>
        <h3 className="text-lg sm:text-xl font-semibold text-white capitalize">
          {opinion.state.replace("_", " ")}
        </h3>

        <p className="text-sm text-slate-200/95 leading-relaxed">
          {opinion.instruction}
        </p>

        <p className="text-sm text-slate-300/90 leading-relaxed">
          {opinion.relief_statement}
        </p>
        <p className="text-[11px] text-fuchsia-100/85">
          {suggestionContext}
        </p>

        {typeof opinion.confidence === "number" && (
          <p className="mt-2 text-[11px] text-slate-400">
            Confidence · {Math.round(opinion.confidence * 100)}%
          </p>
        )}
      </>
    ) : (
      <p className="text-sm text-slate-400">
        Echo hasn’t assessed the current load yet.
      </p>
    )}
  </div>
</div>

            {/* 2) PREPARED BY ECHO (today only) */}
            <div
              className="
                relative overflow-hidden rounded-2xl backdrop-blur-2xl
                bg-emerald-500/10 border border-emerald-400/30
                shadow-[0_20px_70px_rgba(0,0,0,0.55)]
                p-5 sm:p-6
              "
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(255,255,255,0.05)]" />

              <div className="relative space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-200 uppercase">
                  Prepared by Echo
                </p>

                <p className="text-sm text-slate-200/95">
                  Echo prepared{" "}
                  <span className="font-semibold text-white">
                    {preparedDraftCountToday ?? 0}
                  </span>{" "}
                  email{(preparedDraftCountToday ?? 0) === 1 ? "" : "s"} for you
                  today.
                </p>
              </div>
            </div>

            {/* 3) SUMMARY CARD */}
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
                <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
                  Summary · Echo AM / PM
                </p>
                <p className="text-[11px] text-slate-400">
                  Powered by your real activity across email, meetings, and tasks.
                </p>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-semibold text-white">
                    Today&apos;s Summary
                  </h2>

                  {latestReflection ? (
                    <p className="text-sm text-slate-200/95 leading-relaxed">
                      {summaryPreview}
                      {summaryIsLong && (
                        <>
                          {" "}
                          <a
                            href="/summaries"
                            className="text-sky-300 underline underline-offset-2"
                          >
                            View full summary
                          </a>
                        </>
                      )}
                    </p>
                  ) : todayAM || todayPM ? (
                    <p className="text-sm text-slate-200/90 leading-relaxed">
                      Your latest reflection is ready in the Summaries view.
                    </p>
                  ) : (
                    <p className="text-sm text-slate-200/90">
                      Echo will generate a calm AM/PM digest once Microsoft 365 is
                      connected.
                    </p>
                  )}
                </div>

                <div className="mt-3 grid gap-3 text-sm text-slate-200/95">
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

            {/* 4) PERSONA (gold EchoJar card) */}
            <PersonaCard persona={persona} />
          </div>

          {/* RIGHT COLUMN -------------------------------------------------- */}
          <div className="flex h-full flex-col gap-6">
            {/* EMAIL CARD (unchanged, same as your original) */}
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
                <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
                  Email · Signal bands
                </p>
                <p className="text-[11px] text-slate-400">
                  Powered by Echo’s live classification of your inbox.
                </p>

                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  Email Intelligence
                </h2>

                <p className="text-sm text-slate-200/90">
                  Echo classifies messages into action, follow-up, and noise —
                  only counting threads that still need attention.
                </p>

                <div className="mt-4 grid gap-2 text-sm text-slate-200/95">
                  <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(244,114,182,0.25)]">
                    <span className="flex items-center gap-1">
                      <Zap size={14} className="text-fuchsia-400 opacity-80" />{" "}
                      Action
                    </span>
                    <span className="text-slate-400/90 text-xs">
                      {outstandingActionCount} threads outstanding
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(129,140,248,0.26)]">
                    <span className="flex items-center gap-1">
                      <Mail size={14} className="text-violet-300 opacity-80" />{" "}
                      Follow-up
                    </span>
                    <span className="text-slate-400/90 text-xs">
                      {followCount} threads tracking
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(56,189,248,0.28)]">
                    <span className="flex items-center gap-1">
                      <Bell size={14} className="text-sky-300 opacity-80" /> Noise
                    </span>
                    <span className="text-slate-400/90 text-xs">
                      {noiseCount} threads muted
                    </span>
                  </div>
                </div>

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
                        Pulled from your Action band ? unresolved today only.
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-400/90">
                      No action emails were classified for today yet.
                    </p>
                  )}
                </div>
              </div>
            </div>



            {/* TODAY'S WORK STORY (moved here, unchanged) */}
            <div
              className="
                relative overflow-hidden rounded-2xl backdrop-blur-2xl
                bg-white/[0.09] border border-white/14 shadow-[0_20px_70px_rgba(0,0,0,0.58)]
                hover:shadow-[0_24px_90px_rgba(0,0,0,0.7)] transition-all p-6 sm:p-7
                bg-[linear-gradient(to_bottom,rgba(255,255,255,0.07),rgba(255,255,255,0.02))]
              "
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(255,255,255,0.04)]" />

              <div className="relative space-y-3">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
                  Calendar · Today’s work story
                </p>
                <p className="text-[11px] text-slate-400">
                  Powered by Echo’s calendar model across meetings, gaps, and context
                  switches.
                </p>

                <h2 className="text-base sm:text-lg font-semibold text-white mt-1">
                  {dateLabel}
                </h2>

                <p className="text-sm text-slate-200/95 leading-relaxed">
                  {renderTodayWorkStory(todayWorkAbility)}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Focus capacity today:{" "}
                  <span className="text-slate-100 font-medium">
                    {todayWorkAbility != null ? `${todayWorkAbility}%` : "–"}
                  </span>{" "}
                  · {loadLabel}
                </p>
              </div>
            </div>

            {/* Tomorrow Outlook + EchoJar preview (unchanged) */}
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
                <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
                  Outlook · Tomorrow
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-200/90">
                    {tomorrowOutlookLabel}
                    {typeof tomorrowWorkAbility === "number"
                      ? ` · ${tomorrowWorkAbility}% focus capacity`
                      : ""}
                  </span>

                  <span className="rounded-full border border-sky-400/50 bg-sky-500/10 px-2.5 py-[2px] text-[10px] text-sky-100">
                    Tomorrow
                  </span>
                </div>

                <div className="border-t border-white/10 pt-3 text-[11px] text-slate-400">
                  <div className="flex items-start justify-between gap-3">
                    <span className="uppercase tracking-[0.18em] text-slate-400/90">
                      EchoJar
                    </span>
                    <p className="text-right text-[11px] text-slate-400">
                      {echoJarPreviewText}
                    </p>
                  </div>
                </div>
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
