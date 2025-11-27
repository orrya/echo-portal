"use client";

import React, { useState } from "react";

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
  meetingLoadMinutes?: number;
  fragments?: number;
  lostFragmentMinutes?: number;
  contextSwitches?: number;
  contextSwitchCost?: number;
  deepWorkWindows?: DeepWorkWindow[];
  likelyFollowUp?: any[];
};

type Snapshot = {
  date: string;
  // API shape (camelCase)
  calendarInsights?: CalendarInsights | null;
  dayTimeline?: TimelineItem[] | null;
  // Fallback if you ever read straight from DB in future (snake_case)
  calendar_insights?: CalendarInsights | null;
  day_timeline?: TimelineItem[] | null;
};

export default function CalendarClient({ snapshot }: { snapshot: Snapshot | null }) {
  const [selectedMeeting, setSelectedMeeting] = useState<TimelineItem | null>(
    null
  );

  // Accept either camelCase or snake_case from the API
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
  const meetingMinutes = insights.meetingLoadMinutes ?? 0;
  const fractures = insights.fragments ?? 0;
  const fractureMinutes = insights.lostFragmentMinutes ?? 0;
  const switches = insights.contextSwitches ?? 0;
  const switchCost = insights.contextSwitchCost ?? 0;
  const deepWork = insights.deepWorkWindows ?? [];
  const followUp = insights.likelyFollowUp ?? [];

  const dateLabel = snapshot.date
    ? new Date(snapshot.date).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Today";

  const loadLabel =
    workAbility >= 80
      ? "Light load"
      : workAbility >= 65
      ? "Comfortable"
      : workAbility >= 50
      ? "Manageable"
      : "Heavy load";

  const showBreakHint = meetingMinutes >= 120 && deepWork.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 space-y-10">
      {/* HEADER */}
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
            Echo scans meetings, gaps and context switches to show how much of
            today is left for real work.
          </p>

          {/* Legend / key */}
          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-400">
            <span>🟢 Low-noise meeting</span>
            <span>🟡 Moderate-noise meeting</span>
            <span>🔴 High-noise meeting</span>
            <span>🟦 Deep-work window</span>
            <span>🔹 Day fracture</span>
          </div>
        </div>

        {/* TODAY PILL */}
        <div className="self-start md:self-auto">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 px-5 py-4 shadow-lg shadow-sky-500/10">
            <p className="text-[10px] tracking-[0.24em] text-slate-400 uppercase">
              Today
            </p>
            <p className="mt-1 text-sm font-medium text-slate-100">
              {dateLabel}
            </p>
            <p className="mt-2 text-xs text-slate-300">
              <span className="font-semibold text-sky-300">
                Focus capacity: {workAbility}%
              </span>{" "}
              · {loadLabel}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Based on meeting load, day fractures and switch cost.
            </p>
          </div>
        </div>
      </header>

      {/* METRICS BAR */}
      <section className="flex flex-wrap gap-3">
        <MetricChip
          label="Focus capacity"
          value={`${workAbility}%`}
          subtitle={loadLabel}
        />
        <MetricChip
          label="Time booked"
          value={`${meetingCount} meetings`}
          subtitle={`${meetingMinutes} min`}
        />
        <MetricChip
          label="Day fractures"
          value={fractures}
          subtitle={`${fractureMinutes} min lost`}
        />
        <MetricChip
          label="Switch cost"
          value={switches}
          subtitle={`${switchCost ?? 0} min tax`}
        />
      </section>

      {/* MAIN GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] gap-10">
        {/* LEFT: DAY FRAME */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 px-6 py-5 shadow-[0_0_60px_rgba(15,23,42,0.9)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
                Day frame
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                High-noise blocks are where your day fractures.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {timeline.length === 0 && (
              <p className="text-sm text-slate-500">
                No meetings in today’s calendar.
              </p>
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

        {/* RIGHT: DEEP WORK + NOISE */}
        <div className="space-y-6">
          {/* Deep work */}
          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-900/10 px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold tracking-[0.22em] text-emerald-200 uppercase">
                  Deep-work windows
                </h2>
                <p className="mt-1 text-xs text-emerald-100/80">
                  Echo scans gaps ≥ 60 minutes and suggests where to defend
                  focused work.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {deepWork.length === 0 && (
                <p className="text-sm text-emerald-50/80">
                  No uninterrupted focus windows detected today.
                </p>
              )}

              {deepWork.map((w, i) => (
                <DeepWorkCard key={i} window={w} />
              ))}
            </div>

            {showBreakHint && (
              <p className="mt-4 text-xs text-emerald-200">
                🧘‍♂️ Recommended: protect 10 minutes of breathing space around
                at least one deep-work block to reset context.
              </p>
            )}
          </div>

          {/* Noise & follow-up */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 px-5 py-5">
            <h2 className="text-xs font-semibold tracking-[0.22em] text-slate-300/80 uppercase">
              Noise & follow-up risk
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Meetings with higher noise scores tend to generate outsized
              follow-up and attention drag.
            </p>

            <div className="mt-4 space-y-3">
              {followUp.length === 0 && (
                <p className="text-sm text-slate-400">
                  No obviously noisy or follow-up-heavy meetings detected.
                </p>
              )}

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
            </div>
          </div>
        </div>
      </section>

      {/* MEETING DETAIL MODAL */}
      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      )}
    </div>
  );
}

/* -----------------------------
   SMALL COMPONENTS
------------------------------*/

function MetricChip({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-full border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-xs text-slate-200 flex items-center gap-2">
      <span className="uppercase tracking-[0.18em] text-[10px] text-slate-400">
        {label}
      </span>
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
    level === "high" ? "High noise" : level === "medium" ? "Moderate noise" : "Low noise";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 hover:border-slate-500/80 transition-colors">
      <div className="flex gap-3">
        {/* Time rail + dot */}
        <div className="flex flex-col items-center w-16 text-[11px] text-slate-400 pt-1">
          <span>{formatTime(meeting.start)}</span>
          <span className="opacity-60">{meeting.minutes} min</span>
        </div>

        <div className="flex flex-col items-center pt-2">
          <span
            className={`h-2 w-2 rounded-full ${dotColor} shadow-[0_0_10px_rgba(34,197,94,0.6)]`}
          />
        </div>

        {/* Card */}
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
          attention drag for this meeting.
        </p>
      </div>
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
