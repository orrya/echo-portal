import { getUserFromSession } from "@/lib/getUserFromSession";
import { createClient } from "@supabase/supabase-js";

export default async function EmailPage() {
  const user = await getUserFromSession();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-slate-200/90">
          Please{" "}
          <a className="text-sky-300 underline" href="/auth/sign-in">
            sign in
          </a>{" "}
          to view your Echo email intelligence.
        </p>
      </div>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: emails } = await supabase
    .from("emails")
    .select("*")
    .eq("user_id", user.id)
    .order("received_at", { ascending: false });

  const actionEmails = emails?.filter((e) => e.category === "action") ?? [];
  const followUpEmails =
    emails?.filter((e) => e.category === "follow_up") ?? [];
  const noiseEmails = emails?.filter((e) => e.category === "noise") ?? [];
  const total = emails?.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 space-y-10">
      {/* Label */}
      <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/90">
        ECHO · EMAIL INTELLIGENCE
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
          A calmer view of your{" "}
          <span
            className="
              bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)]
              bg-clip-text text-transparent
            "
          >
            inbox.
          </span>
        </h1>

        <p className="max-w-2xl text-slate-200/95 sm:text-base leading-relaxed">
          Echo will sit above your Microsoft 365 inbox and quietly organise
          everything into clear priority bands. Below is a preview of how your
          email signal will be grouped.
        </p>

        <p className="text-xs text-slate-400/90 pt-1">
          {total === 0
            ? "No email records have been synced to Echo yet."
            : `${total} messages processed · ${actionEmails.length} action · ${followUpEmails.length} follow-up · ${noiseEmails.length} noise`}
        </p>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Action */}
        <div className="signal-card p-5 sm:p-6 border border-emerald-300/35 shadow-[0_18px_50px_rgba(15,23,42,0.9)]">
          <h2 className="text-lg font-semibold text-emerald-300 mb-1">
            Action
          </h2>
          <p className="text-sm text-slate-200/95 leading-relaxed">
            High-signal threads that need a decision, reply or clear next step.
          </p>
          <p className="mt-3 text-xs text-slate-400/90">
            {actionEmails.length} messages tagged as action.
          </p>
        </div>

        {/* Follow-up */}
        <div className="signal-card p-5 sm:p-6 border border-sky-300/40 shadow-[0_18px_50px_rgba(15,23,42,0.9)]">
          <h2 className="text-lg font-semibold text-sky-300 mb-1">
            Follow-up
          </h2>
          <p className="text-sm text-slate-200/95 leading-relaxed">
            Conversations you&apos;re tracking, where Echo will remind you when
            things go quiet.
          </p>
          <p className="mt-3 text-xs text-slate-400/90">
            {followUpEmails.length} messages tagged as follow-up.
          </p>
        </div>

        {/* Noise */}
        <div className="signal-card p-5 sm:p-6 border border-white/12 shadow-[0_18px_50px_rgba(15,23,42,0.9)]">
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Noise</h2>
          <p className="text-sm text-slate-200/95 leading-relaxed">
            Low-value updates, promos and FYIs that Echo keeps out of your
            immediate field of view.
          </p>
          <p className="mt-3 text-xs text-slate-400/90">
            {noiseEmails.length} messages tagged as noise.
          </p>
        </div>
      </div>

      {/* Placeholder for future detailed list / table */}
      <div className="signal-card mt-4 border border-white/10 p-6 text-sm text-slate-300/95">
        <p>
          When live, this section will show a focused list of the most important
          threads across your inbox – ranked by Echo, not by recency.
        </p>
      </div>
    </div>
  );
}
