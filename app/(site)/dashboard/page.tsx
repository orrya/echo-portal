"use client";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      {/* Eyebrow + hero */}
      <div className="space-y-4">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/70">
          ECHO · DASHBOARD
        </p>

        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Title */}
          <div className="space-y-3 max-w-xl">
            <h1
              className="
                text-white text-3xl sm:text-4xl lg:text-[2.25rem]
                font-semibold leading-tight
                drop-shadow-[0_0_18px_rgba(0,0,0,0.55)]
              "
            >
              Quiet tools for{" "}
              <span className="bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)] bg-clip-text text-transparent">
                louder thinking.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed">
              Your control surface for summaries, email intelligence, and daily
              signal optimisation.
            </p>
          </div>

          {/* Status pill */}
          <div
            className="
              flex items-center gap-2
              rounded-full
              border border-white/15
              bg-white/[0.06]
              px-3.5 py-1.5
              text-[11px] sm:text-xs
              font-medium text-slate-200
              backdrop-blur-xl
              shadow-[0_18px_60px_rgba(15,23,42,0.85)]
            "
          >
            <span
              className="
                h-2 w-2 rounded-full
                bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400
                shadow-[0_0_10px_rgba(168,85,247,0.9)]
              "
            />
            <span>Disconnected — connect Microsoft 365 in Settings.</span>
          </div>
        </div>
      </div>

      {/* Main modules */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* SUMMARY CARD */}
        <div
          className="
            relative overflow-hidden rounded-2xl
            backdrop-blur-2xl
            bg-white/[0.12]
            border-[1.5px]
            border-transparent
            [border-image:linear-gradient(120deg,rgba(244,114,182,0.6),rgba(56,189,248,0.6))1]
            shadow-[0_24px_80px_rgba(15,23,42,0.95)]
            p-6 sm:p-7
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10),rgba(255,255,255,0.03))]
          "
        >
          {/* Inner vignette */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              SUMMARY · ECHO AM / PM
            </p>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Today&apos;s Summary
              </h2>
              <p className="text-sm text-slate-200/90">
                Echo will generate a calm AM/PM digest once Microsoft 365 is
                connected.
              </p>
            </div>

            <div className="mt-3 grid gap-3 text-sm text-slate-200/95">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300/90">Status</span>
                <span
                  className="
                    rounded-full border border-slate-500/40
                    bg-slate-900/60
                    px-2.5 py-1
                    text-[11px] uppercase tracking-[0.13em]
                  "
                >
                  Waiting for first sync
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300/80">Next window</span>
                <span className="text-slate-100/95">8:00 AM / 5:00 PM</span>
              </div>

              <p className="pt-1 text-[11px] text-slate-400/85">
                When active, you’ll get structured clarity for your day, not a
                wall of messages.
              </p>
            </div>
          </div>
        </div>

        {/* EMAIL INTELLIGENCE */}
        <div
          className="
            relative overflow-hidden rounded-2xl
            backdrop-blur-2xl
            bg-white/[0.12]
            border-[1.5px]
            border-transparent
            [border-image:linear-gradient(120deg,rgba(56,189,248,0.6),rgba(244,114,182,0.6))1]
            shadow-[0_24px_80px_rgba(15,23,42,0.95)]
            p-6 sm:p-7
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10),rgba(255,255,255,0.03))]
          "
        >
          {/* Inner vignette */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              EMAIL · SIGNAL BANDS
            </p>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Email Intelligence
              </h2>
              <p className="text-sm text-slate-200/90">
                Echo classifies messages into action, follow-up, or noise so you
                see conversations, not clutter.
              </p>
            </div>

            {/* SIGNAL BANDS */}
            <div className="mt-4 grid gap-2.5 text-sm text-slate-200/95">
              {/* ACTION */}
              <div
                className="
                  flex items-center justify-between rounded-xl px-3.5 py-2.5
                  bg-[linear-gradient(to_right,rgba(244,114,182,0.22),rgba(15,23,42,0.9))]
                  shadow-[0_-3px_18px_rgba(244,114,182,0.55)]
                "
              >
                <span className="font-medium">Action</span>
                <span className="text-slate-200/85 text-xs">
                  0 threads — waiting for sync
                </span>
              </div>

              {/* FOLLOW-UP */}
              <div
                className="
                  flex items-center justify-between rounded-xl px-3.5 py-2.5
                  bg-[linear-gradient(to_right,rgba(129,140,248,0.22),rgba(15,23,42,0.9))]
                  shadow-[0_-3px_18px_rgba(129,140,248,0.55)]
                "
              >
                <span className="font-medium">Follow-up</span>
                <span className="text-slate-200/85 text-xs">
                  0 threads — waiting for sync
                </span>
              </div>

              {/* NOISE */}
              <div
                className="
                  flex items-center justify-between rounded-xl px-3.5 py-2.5
                  bg-[linear-gradient(to_right,rgba(56,189,248,0.22),rgba(15,23,42,0.9))]
                  shadow-[0_-3px_18px_rgba(56,189,248,0.55)]
                "
              >
                <span className="font-medium">Noise</span>
                <span className="text-slate-200/85 text-xs">
                  0 threads — waiting for sync
                </span>
              </div>

              <p className="pt-1 text-[11px] text-slate-400/85">
                Once live, this becomes your triaged inbox — Echo keeps the
                signal bands full and the noise band heavy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div className="pt-4 text-center text-[11px] text-slate-400/80">
        Designed by Orrya · The Quiet Intelligence Layer.
      </div>
    </div>
  );
}
