"use client";

import React, { useState, useEffect } from "react";


/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */

type DeepWorkWindow = {
  start: string;
  end: string;
  minutes: number;
};

type TimelineItem = {
  title: string;
  start: string;
  end: string;
  minutes: number;
  noiseScore: number;
  attendees: number;
  type: "online" | "inPerson" | string;
};

type CalendarInsights = {
  workAbility?: number;
  meetingCount?: number;
  meetingMinutes?: number;
  fragments?: number;
  lostFragmentMinutes?: number;
  contextSwitches?: number;
  contextSwitchCost?: number;
  deepWorkWindows?: DeepWorkWindow[];
  likelyFollowUp?: any[];
};

type Snapshot = {
  date: string;
  calendarInsights?: CalendarInsights | null;
  dayTimeline?: TimelineItem[] | null;
  calendar_insights?: CalendarInsights | null;
  day_timeline?: TimelineItem[] | null;

  // Tomorrow-specific (when used for tomorrowSnapshot)
  flaggedMeetings?: any[];
  deepWorkWindows?: any[];
  forecast?: any;
  aiStory?: string;
};

type SuggestedWorkBlock = {
  start: string;
  end: string;
  minutes: number;
  reason: string;
  source: "draft_commitment";
};

/* ---------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------- */

export default function CalendarClient({
  snapshot,
  tomorrowSnapshot,
}: {
  snapshot: Snapshot | null;
  tomorrowSnapshot: Snapshot | null;
}) {
  const [selectedMeeting, setSelectedMeeting] = useState<TimelineItem | null>(
    null
  );
  const [defendLoadingKey, setDefendLoadingKey] = useState<string | null>(null);

  const [todayLabel, setTodayLabel] = useState<string>("");
const [tomorrowLabel, setTomorrowLabel] = useState<string>("");

const tomorrowFlaggedMeetings =
  tomorrowSnapshot?.flaggedMeetings ?? [];

/* ---------------------------------------------------------
   CLIENT DATE NORMALISATION (FIXES HYDRATION ERROR)
--------------------------------------------------------- */

useEffect(() => {
  if (snapshot?.date) {
    setTodayLabel(
      new Date(snapshot.date + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    );
  }

  if (tomorrowSnapshot?.date) {
    setTomorrowLabel(
      new Date(tomorrowSnapshot.date + "T00:00:00").toLocaleDateString(
        "en-GB",
        {
          weekday: "short",
          day: "2-digit",
          month: "short",
        }
      )
    );
  }
}, [snapshot?.date, tomorrowSnapshot?.date]);

useEffect(() => {
  fetch("/api/suggested-work", { cache: "no-store" as any })
    .then((r) => r.json())
    .then((d) => setSuggestedBlocks(d.blocks ?? []))
    .catch(() => setSuggestedBlocks([]));
}, []);


  /* ---------------------------------------------------------
     TODAY SNAPSHOT
  --------------------------------------------------------- */

  const rawInsights =
    snapshot?.calendarInsights ?? snapshot?.calendar_insights ?? null;

  const timeline: TimelineItem[] =
    snapshot?.dayTimeline ?? snapshot?.day_timeline ?? [];

  if (!snapshot || !rawInsights) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-slate-300">
        No calendar insights found for today.
      </div>
    );
  }

  const insights = rawInsights;

  const workAbility = insights.workAbility ?? 0;
  const meetingCount = insights.meetingCount ?? 0;
  const meetingMinutes = Number(insights.meetingMinutes ?? 0);
  const fractures = insights.fragments ?? 0;
  const fractureMinutes = insights.lostFragmentMinutes ?? 0;
  const switches = insights.contextSwitches ?? 0;
  const switchCost = insights.contextSwitchCost ?? 0;
  const deepWork = insights.deepWorkWindows ?? [];
  const followUp = insights.likelyFollowUp ?? [];

  const [suggestedBlocks, setSuggestedBlocks] = useState<any[]>([]);

  /* ---------------------------------------------------------
   SUGGESTED WORK BLOCK (FROM COMMITMENT)
--------------------------------------------------------- */


  const dateLabel = new Date(snapshot.date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const loadLabel =
    workAbility >= 80
      ? "Light load"
      : workAbility >= 65
      ? "Comfortable"
      : workAbility >= 50
      ? "Manageable"
      : "Heavy load";

  const showBreakHint = meetingMinutes >= 120 && deepWork.length > 0;

  /* ---------------------------------------------------------
     HELPER: FLAG MEETINGS THAT SHOULD NOT EXIST
  --------------------------------------------------------- */

  const flaggedMeetings = timeline.filter((m) =>
    shouldFlagMeeting(m, deepWork)
  );

  /* ---------------------------------------------------------
     DEFEND BLOCK HANDLER
  --------------------------------------------------------- */

  async function handleDefendBlock(window: {
  start: string;
  end: string;
  minutes: number;
  source_id?: string;
  reason?: string;
}) {
    const key = `${window.start}-${window.end}`;
    try {
      setDefendLoadingKey(key);

      const res = await fetch("/api/defend-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  start: window.start,
  end: window.end,
  title: "Deep Work — Protected",
  source_id: window.source_id,
  reason: window.reason,
}),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.status === "error") {
        alert("Echo couldn’t protect this block. Try again.");
        return;
      }

      alert("Deep work window protected in Outlook.");

if (window.source_id) {
  setSuggestedBlocks((prev) =>
    prev.filter((b) => b.source_id !== window.source_id)
  );
}
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setDefendLoadingKey(null);
    }
  }

  

  /* ---------------------------------------------------------
     PREMIUM TOMORROW BANNER (colour-coded)
  --------------------------------------------------------- */

  const tomorrowDateLabel = tomorrowSnapshot?.date
    ? new Date(tomorrowSnapshot.date).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      })
    : null;

  const tomorrowAbility =
    tomorrowSnapshot?.calendarInsights?.workAbility ?? null;

  const tomorrowGradient =
    tomorrowAbility == null
      ? "from-slate-700 via-slate-600 to-slate-700"
      : tomorrowAbility >= 80
      ? "from-emerald-400 via-emerald-300 to-emerald-500"
      : tomorrowAbility >= 60
      ? "from-sky-400 via-sky-300 to-sky-500"
      : tomorrowAbility >= 40
      ? "from-amber-400 via-amber-300 to-amber-500"
      : "from-red-500 via-red-400 to-red-600";

  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 space-y-16">
      {/* -----------------------------------------------------
         TOMORROW BANNER (top of page, world-class UI)
      ----------------------------------------------------- */}
      {tomorrowSnapshot && (
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 shadow-[0_0_60px_rgba(15,23,42,0.8)] overflow-hidden">
          {/* Gradient strip */}
          <div
            className={`h-1.5 w-full bg-gradient-to-r ${tomorrowGradient}`}
          />

          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                Tomorrow
              </p>
              <h2 className="mt-1 text-sm sm:text-base font-semibold text-slate-50">
                {tomorrowLabel || "Tomorrow"}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-xl">
                {tomorrowSnapshot.aiStory ||
                  "Echo is preparing a quiet preview of tomorrow’s load so you can decide what to defend."}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1 text-xs">
              {tomorrowAbility != null && (
                <p className="text-slate-200">
                  Focus capacity:{" "}
                  <span className="font-semibold text-sky-300">
                    {tomorrowAbility}%
                  </span>
                </p>
              )}

              <p className="text-[11px] text-slate-400">
                Pulled from Echo’s forecast of your calendar for tomorrow.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* -----------------------------------------------------
         TODAY HEADER
      ----------------------------------------------------- */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/90 uppercase">
            Echo · Calendar Insights
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-white leading-tight">
            A noise-free frame for{" "}
            <span className="bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)] bg-clip-text text-transparent">
              today.
            </span>
          </h1>
          <p className="mt-3 text-sm text-slate-300 max-w-xl">
            Echo scans meetings, gaps and switches to show how much of today is
            left for real work.
          </p>
        </div>

        {/* TODAY PILL */}
        <div className="self-start md:self-auto">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 px-5 py-4 shadow-lg shadow-sky-500/10">
            <p className="text-[10px] tracking-[0.24em] text-slate-400 uppercase">
              Today
            </p>
            <p className="mt-1 text-sm font-medium text-slate-100">
              {todayLabel || "—"}
            </p>
            <p className="mt-2 text-xs text-slate-300">
              <span className="font-semibold text-sky-300">
                Focus capacity: {workAbility}%
              </span>{" "}
              · {loadLabel}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Based on meeting load, fractures and switch cost.
            </p>
          </div>
        </div>
      </header>

      {/* -----------------------------------------------------
         TODAY — WORK STORY
      ----------------------------------------------------- */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/70 px-6 py-6 shadow-[0_0_40px_rgba(15,23,42,0.7)]">
        <h2 className="text-xs font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
          Today’s work story
        </h2>

        <p className="mt-3 text-sm text-slate-300 leading-relaxed">
          {renderTodayWorkStory(workAbility)}
        </p>

        <p className="mt-2 text-sm text-slate-400">
          {deepWork.length > 0
            ? `Your strongest deep-work block begins around ${formatTime(
                deepWork[0].start
              )}.`
            : "No clear deep-focus windows — consider manually protecting a block."}
        </p>
      </section>

      {/* -----------------------------------------------------
         TODAY — METRICS BAR
      ----------------------------------------------------- */}
      <section className="flex flex-wrap gap-3">
  <MetricChip
    label="Focus capacity"
    value={`${workAbility}%`}
    subtitle={loadLabel}
    tooltip="How much brainpower is free for deep concentration."
  />

  <MetricChip
    label="Time booked"
    value={`${meetingCount} meetings`}
    subtitle={`${meetingMinutes} min`}
    tooltip="Total minutes of meetings scheduled today."
  />

  <MetricChip
    label="Day fractures"
    value={fractures}
    subtitle={`${fractureMinutes} min lost`}
    tooltip="How often your focus is broken by meetings or idle gaps."
  />

  <MetricChip
    label="Switch cost"
    value={switches}
    subtitle={`${switchCost} min tax`}
    tooltip="Minutes of cognitive energy lost from context switching."
  />
</section>



      {/* -----------------------------------------------------
         TODAY — MAIN GRID
      ----------------------------------------------------- */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] gap-10">
        {/* -------------------------- LEFT: DAY FRAME -------------------------- */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 px-6 py-5 shadow-[0_0_60px_rgba(15,23,42,0.9)]">
          <h2 className="text-xs font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
            Day frame
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            High-noise blocks fracture attention and reduce clarity.
          </p>

          <div className="mt-4 space-y-5">
            {timeline.length === 0 && (
              <p className="text-sm text-slate-500">No meetings today.</p>
            )}

            {timeline.map((m, idx) => (
              <button
                key={`${m.start}-${idx}`}
                type="button"
                onClick={() => setSelectedMeeting(m)}
                className="w-full text-left focus:outline-none"
              >
                <MeetingRow meeting={m} />
              </button>
            ))}
          </div>
        </div>

        {/* -------------------------- RIGHT: DEEP WORK + NOISE -------------------------- */}
        <div className="space-y-6">
            {/* -----------------------------------------------------
   SUGGESTED WORK BLOCK (OPTIONAL)
----------------------------------------------------- */}
{suggestedBlocks.length > 0 && (
  <div className="rounded-3xl border border-sky-500/40 bg-sky-900/10 px-5 py-5">
    <h2 className="text-xs font-semibold tracking-[0.22em] text-sky-200 uppercase">
      Echo noticed a commitment
    </h2>

    <p className="mt-2 text-sm text-slate-200">
      If you defend a block now, you won’t need to carry this in working memory.
    </p>

    <div className="mt-4 space-y-4">
      {suggestedBlocks.map((b) => (
        <div key={b.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-xs text-slate-400 mb-2">
            {b.reason || "A drafted reply implies follow-up work."}
          </p>

          {b.suggested_start && b.suggested_end ? (
            <>
              <DeepWorkCard
                window={{
                  start: b.suggested_start,
                  end: b.suggested_end,
                  minutes: b.minutes,
                }}
              />

              <button
                className="mt-3 text-xs text-sky-300 underline hover:text-sky-200"
                onClick={() =>
                  handleDefendBlock({
                    start: b.suggested_start,
                    end: b.suggested_end,
                    minutes: b.minutes,
                    source_id: b.source_id,
                    reason: b.reason,
                  })
                }
              >
                Defend this time
              </button>
              <button
  className="mt-2 block text-[11px] text-slate-400 underline hover:text-slate-300"
  onClick={async () => {
    await fetch("/api/dismiss-work-block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_id: b.source_id }),
    });

    // Remove from UI immediately (no reload needed)
    setSuggestedBlocks((prev) =>
      prev.filter((x) => x.source_id !== b.source_id)
    );
  }}
>
  Dismiss suggestion
</button>

            </>

            
          ) : (
            <p className="text-xs text-slate-400">
              No clean slot found before the deadline — consider moving a meeting or creating space manually.
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
)}

          {/* Deep Work */}
          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-900/10 px-5 py-5">
            <h2 className="text-xs font-semibold tracking-[0.22em] text-emerald-200 uppercase">
              Deep-work windows
            </h2>
            <p className="mt-1 text-xs text-emerald-100/80">
              Echo identifies uninterrupted blocks so you can defend your best
              work.
            </p>

            <div className="mt-4 space-y-3">
              {deepWork.length === 0 && (
                <p className="text-sm text-emerald-50/80">
                  No deep-work windows today.
                </p>
              )}

              {deepWork.map((w) => {
                const defendKey = `${w.start}-${w.end}`;
                const isLoading = defendLoadingKey === defendKey;

                return (
                  <div key={defendKey} className="space-y-2">
                    <DeepWorkCard window={w} />
                    <button
                      className="text-xs text-emerald-200 underline hover:text-emerald-100 disabled:opacity-60"
                      onClick={() => handleDefendBlock(w)}
                      disabled={isLoading}
                    >
                      {isLoading ? "Defending this block…" : "Defend this block"}
                    </button>
                  </div>
                );
              })}
            </div>

            {showBreakHint && (
              <p className="mt-4 text-xs text-emerald-200">
                🧘‍♂️ Recommended: take 10 minutes between blocks to reset
                context.
              </p>
            )}
          </div>

          {/* Noise & Follow-Up */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 px-5 py-5">
            {/* Meetings That Should Not Exist */}
            {flaggedMeetings.length > 0 && (
  <>
    <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-red-300/80 mt-4">
      Meetings worth reconsidering
    </h3>

    <p className="text-xs text-slate-400 mt-1">
      Flagged where attention cost likely outweighs value.
    </p>

    <div className="mt-3 space-y-3">
      {flaggedMeetings.map((m, i) => {
        const reasons = getMeetingFlagReasons(m, deepWork);

        return (
          <div
            key={`${m.start}-${i}`}
            className="rounded-xl border border-red-500/60 bg-red-900/20 px-4 py-3 text-sm text-red-50/90"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {m.title || "Untitled meeting"}
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-red-200">
                Noise {m.noiseScore}
              </span>
            </div>

            <p className="text-xs mt-1 text-red-100/80">
              {formatTime(m.start)} · {m.minutes} min · {m.attendees} attendee(s)
            </p>

            <details className="mt-2 text-xs text-red-100/90">
              <summary className="cursor-pointer underline">
                Why Echo flagged this
              </summary>
              <ul className="mt-1 list-disc list-inside space-y-0.5">
                {reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </details>
          </div>
        );
      })}
    </div>
  </>
)}

            <div className="mt-3 space-y-3">
              {flaggedMeetings.map((m, i) => {
                const reasons = getMeetingFlagReasons(m, deepWork);

                return (
                  <div
                    key={`${m.start}-${i}`}
                    className="rounded-xl border border-red-500/60 bg-red-900/20 px-4 py-3 text-sm text-red-50/90"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {m.title || "Untitled meeting"}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-red-200">
                        Noise {m.noiseScore}
                      </span>
                    </div>

                    <p className="text-xs mt-1 text-red-100/80">
                      {formatTime(m.start)} · {m.minutes} min · {m.attendees}{" "}
                      attendee(s)
                    </p>

                    <details className="mt-2 text-xs text-red-100/90">
                      <summary className="cursor-pointer underline">
                        Why Echo flagged this
                      </summary>
                      <ul className="mt-1 list-disc list-inside space-y-0.5">
                        {reasons.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                );
              })}
            </div>

            {/* Follow-Up Heavy (existing behaviour) */}
            {followUp.length > 0 && (
              <>
                <h3 className="text-xs tracking-[0.2em] uppercase text-red-300 mt-8">
                  Follow-up heavy meetings
                </h3>

                {followUp.map((m: any, i: number) => (
                  <div
                    key={i}
                    className="rounded-xl border border-red-500/60 bg-red-900/20 px-4 py-3 text-sm text-red-50/90"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{m.title}</span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-red-200">
                        Noise {m.noiseScore}
                      </span>
                    </div>

                    <p className="text-xs mt-1 text-red-100/80">
                      {m.attendees?.length ?? 0} attendee(s) ·{" "}
                      {formatTime(m.start)}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* -----------------------------------------------------
         🔮 FULL TOMORROW SNAPSHOT (REAL DATA FROM SUPABASE)
      ----------------------------------------------------- */}
      <section className="rounded-3xl border border-sky-800 bg-slate-900/60 px-6 py-10 shadow-[0_0_70px_rgba(14,165,233,0.3)]">
        <h2 className="text-xs font-semibold tracking-[0.22em] text-sky-300 uppercase">
          Tomorrow • {tomorrowSnapshot?.date || ""}
        </h2>

        {!tomorrowSnapshot && (
          <p className="mt-4 text-sm text-slate-500">
            Tomorrow’s calendar snapshot hasn’t been generated yet.
          </p>
        )}

        {tomorrowSnapshot && (
          <div className="space-y-10 mt-6">
            {/* AI Story */}
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Work story
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                {tomorrowSnapshot.aiStory || "No narrative available."}
              </p>
            </div>

            {/* Metrics */}
            <div className="flex flex-wrap gap-3">
              <MetricChip
                label="Focus capacity"
                value={`${tomorrowSnapshot.calendarInsights?.workAbility ?? 0}%`}
              />
              <MetricChip
                label="Meetings"
                value={`${tomorrowSnapshot.calendarInsights?.meetingCount ?? 0}`}
                subtitle={`${tomorrowSnapshot.calendarInsights?.meetingMinutes ?? 0} min`}
              />
              <MetricChip
                label="Fragments"
                value={`${tomorrowSnapshot.calendarInsights?.fragments ?? 0}`}
                subtitle={`${tomorrowSnapshot.calendarInsights?.lostFragmentMinutes ?? 0} min lost`}
              />
            </div>

            {/* Deep Work Windows */}
            <div>
              <h3 className="text-xs tracking-[0.18em] uppercase text-emerald-300">
                Deep-work windows
              </h3>

              <div className="mt-3 space-y-3">
                {tomorrowSnapshot.deepWorkWindows?.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No deep-work windows tomorrow.
                  </p>
                )}

                {tomorrowSnapshot.deepWorkWindows?.map((w: any, i: number) => {
  const defendKey = `tomorrow-${w.start}-${w.end}`;
  const isLoading = defendLoadingKey === defendKey;

  return (
    <div key={i} className="space-y-2">
      <DeepWorkCard window={w} />

      <p className="text-[11px] text-slate-400">
        Echo predicts this as a high-clarity window based on tomorrow’s meeting
        load and fragmentation.
      </p>

      <button
        className="text-xs text-emerald-300 underline hover:text-emerald-200 disabled:opacity-60"
        onClick={() =>
          handleDefendBlock({
            start: w.start,
            end: w.end,
            minutes: w.minutes,
            source_id: w.source_id,
            reason: w.reason,
          })
        }
        disabled={isLoading}
      >
        {isLoading ? "Defending this block…" : "Defend this block"}
      </button>
    </div>
  );
})}
              </div>
            </div>

            {/* Flagged Meetings */}            
            {tomorrowFlaggedMeetings.length > 0 && (
  <div>
    <h3 className="text-xs tracking-[0.18em] uppercase text-red-300">
      Meetings worth reconsidering
    </h3>

    <p className="text-xs text-slate-400 mt-1">
      Based on forecasted attention cost and noise.
    </p>

    <div className="mt-3 space-y-3">
      {tomorrowFlaggedMeetings.map((m: any, i: number) => (
        <div
          key={i}
          className="rounded-xl border border-red-500/60 bg-red-900/20 px-4 py-3"
        >
          <div className="flex justify-between">
            <span className="text-red-100">{m.title}</span>
            <span className="text-[11px] text-red-200 uppercase">
              Noise {m.noiseScore}
            </span>
          </div>

          <p className="text-xs text-red-200 mt-1">
            {m.minutes} min · {m.attendees} attendee(s)
          </p>
        </div>
      ))}
    </div>
  </div>
)}

            {/* Tomorrow Timeline */}
            <div>
              <h3 className="text-xs tracking-[0.18em] uppercase text-slate-300">
                Tomorrow’s timeline
              </h3>

              {tomorrowSnapshot.dayTimeline?.length === 0 && (
                <p className="text-sm text-slate-500">No events tomorrow.</p>
              )}

              <div className="mt-3 space-y-4">
                {tomorrowSnapshot.dayTimeline?.map((m: any, i: number) => (
                  <MeetingRow key={i} meeting={m} />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* -----------------------------------------------------
         MODAL
      ----------------------------------------------------- */}
      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   COMPONENTS & HELPERS
--------------------------------------------------------- */

function MetricChip({
  label,
  value,
  subtitle,
  tooltip,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  tooltip?: string;
}) {
  return (
    <div className="relative group rounded-full border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-xs text-slate-200 flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className="uppercase tracking-[0.18em] text-[10px] text-slate-400">
          {label}
        </span>

        {tooltip && (
          <span className="cursor-help text-slate-500 relative group-hover:text-slate-300 duration-150">
            i
            <div className="absolute left-1/2 top-full z-40 hidden w-56 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] leading-relaxed text-slate-200 shadow-xl group-hover:block mt-2">
              {tooltip}
            </div>
          </span>
        )}
      </div>

      <span className="font-semibold text-sm">{value}</span>

      {subtitle && (
        <span className="text-[11px] text-slate-400 whitespace-nowrap">
          · {subtitle}
        </span>
      )}
    </div>
  );
}

function MeetingRow({ meeting }: { meeting: TimelineItem }) {
  const level =
    meeting.noiseScore >= 7
      ? "high"
      : meeting.noiseScore >= 4
      ? "medium"
      : "low";

  const dotColor =
    level === "high"
      ? "bg-red-400"
      : level === "medium"
      ? "bg-amber-300"
      : "bg-emerald-300";

  const badgeBg =
    level === "high"
      ? "bg-red-900/40 border-red-500/70 text-red-100"
      : level === "medium"
      ? "bg-amber-900/30 border-amber-400/70 text-amber-100"
      : "bg-emerald-900/30 border-emerald-400/70 text-emerald-100";

  const label =
    level === "high"
      ? "High noise"
      : level === "medium"
      ? "Moderate noise"
      : "Low noise";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 hover:border-slate-500/80 transition-colors">
      <div className="flex gap-3">
        <div className="flex flex-col items-center w-16 text-[11px] text-slate-400 pt-1">
          <span>{formatTime(meeting.start)}</span>
          <span className="opacity-60">{meeting.minutes} min</span>
        </div>

        <div className="flex flex-col items-center pt-2">
          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-100">
              {meeting.title || "Untitled meeting"}
            </p>
            <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
              {meeting.type === "online" ? "Online" : "In person"}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            {formatTime(meeting.start)} — {formatTime(meeting.end)} ·{" "}
            {meeting.attendees} attendee(s)
          </p>

          <div className="mt-2 flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${badgeBg}`}
            >
              {label}
            </span>
            <span className="text-[11px] text-slate-400">
              Noise score {meeting.noiseScore}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeepWorkCard({ window }: { window: DeepWorkWindow }) {
  return (
    <div className="rounded-2xl border border-emerald-500/60 bg-emerald-900/30 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200">
        Deep-work window
      </p>
      <p className="mt-1 text-sm text-emerald-50">
        {formatTime(window.start)} — {formatTime(window.end)}{" "}
        <span className="ml-2 text-[11px] text-emerald-100/80">
          • {window.minutes} mins
        </span>
      </p>
    </div>
  );
}

function MeetingDetailModal({
  meeting,
  onClose,
}: {
  meeting: TimelineItem;
  onClose: () => void;
}) {
  const level =
    meeting.noiseScore >= 7
      ? "High noise"
      : meeting.noiseScore >= 4
      ? "Moderate noise"
      : "Low noise";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 px-6 py-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Meeting detail
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {meeting.title || "Untitled meeting"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-sm"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-200">
          <p>
            <span className="text-slate-400">Time:</span>{" "}
            {formatTime(meeting.start)} — {formatTime(meeting.end)} (
            {meeting.minutes} mins)
          </p>
          <p>
            <span className="text-slate-400">Type:</span>{" "}
            {meeting.type === "online" ? "Online" : "In person"}
          </p>
          <p>
            <span className="text-slate-400">Attendees:</span>{" "}
            {meeting.attendees}
          </p>
          <p>
            <span className="text-slate-400">Noise score:</span>{" "}
            {meeting.noiseScore} ({level})
          </p>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Echo uses noise score, attendees and timing to estimate follow-up and
          attention drag.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   FLAGGING LOGIC
--------------------------------------------------------- */

function shouldFlagMeeting(meeting: TimelineItem, deepWork: DeepWorkWindow[]) {
  const highNoise = (meeting.noiseScore ?? 0) >= 5;
  const tooManyAttendees = meeting.attendees >= 5;
  const veryShort = meeting.minutes <= 30;
  const overlapsDeep = deepWorkOverlap(meeting, deepWork);

  return highNoise || (tooManyAttendees && veryShort) || overlapsDeep;
}

function getMeetingFlagReasons(
  meeting: TimelineItem,
  deepWork: DeepWorkWindow[]
) {
  const reasons: string[] = [];

  if ((meeting.noiseScore ?? 0) >= 5)
    reasons.push("High noise score for the time booked.");

  if (meeting.attendees >= 5)
    reasons.push("Many attendees increase meeting cost.");

  if (meeting.minutes <= 30)
    reasons.push("Very short slot — often produces unclear outcomes.");

  if (deepWorkOverlap(meeting, deepWork))
    reasons.push("Overlaps with one of your deep-work windows.");

  if (reasons.length === 0)
    reasons.push("Structure suggests limited value compared to cost.");

  return reasons;
}

function deepWorkOverlap(m: TimelineItem, deep: DeepWorkWindow[]) {
  const mStart = new Date(m.start).getTime();
  const mEnd = new Date(m.end).getTime();

  return deep.some((w) => {
    const wStart = new Date(w.start).getTime();
    const wEnd = new Date(w.end).getTime();
    return mStart < wEnd && mEnd > wStart;
  });
}

/* ---------------------------------------------------------
   TODAY RENDER HELPER
--------------------------------------------------------- */

function renderTodayWorkStory(workAbility: number) {
  if (workAbility > 75)
    return "Today is steady and spacious, with healthy pockets of clarity to lean into.";

  if (workAbility > 60)
    return "The morning is a little fractured but the afternoon clears; focus remains workable.";

  if (workAbility > 45)
    return "The day is mixed — meetings and gaps are interleaved, so focus will need protection.";

  return "Today is structurally noisy with limited uninterrupted time — small, deliberate wins matter most.";
}




/* ---------------------------------------------------------
   UTIL
--------------------------------------------------------- */

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
