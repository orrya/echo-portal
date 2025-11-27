// app/(site)/calendar/page.tsx
import { getUser } from "@/lib/getUser";
import { createClient } from "@supabase/supabase-js";

export default async function CalendarPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="p-10 text-slate-200">
        Please{" "}
        <a href="/auth/sign-in" className="text-sky-300 underline">
          sign in
        </a>{" "}
        to view your calendar insights.
      </div>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("calendar_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error loading calendar_snapshots:", error);
  }

  const snapshot = data?.[0];

  if (!snapshot) {
    return (
      <div className="p-10 text-slate-500">
        No calendar insights found for today.
      </div>
    );
  }

  const insights = snapshot.calendar_insights || {};
  const timeline = snapshot.day_timeline || [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-100">
          Echo Calendar · {snapshot.date}
        </h1>
        <p className="text-slate-400 mt-2">
          A noise-free, emotionally uncluttered view of your day.
        </p>
      </div>

      {/* METRICS BAR */}
      <div className="flex flex-wrap gap-3">

        <Metric label="Work Ability" value={`${insights.workAbility ?? 0}%`} />
        <Metric label="Meetings" value={insights.meetingCount ?? 0} />
        <Metric
          label="Fragmentation"
          value={`${insights.fragments ?? 0} · ${insights.lostFragmentMinutes ?? 0} min lost`}
        />
        <Metric
          label="Context Switches"
          value={`${insights.contextSwitches ?? 0} · ${insights.contextSwitchCost ?? 0} min`}
        />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* LEFT — DAY FRAME */}
        <div>
          <h2 className="uppercase tracking-wide text-sm text-indigo-300 mb-2">
            Day Frame
          </h2>

          <p className="text-slate-400 text-sm mb-4">
            High-noise meetings pull focus. Echo highlights where your attention fragments.
          </p>

          <div className="space-y-6">
            {timeline.length > 0 ? (
              timeline.map((m: any, i: number) => <MeetingCard key={i} meeting={m} />)
            ) : (
              <p className="text-slate-500 text-sm">No meetings today.</p>
            )}
          </div>
        </div>

        {/* RIGHT — DEEP WORK / NOISE */}
        <div>

          <h2 className="uppercase tracking-wide text-sm text-indigo-300 mb-2">
            Deep Work Windows
          </h2>

          <div className="space-y-4">
            {insights.deepWorkWindows?.length > 0 ? (
              insights.deepWorkWindows.map((w: any, i: number) => (
                <DeepWorkCard key={i} window={w} />
              ))
            ) : (
              <p className="text-slate-500 text-sm">
                No protected focus windows today.
              </p>
            )}
          </div>

          <h2 className="uppercase tracking-wide text-sm text-indigo-300 mt-8 mb-2">
            Noise & Follow-up Risk
          </h2>

          {insights.likelyFollowUp?.length > 0 ? (
            <ul className="text-sm text-slate-400 list-disc list-inside">
              {insights.likelyFollowUp.map((v: string, i: number) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">
              No noisy or follow-up-heavy meetings detected.
            </p>
          )}

        </div>

      </div>
    </div>
  );
}


/* -----------------------------------
   COMPONENTS
------------------------------------ */

function Metric({ label, value }: { label: string; value: any }) {
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
    <div className={`p-4 rounded-xl border ${noiseColor}`}>
      <div className="flex justify-between">
        <div className="text-slate-100 font-medium">{meeting.title}</div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">
          {meeting.type}
        </div>
      </div>

      <div className="text-sm text-slate-400 mt-1">
        {formatTime(meeting.start)} — {formatTime(meeting.end)} · {meeting.minutes} mins
      </div>

      <div className="mt-2 flex items-center gap-3">
        <span className="text-xs text-slate-300">Noise: {meeting.noiseScore}</span>
        <span className="text-xs text-slate-500">
          Attendees: {meeting.attendees}
        </span>
      </div>
    </div>
  );
}

function DeepWorkCard({ window }: { window: any }) {
  return (
    <div className="p-4 rounded-xl border border-emerald-500/60 bg-emerald-900/20">
      <div className="text-xs uppercase tracking-wider text-emerald-200">
        Deep Work Window
      </div>
      <div className="text-slate-100 text-sm mt-1">
        {formatTime(window.start)} — {formatTime(window.end)}
        <span className="ml-2 opacity-70 text-xs">{window.minutes} mins</span>
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
