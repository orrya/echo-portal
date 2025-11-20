import { getUserFromSession } from "@/lib/getUserFromSession";
import { createClient } from "@supabase/supabase-js";

export default async function EmailPage() {
  const user = await getUserFromSession();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
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
  const followUpEmails = emails?.filter((e) => e.category === "follow_up") ?? [];
  const noiseEmails = emails?.filter((e) => e.category === "noise") ?? [];
  const total = emails?.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 space-y-12">
      {/* Eyebrow label */}
      <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/80">
        ECHO · EMAIL INTELLIGENCE
      </p>

      {/* Hero block */}
      <div className="space-y-4 max-w-3xl">
        <h1
          className="
            text-white text-3xl sm:text-4xl lg:text-[2.4rem]
            font-semibold leading-tight
            drop-shadow-[0_0_18px_rgba(0,0,0,0.5)]
          "
        >
          A calmer view of your{" "}
          <span
            className="
              bg-[linear-gradient(120deg,#f4a8ff,#beb5fd,#3abdf8)]
              bg-clip-text text-transparent
            "
          >
            inbox.
          </span>
        </h1>

        <p className="max-w-2xl text-slate-200/90 sm:text-base leading-relaxed">
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
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

        {/* ACTION CARD */}
        <div
          className="
            relative overflow-hidden rounded-2xl p-6 sm:p-7
            backdrop-blur-2xl bg-white/[0.07]
            border-[1.5px] border-transparent
            [border-image:linear-gradient(125deg,rgba(244,114,182,0.65),rgba(56,189,248,0.65))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_22px_rgba(255,255,255,0.04)]
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(10,16,32,0.5))]
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />

          <div className="relative space-y-3">
            <p className="text-[11px] tracking-[0.22em] text-slate-300/75 font-semibold">
              ACTION BAND
            </p>

            <h2 className="text-xl sm:text-2xl font-semibold text-white">Action</h2>
            <p className="text-sm text-slate-200/95 leading-relaxed">
              High-signal threads that need a decision, reply or clear next step.
            </p>

            {/* Unified metric row */}
            <div className="mt-4 rounded-xl bg-slate-900/50 border border-white/10 px-4 py-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-slate-200/95">
                <span className="h-1.5 w-10 rounded-full bg-gradient-to-r from-fuchsia-400 to-pink-400 animate-pulse" />
                <span>Priority threads</span>
              </span>
              <span className="text-xs text-slate-400/90">
                {actionEmails.length} messages
              </span>
            </div>
          </div>
        </div>

        {/* FOLLOW-UP CARD */}
        <div
          className="
            relative overflow-hidden rounded-2xl p-6 sm:p-7
            backdrop-blur-2xl bg-white/[0.07]
            border-[1.5px] border-transparent
            [border-image:linear-gradient(125deg,rgba(168,85,247,0.65),rgba(56,189,248,0.65))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_22px_rgba(255,255,255,0.04)]
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(10,16,32,0.5))]
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />

          <div className="relative space-y-3">
            <p className="text-[11px] tracking-[0.22em] text-slate-300/75 font-semibold">
              FOLLOW-UP BAND
            </p>

            <h2 className="text-xl sm:text-2xl font-semibold text-white">Follow-up</h2>
            <p className="text-sm text-slate-200/95 leading-relaxed">
              Conversations you’re tracking, where Echo will remind you when things go quiet.
            </p>

            <div className="mt-4 rounded-xl bg-slate-900/50 border border-white/10 px-4 py-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-slate-200/95">
                <span className="h-1.5 w-10 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 animate-pulse" />
                <span>Ongoing threads</span>
              </span>
              <span className="text-xs text-slate-400/90">
                {followUpEmails.length} messages
              </span>
            </div>
          </div>
        </div>

        {/* NOISE CARD — corrected spacing */}
        <div
          className="
            relative overflow-hidden rounded-2xl p-6 sm:p-7
            backdrop-blur-2xl bg-white/[0.07]
            border-[1.5px] border-transparent
            [border-image:linear-gradient(135deg,rgba(148,163,184,0.7),rgba(56,189,248,0.7))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_22px_rgba(255,255,255,0.04)]
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(10,16,32,0.5))]
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />

          <div className="relative space-y-3">
            <p className="text-[11px] tracking-[0.22em] text-slate-300/75 font-semibold">
              NOISE BAND
            </p>

            <h2 className="text-xl sm:text-2xl font-semibold text-white">Noise</h2>
            <p className="text-sm text-slate-200/95 leading-relaxed">
              Low-value updates, promos and FYIs that Echo keeps out of your field of view.
            </p>

            {/* Corrected, aligned metric row */}
            <div className="mt-4 rounded-xl bg-slate-900/50 border border-white/10 px-4 py-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-slate-200/95">
                <span className="h-1.5 w-10 rounded-full bg-gradient-to-r from-slate-400 via-sky-400 to-cyan-300 animate-pulse" />
                <span>Muted traffic</span>
              </span>
              <span className="text-xs text-slate-400/90">
                {noiseEmails.length} messages
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer placeholder */}
      <div className="signal-card mt-6 border border-white/10 p-6 text-sm text-slate-300/95">
        <p>
          When live, this section will show a focused list of the most important
          threads across your inbox — ranked by Echo, not by recency.
        </p>
      </div>
    </div>
  );
}
