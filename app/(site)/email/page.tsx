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
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
      {/* Eyebrow + hero row */}
      <div className="space-y-4">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/80">
          ECHO · EMAIL INTELLIGENCE
        </p>

        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Title + copy */}
          <div className="space-y-3 max-w-2xl">
            <h1
              className="
                text-white text-3xl sm:text-4xl lg:text-[2.35rem]
                font-semibold leading-tight
                drop-shadow-[0_0_18px_rgba(0,0,0,0.55)]
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

            <p className="max-w-xl text-slate-200/95 sm:text-base leading-relaxed">
              Echo will sit above your Microsoft 365 inbox and quietly organise
              everything into clear priority bands. Below is a preview of how
              your email signal will be grouped.
            </p>

            <p className="text-[11px] text-slate-400/90 pt-1">
              {total === 0
                ? "No email records have been synced to Echo yet."
                : `${total} messages processed · ${actionEmails.length} action · ${followUpEmails.length} follow-up · ${noiseEmails.length} noise`}
            </p>
          </div>

          {/* Status pill */}
          <div
            className="
              flex items-center gap-2
              rounded-full
              border border-violet-400/35
              bg-white/8
              px-3 py-1.5
              text-[11px] sm:text-xs
              font-medium text-slate-200
              backdrop-blur-xl
              shadow-[0_0_16px_rgba(168,85,247,0.35)]
            "
          >
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-fuchsia-400 to-sky-400 animate-pulse" />
            <span>Preview only — connect Microsoft 365 to sync live bands.</span>
          </div>
        </div>
      </div>

      {/* Priority bands */}
      <div className="grid grid-cols-1 gap-6 md:gap-4 md:grid-cols-3">
        {/* ACTION BAND */}
        <div
          className="
            relative overflow-hidden rounded-2xl
            backdrop-blur-2xl
            bg-white/[0.07]
            border-[1.5px] border-transparent
            [border-image:linear-gradient(135deg,rgba(244,114,182,0.7),rgba(52,211,153,0.7))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_22px_rgba(255,255,255,0.04)]
            p-5 sm:p-6
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(15,23,42,0.45))]
          "
        >
          {/* inner haze */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />

          <div className="relative space-y-3">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/75">
              ACTION BAND
            </p>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Action
              </h2>
              <p className="text-sm text-slate-200/95 leading-relaxed">
                High-signal threads that need a decision, reply or clear next
                step.
              </p>
            </div>

            {/* signal strip */}
            <div className="mt-3 rounded-xl bg-slate-900/50 border border-white/10 px-3 py-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-slate-200/95">
                <span className="h-1.5 w-10 rounded-full bg-gradient-to-r from-fuchsia-400 via-pink-400 to-emerald-300 animate-pulse" />
                <span>Priority threads</span>
              </span>
              <span className="text-xs text-slate-400/90">
                {actionEmails.length}{" "}
                {actionEmails.length === 1 ? "message" : "messages"} tagged as
                action.
              </span>
            </div>
          </div>
        </div>

        {/* FOLLOW-UP BAND */}
        <div
          className="
            relative overflow-hidden rounded-2xl
            backdrop-blur-2xl
            bg-white/[0.07]
            border-[1.5px] border-transparent
            [border-image:linear-gradient(135deg,rgba(129,140,248,0.7),rgba(56,189,248,0.7))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_22px_rgba(255,255,255,0.04)]
            p-5 sm:p-6
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(15,23,42,0.45))]
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />

          <div className="relative space-y-3">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/75">
              FOLLOW-UP BAND
            </p>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Follow-up
              </h2>
              <p className="text-sm text-slate-200/95 leading-relaxed">
                Conversations you&apos;re tracking, where Echo will surface
                nudges when things go quiet.
              </p>
            </div>

            <div className="mt-3 rounded-xl bg-slate-900/50 border border-white/10 px-3 py-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-slate-200/95">
                <span className="h-1.5 w-10 rounded-full bg-gradient-to-r from-violet-400 via-indigo-400 to-sky-300 animate-pulse" />
                <span>Watched threads</span>
              </span>
              <span className="text-xs text-slate-400/90">
                {followUpEmails.length}{" "}
                {followUpEmails.length === 1 ? "message" : "messages"} tagged as
                follow-up.
              </span>
            </div>
          </div>
        </div>

        {/* NOISE BAND */}
        <div
          className="
            relative overflow-hidden rounded-2xl
            backdrop-blur-2xl
            bg-white/[0.07]
            border-[1.5px] border-transparent
            [border-image:linear-gradient(135deg,rgba(148,163,184,0.7),rgba(56,189,248,0.7))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_22px_rgba(255,255,255,0.04)]
            p-5 sm:p-6
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(15,23,42,0.45))]
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />

          <div className="relative space-y-3">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/75">
              NOISE BAND
            </p>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Noise
              </h2>
              <p className="text-sm text-slate-200/95 leading-relaxed">
                Low-value updates, promos and FYIs that Echo keeps out of your
                immediate field of view.
              </p>
            </div>

            <div className="mt-3 rounded-xl bg-slate-900/50 border border-white/10 px-3 py-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-slate-200/95">
                <span className="h-1.5 w-10 rounded-full bg-gradient-to-r from-slate-400 via-sky-400 to-cyan-300 animate-pulse" />
                <span>Muted traffic</span>
              </span>
              <span className="text-xs text-slate-400/90">
                {noiseEmails.length}{" "}
                {noiseEmails.length === 1 ? "message" : "messages"} tagged as
                noise.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Future detailed view */}
      <div className="pt-10 mt-2 border-t border-white/5">
        <div
          className="
            relative overflow-hidden rounded-2xl
            backdrop-blur-2xl
            bg-white/[0.06]
            border border-white/18
            shadow-[0_18px_60px_rgba(0,0,0,0.65),0_0_20px_rgba(255,255,255,0.03)]
            p-6 sm:p-7
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_18px_rgba(0,0,0,0.5)]" />
          <div className="relative text-sm text-slate-300/95">
            <p>
              When live, this section will show a focused list of the most
              important threads across your inbox — ranked by Echo&apos;s
              signal, not by recency. Think of it as a single, calm surface for
              what actually matters today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
