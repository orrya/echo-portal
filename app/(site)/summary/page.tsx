// app/(site)/summary/page.tsx
import { getUser } from "@/lib/getUser";
import { createClient } from "@supabase/supabase-js";

type UiSummary = {
  summary_date: string; // e.g. "2025-11-20"
  time_of_day: "am" | "pm";
  content: string;
};

function normaliseMode(mode: string | null | undefined): "am" | "pm" {
  const m = (mode ?? "").toLowerCase();
  if (m.startsWith("am")) return "am";
  if (m.startsWith("pm")) return "pm";
  // fallback – most of your data is PM right now
  return "pm";
}

export default async function SummaryPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-slate-200/90">
          Please{" "}
          <a className="text-sky-300 underline" href="/auth/sign-in">
            sign in
          </a>{" "}
          to view your Echo summaries.
        </p>
      </div>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Fetch from daily_summaries
  const { data: raw } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("Date", { ascending: false });

  // 2) Map into UI-friendly shape
  const summaries: UiSummary[] =
    raw?.map((row: any) => ({
      summary_date: row.Date as string, // your "Date" column
      time_of_day: normaliseMode(row.Mode), // your "Mode" column
      content: (row["Reflection Summary"] as string) ?? "",
    })) ?? [];

  // 3) Work out "today" / "yesterday" cards (Option B)
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const isMorningNow = now.getHours() < 14; // tweak cutoff if you like

  const findSummary = (date: string, mode: "am" | "pm") =>
    summaries.find(
      (s) => s.summary_date === date && s.time_of_day === mode
    ) ?? null;

  const todayAm = findSummary(todayStr, "am");
  const todayPm = findSummary(todayStr, "pm");
  const yesterdayPm = findSummary(yesterdayStr, "pm");

  const amCard = isMorningNow ? todayAm : todayAm;
  const pmCard = isMorningNow ? yesterdayPm : todayPm;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 space-y-14">
      {/* Eyebrow Label */}
      <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/90">
        ECHO · DAILY SUMMARIES
      </p>

      {/* Hero Block */}
      <div className="space-y-4">
        <h1
          className="
            text-white text-3xl sm:text-4xl lg:text-[2.4rem]
            font-semibold leading-tight
            drop-shadow-[0_0_18px_rgba(0,0,0,0.45)]
          "
        >
          A single place for{" "}
          <span
            className="
              bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)]
              bg-clip-text text-transparent
            "
          >
            each day.
          </span>
        </h1>

        <p className="max-w-2xl text-slate-200/95 sm:text-base leading-relaxed">
          Echo writes a calm AM / PM snapshot of your workday – the meetings,
          threads and decisions that actually changed your trajectory.
        </p>

        <p className="text-xs text-slate-400/90 pt-1">
          {summaries.length > 0
            ? `${summaries.length} summaries stored for your account.`
            : "No summaries have been generated yet – once Echo is connected, they will appear here."}
        </p>
      </div>

      {/* TODAY SUMMARY PANEL */}
      <div className="flex flex-col items-center">
        <div
          className="
            w-full 
            max-w-5xl
            relative overflow-hidden rounded-2xl
            backdrop-blur-2xl
            bg-white/[0.08]
            border-[1.5px]
            border-transparent
            [border-image:linear-gradient(120deg,rgba(148,163,255,0.5),rgba(56,189,248,0.5))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.55)]
            p-6 sm:p-7
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.45)]" />

          <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/75 mb-3">
            TODAY · ECHO AM / PM
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {/* AM CARD */}
            <div
              className="
                rounded-xl p-5
                bg-white/[0.07]
                border border-white/10
                shadow-[0_0_22px_rgba(255,255,255,0.04)]
                backdrop-blur-xl
                bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),rgba(255,255,255,0.015))]
              "
            >
              <h3 className="text-sm font-semibold text-white/90 tracking-wide mb-1">
                AM Summary
              </h3>
              {amCard ? (
                <>
                  <p className="text-[11px] text-slate-400/90 mb-1">
                    {amCard.summary_date} · Morning
                  </p>
                  <p className="text-xs text-slate-200/90 leading-relaxed line-clamp-4 whitespace-pre-line">
                    {amCard.content}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400/90">
                  No morning summary yet.
                </p>
              )}
            </div>

            {/* PM CARD */}
            <div
              className="
                rounded-xl p-5
                bg-white/[0.07]
                border border-white/10
                shadow-[0_0_22px_rgba(255,255,255,0.04)]
                backdrop-blur-xl
                bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),rgba(255,255,255,0.015))]
              "
            >
              <h3 className="text-sm font-semibold text-white/90 tracking-wide mb-1">
                PM Summary
              </h3>
              {pmCard ? (
                <>
                  <p className="text-[11px] text-slate-400/90 mb-1">
                    {pmCard.summary_date} · Evening
                  </p>
                  <p className="text-xs text-slate-200/90 leading-relaxed line-clamp-4 whitespace-pre-line">
                    {pmCard.content}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400/90">
                  No evening summary yet.
                </p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400/80 mt-3">
            Echo will keep today’s AM/PM snapshots here so you can see the day
            at a glance.
          </p>
        </div>
      </div>

      {/* ARCHIVE PANEL */}
      <div className="flex flex-col items-center pt-4">
        <div
          className="
            w-full 
            max-w-5xl
            signal-card
            border border-white/10
            p-6 sm:p-7 space-y-4
            rounded-2xl backdrop-blur-xl bg-white/[0.06]
          "
        >
          {summaries.length > 0 ? (
            <ul className="space-y-4 text-sm sm:text-[15px] text-slate-100/95">
              {summaries.map((summary) => (
                <li
                  key={`${summary.summary_date}-${summary.time_of_day}-${summary.content.slice(0,16)}`}
                  className="border-b border-white/10 last:border-none pb-4 last:pb-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {summary.summary_date} ·{" "}
                      {summary.time_of_day === "am" ? "Morning" : "Evening"}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-400/90">
                      Echo summary
                    </span>
                  </div>

                  <p className="mt-2 text-slate-200/90 leading-relaxed whitespace-pre-line">
                    {summary.content}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300/95">
              Once summaries are enabled, this archive will keep a quiet log of
              your days – searchable and easy to revisit.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
