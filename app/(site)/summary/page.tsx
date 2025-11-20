import { getUserFromSession } from "@/lib/getUserFromSession";
import { createClient } from "@supabase/supabase-js";

export default async function SummaryPage() {
  const user = await getUserFromSession();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
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
    <div className="mx-auto max-w-6xl px-6 py-24 space-y-14">

      {/* EYEBROW */}
      <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/70">
        ECHO · DAILY SUMMARIES
      </p>

      {/* HERO BLOCK */}
      <div className="space-y-4 max-w-3xl">
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
          Echo writes a calm AM / PM snapshot of your workday — the meetings,
          threads and decisions that actually changed your trajectory.
        </p>

        <p className="text-xs text-slate-400/90 pt-1">
          {summaries && summaries.length > 0
            ? `${summaries.length} summaries stored for your account.`
            : "No summaries have been generated yet — once Echo is connected, they will appear here."}
        </p>
      </div>

      {/* TODAY’S SUMMARY — GLASS PANEL */}
      <div
        className="
          relative overflow-hidden rounded-2xl
          backdrop-blur-2xl
          bg-white/[0.08]
          border-[1.5px]
          border-transparent
          [border-image:linear-gradient(120deg,rgba(244,114,182,0.55),rgba(56,189,248,0.55))1]
          shadow-[0_20px_70px_rgba(0,0,0,0.65)]
          p-6 sm:p-8
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]
        "
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.45)]" />

        <div className="relative space-y-4">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
            SUMMARY · TODAY
          </p>

          {summaries && summaries.length > 0 ? (
            <p className="text-slate-200/95 text-sm leading-relaxed">
              Your most recent AM / PM summary will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                No summaries yet
              </h2>
              <p className="text-sm text-slate-300/90 leading-relaxed max-w-lg">
                Connect Microsoft 365 to generate your first AM / PM summary.
                Echo will begin crafting a calm snapshot of each workday.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ARCHIVE — GLASS PANEL */}
      <div
        className="
          relative overflow-hidden rounded-2xl
          backdrop-blur-2xl
          bg-white/[0.08]
          border-[1.5px]
          border-transparent
          [border-image:linear-gradient(120deg,rgba(56,189,248,0.55),rgba(244,114,182,0.55))1]
          shadow-[0_20px_70px_rgba(0,0,0,0.65)]
          p-6 sm:p-8
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]
        "
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.45)]" />

        <div className="relative space-y-4">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
            ARCHIVE · FULL HISTORY
          </p>

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
            <p className="text-sm text-slate-300/90 leading-relaxed max-w-xl">
              Once summaries are enabled, this archive will keep a quiet log of
              your days — searchable and easy to revisit whenever you need
              context.
            </p>
          )}
        </div>
      </div>

      {/* FOOTNOTE */}
      <div className="pt-6 text-center text-[11px] text-slate-400/80">
        Designed by Orrya · The Quiet Intelligence Layer.
      </div>
    </div>
  );
}
