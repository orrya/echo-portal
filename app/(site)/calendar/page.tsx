// app/(site)/calendar/page.tsx
import { getUser } from "@/lib/getUser";
import { createClient } from "@supabase/supabase-js";

/* -----------------------------------
   Helpers
------------------------------------ */

function parseJson<T>(value: any, fallback: T): T {
  if (!value && value !== 0) return fallback;
  if (Array.isArray(value) || typeof value === "object") return value as T;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed as T;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* -----------------------------------
   Page
------------------------------------ */

export default async function CalendarPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-slate-200/90">
          Please{" "}
          <a className="text-sky-300 underline" href="/auth/sign-in">
            sign in
          </a>{" "}
          to view your Echo calendar.
        </p>
      </div>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // For now: just grab "today" for demo; we can re-add user_id filtering later.
  const { data, error } = await supabase
    .from("work_state_snapshots")
    .select("*")
    .eq("date", today)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error loading calendar_snapshots:", error);
  }

  const snapshot = data?.[0];

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-slate-300">
        No calendar insights found for today.
      </div>
    );
  }

  // ---- Build insights object from real columns ----
  const insights = {
    workAbility: Number(snapshot.work_ability_score ?? 0),
    meetingCount: snapshot.meeting_count ?? 0,
    meetingLoadMinutes: Number(snapshot.meeting_load_minutes ?? 0),
    fragments: snapshot.fragments ?? 0,
    lostFragmentMinutes: snapshot.lost_fragment_minutes ?? 0,
    contextSwitches: snapshot.context_switches ?? 0,
    contextSwitchCost: snapshot.context_switch_cost ?? 0,
    deepWorkWindows: parseJson<any[]>(snapshot.deep_work_windows, []),
    likelyFollowUp: parseJson<any[]>(snapshot.likely_follow_up, []),
  };

  const timeline = parseJson<any[]>(snapshot.day_timeline, []);

  const dateLabel = new Date(snapshot.date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const loadLabel =
    insights.meetingLoadMinutes <= 60
      ? "Light"
      : insights.meetingLoadMinutes <= 180
      ? "Heavy"
      : "Crushed";

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
      {/* HEADER AREA */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold tracking-[0.32em] text-slate-300/90">
          ECHO · CALENDAR INSIGHTS
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-50">
              A noise-free frame for{" "}
              <span className="bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)] bg-clip-text text-transparent">
                today.
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-300/90">
              Echo scans meetings, gaps and context switches to show how much is
              left for real work.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 px-4 py-2 text-right shadow-[0_0_40px_rgba(59,130,246,0.25)]">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              Today
            </div>
            <div className="text-sm font-medium text-slate-100">{dateLabel}</div>
            <div className="mt-1 text-xs text-slate-400">
              Work ability{" "}
              <span className="font-semibold text-sky-300">
                {insights.workAbility}%
              </span>{" "}
              · {loadLabel} load
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div
        className="
          rounded-3xl border border-slate-700/70 bg-slate-950/80
          shadow-[0_40px_120px_rgba(15,23,42,0.95)]
          relative overflow-hidden
        "
      >
        {/* soft highlight */}
        <div className="pointer-events-none absolute -left-32 top-0 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative z-10 px-6 py-7 sm:px-8 sm:py-8 space-y-8">
          {/* METRICS CHIPS */}
          <div className="flex flex-wrap gap-3">
            <MetricChip
              label="Work Ability"
              value={`${insights.workAbility}%`}
              subtitle={loadLabel}
            />
            <MetricChip
              label="Meetings"
              value={insights.meetingCount}
              subtitle={`${Math.round(
                insights.meetingLoadMinutes
              )} min booked`}
            />
            <MetricChip
              label="Fragmentation"
              value={insights.fragments}
              subtitle={`${insights.lostFragmentMinutes} min lost`}
            />
            <MetricChip
              label="Context switches"
              value={insights.contextSwitches}
              subtitle={`${insights.contextSwitchCost ?? 0} min tax`}
            />
          </div>

          {/* TWO-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-8">
            {/* LEFT: DAY FRAME / TIMELINE */}
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
                  Day Frame
                </h2>
                <p className="text-[11px] text-slate-400">
                  High-noise blocks are where your day fractures.
                </p>
              </div>

              <div className="relative">
                {/* vertical rail */}
                <div className="absolute left-[76px] top-0 bottom-0 w-px bg-gradient-to-b from-slate-600 via-slate-700/40 to-slate-800" />

                <div className="space-y-5 pl-0">
                  {timeline.length > 0 ? (
                    timeline.map((m: any, i: number) => (
                      <TimelineRow key={i} meeting={m} />
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">
                      No meetings found for today’s calendar.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: DEEP WORK + NOISE */}
            <div className="space-y-6">
              {/* Deep work */}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200 mb-2">
                  Deep-Work Windows
                </h2>
                <p className="text-[11px] text-slate-400 mb-3">
                  Echo scans gaps ≥ 60 minutes and recommends where to defend
                  focused work.
                </p>

                <div className="space-y-3">
                  {insights.deepWorkWindows.length > 0 ? (
                    insights.deepWorkWindows.map((w: any, i: number) => (
                      <DeepWorkCard key={i} block={w} />
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      No uninterrupted deep-work blocks detected today.
                    </p>
                  )}
                </div>
              </div>

              {/* Noise / follow up */}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-200 mb-2">
                  Noise & Follow-Up Risk
                </h2>
                <p className="text-[11px] text-slate-400 mb-3">
                  Meetings with high noise profiles tend to generate outsized
                  follow-up and context drag.
                </p>

                {insights.likelyFollowUp.length > 0 ? (
                  <div className="space-y-2">
                    {insights.likelyFollowUp.map((m: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl border border-rose-500/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-50/90"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">
                            {m.title ?? "Untitled meeting"}
                          </span>
                          <span className="text-[10px] text-rose-200/80">
                            Noise {m.noiseScore ?? "-"}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-rose-100/80">
                          {m.start && formatTime(m.start)} ·{" "}
                          {(m.attendees?.length ?? 0) || 0} attendee(s)
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No obviously noisy / follow-up-heavy meetings detected.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------
   Presentational pieces
------------------------------------ */

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
    <div className="flex items-center gap-2 rounded-full border border-slate-600/70 bg-slate-900/80 px-4 py-2 text-xs text-slate-200">
      <span className="uppercase tracking-[0.18em] text-[10px] text-slate-400">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-50">{value}</span>
      {subtitle && (
        <span className="text-[11px] text-slate-400/90">· {subtitle}</span>
      )}
    </div>
  );
}

function TimelineRow({ meeting }: { meeting: any }) {
  const noise = meeting.noiseScore ?? 0;
  const level =
    noise >= 7 ? "high" : noise >= 4 ? "medium" : noise > 0 ? "low" : "none";

  const dotColor =
    level === "high"
      ? "bg-rose-400"
      : level === "medium"
      ? "bg-amber-300"
      : "bg-emerald-300";

  const pillBg =
    level === "high"
      ? "bg-rose-500/20 text-rose-100 border border-rose-400/60"
      : level === "medium"
      ? "bg-amber-500/20 text-amber-100 border border-amber-400/60"
      : "bg-emerald-500/20 text-emerald-100 border border-emerald-400/60";

  const pillLabel =
    level === "high"
      ? "High noise"
      : level === "medium"
      ? "Moderate noise"
      : "Low noise";

  return (
    <div className="grid grid-cols-[64px,16px,minmax(0,1fr)] gap-3 items-start">
      {/* Time label */}
      <div className="text-right text-[11px] text-slate-400 pt-1">
        <div>{formatTime(meeting.start)}</div>
        <div className="text-[10px] text-slate-500">
          {meeting.minutes} min
        </div>
      </div>

      {/* Dot on rail */}
      <div className="relative flex justify-center pt-1">
        <div className={`h-2 w-2 rounded-full ${dotColor} shadow-[0_0_12px_rgba(129,140,248,0.7)]`} />
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium text-slate-50 truncate">
            {meeting.title || "Untitled meeting"}
          </div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
            {meeting.type === "online" ? "Online" : "In person"}
          </div>
        </div>

        <div className="mt-1 text-[11px] text-slate-400">
          {formatTime(meeting.start)} — {formatTime(meeting.end)} ·{" "}
          {meeting.attendees} attendee(s)
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] ${pillBg}`}
          >
            {pillLabel}
          </span>
          <span className="text-[11px] text-slate-400">
            Noise score {noise}
          </span>
        </div>
      </div>
    </div>
  );
}

function DeepWorkCard({ block }: { block: any }) {
  return (
    <div className="rounded-2xl border border-emerald-500/60 bg-emerald-900/30 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-200">
        Deep-work window
      </div>
      <div className="mt-1 text-sm text-emerald-50">
        {formatTime(block.start)} — {formatTime(block.end)}
        <span className="ml-2 text-[11px] text-emerald-100/80">
          · {block.minutes} mins
        </span>
      </div>
    </div>
  );
}
