import { getUserFromSession } from "@/lib/getUserFromSession";
import { createClient } from "@supabase/supabase-js";

export default async function SummaryPage() {
  const user = await getUserFromSession();

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
    <div className="mx-auto max-w-6xl px-6 py-16 space-y-10">
      {/* Label */}
      <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/90">
        ECHO · DAILY SUMMARIES
      </p>

      {/* Heading */}
      <div className="space-y-3">
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

      {/* Archive container */}
      <div className="signal-card border border-white/10 p-6 sm:p-7 space-y-4">
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
            your days – searchable and easy to revisit when you need context.
          </p>
        )}
      </div>
    </div>
  );
}
