import React from "react";

async function getCalendarSnapshot() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/today`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;

  const { snapshot } = await res.json();
  return snapshot;
}

export default async function CalendarPage() {
  const snapshot = await getCalendarSnapshot();

  if (!snapshot) {
    return (
      <div className="p-8 text-slate-400">
        No calendar insights found for today.
      </div>
    );
  }

  // ---- Extract data ----
  const insights = snapshot.calendar_insights ?? {};
  const timeline = snapshot.day_timeline ?? [];

  const workAbility = insights.workAbility ?? 0;
  const meetingCount = insights.meetingCount ?? 0;
  const fragments = insights.fragments ?? 0;
  const lostMinutes = insights.lostFragmentMinutes ?? 0;

  return (
    <div className="p-8 space-y-10 max-w-5xl mx-auto">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-100">
          Echo Calendar · {new Date(snapshot.date).toLocaleDateString()}
        </h1>
        <p className="text-slate-400 mt-2">
          A noise-free, emotionally uncluttered view of your day.
        </p>
      </div>

      {/* METRICS BAR */}
      <div className="flex flex-wrap gap-3">

        <MetricChip label="Work Ability" value={`${workAbility}%`} />
        <MetricChip label="Meetings" value={meetingCount} />
        <MetricChip label="Fragmentation" value={`${fragments} · ${lostMinutes} min lost`} />
        <MetricChip
          label="Context Switches"
          value={`${insights.contextSwitches ?? 0} · ${insights.contextSwitchCost ?? 0} min`}
        />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* LEFT COLUMN — DAY FRAME / TIMELINE */}
        <div>
          <h2 className="uppercase tracking-wide text-sm text-indigo-300 mb-2">
            Day Frame
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            High-noise meetings pull focus. Echo highlights where your attention fragments.
          </p>

          <div className="space-y-6">
            {timeline.map((m: any, idx: number) => (
              <MeetingCard key={idx} meeting={m} />
            ))}

            {timeline.length === 0 && (
              <p className="text-slate-500 text-sm">No meetings today.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — DEEP WORK + NOISE */}
        <div>
          {/* Deep Work */}
          <h2 className="uppercase tracking-wide text-sm text-indigo-300 mb-2">
            Deep Work Windows
          </h2>

          <div className="space-y-4">
            {(insights.deepWorkWindows ?? []).map((w: any, i: number) => (
              <DeepWorkCard key={i} window={w} />
            ))}

            {(!insights.deepWorkWindows || insights.deepWorkWindows.length === 0) && (
              <p className="text-slate-500 text-sm">No protected focus windows today.</p>
            )}
          </div>

          {/* Noise */}
          <h2 className="uppercase tracking-wide text-sm text-indigo-300 mt-8 mb-2">
            Noise & Follow-Up Risk
          </h2>

          {insights.likelyFollowUp && insights.likelyFollowUp.length > 0 ? (
            <ul className="list-disc list-inside text-slate-400 text-sm">
              {insights.likelyFollowUp.map((note: string, i: number) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">
              No obvious noisy or follow-up-heavy meetings detected.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

/* -----------------------------
   COMPONENTS
------------------------------*/

function MetricChip({ label, value }: { label: string; value: any }) {
  return (
    <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-slate-200 text-sm">
      <span className="opacity-60 uppercase tracking-wider text-xs mr-2">
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: any }) {
  const noiseColor =
    meeting.noiseScore >= 4
      ? "border-red-500 bg-red-900/20"
      : "border-green-500 bg-green-900/20";

  return (
    <div
      className={`p-4 rounded-xl border ${noiseColor} backdrop-blur-sm`}
    >
      <div className="flex justify-between">
        <div className="text-slate-100 font-medium">{meeting.title}</div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">
          {meeting.type}
        </div>
      </div>

      <div className="text-sm text-slate-400 mt-1">
        {formatTime(meeting.start)} — {formatTime(meeting.end)} · {meeting.minutes} mins
      </div>

      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs text-slate-300">
          Noise: {meeting.noiseScore}
        </span>
        <span className="text-xs text-slate-500">
          Attendees: {meeting.attendees}
        </span>
      </div>
    </div>
  );
}

function DeepWorkCard({ window }: { window: any }) {
  return (
    <div className="p-4 rounded-xl border border-emerald-500/60 bg-emerald-900/20 backdrop-blur-sm">
      <div className="text-xs uppercase tracking-wider text-emerald-200">
        Deep Work Window
      </div>
      <div className="text-slate-100 text-sm mt-1">
        {formatTime(window.start)} — {formatTime(window.end)}
        <span className="opacity-70 ml-2 text-xs">{window.minutes} mins</span>
      </div>
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
