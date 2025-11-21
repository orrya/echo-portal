import { getUser } from "@/lib/getUser";
import { createClient } from "@supabase/supabase-js";

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

  const { data: summaries } = await supabase
    .from("summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("summary_date", { ascending: false })
    .order("time_of_day", { ascending: true });
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
          {summaries && summaries.length > 0
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
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.45)]" />

          {/* Eyebrow */}
          <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/75 mb-3">
            TODAY · ECHO AM / PM
          </p>

          {/* AM + PM BLOCKS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {/* AM */}
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
              <p className="text-xs text-slate-400/90">
                No morning summary yet.
              </p>
            </div>

            {/* PM */}
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
              <p className="text-xs text-slate-400/90">
                No evening summary yet.
              </p>
            </div>
          </div>

          {/* Microcopy */}
          <p className="text-[11px] text-slate-400/80 mt-3">
            Echo will generate AM/PM summaries once connected to Microsoft 365.
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
          {summaries && summaries.length > 0 ? (
            <ul className="space-y-4 text-sm sm:text-[15px] text-slate-100/95">
              {summaries.map((summary) => (
                <li
                  key={`${summary.summary_date}-${summary.time_of_day}`}
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
