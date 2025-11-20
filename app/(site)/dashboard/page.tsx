"use client";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
      {/* Eyebrow + hero */}
      <div className="space-y-4">
        {/* Eyebrow label */}
        <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/70">
          ECHO · DASHBOARD
        </p>

        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Title + intro */}
          <div className="space-y-3 max-w-xl">
            <h1
              className="
                text-white text-3xl sm:text-4xl lg:text-[2.25rem]
                font-semibold leading-tight
                drop-shadow-[0_0_18px_rgba(0,0,0,0.55)]
              "
            >
              Quiet tools for{" "}
              <span
                className="
                  bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)]
                  bg-clip-text text-transparent
                "
              >
                louder thinking.
              </span>
            </h1>

            {/* Shortened for clarity */}
            <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed">
              Your control surface for summaries, email intelligence, and daily
              signal optimisation.
            </p>
          </div>

          {/* Premium status pill */}
          <div
            className="
              flex items-center gap-2
              rounded-full
              border border-violet-400/30
              bg-white/5
              px-3 py-1.5
              text-[11px] sm:text-xs
              font-medium text-slate-200
              backdrop-blur-xl
              shadow-[0_18px_60px_rgba(15,23,42,0.8)]
            "
          >
            <span
              className="
                h-2 w-2 rounded-full
                bg-gradient-to-r from-fuchsia-400 to-sky-400
              "
            />
            <span>Disconnected</span>
          </div>
        </div>
      </div>

      {/* Main intelligence modules */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* TODAY'S SUMMARY */}
        <div
          className="
            relative overflow-hidden rounded-2xl
            backdrop-blur-2xl
            bg-white/6
            border-[1.5px]
            border-transparent
            [border-image:linear-gradient(120deg,rgba(244,114,182,0.5),rgba(56,189,248,0.45))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.65)]
            p-6 sm:p-7
          "
        >
          {/* Soft inner inset */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.45)]" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              SUMMARY · ECHO AM / PM
            </p>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Today&apos;s Summary
              </h2>
              <p className="text-sm text-slate-200/85">
                Echo will generate a calm AM/PM digest once Microsoft 365 is connected.
              </p>
            </div>

            <div className="mt-3 grid gap-3 text-sm text-slate-200/95">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300/90">Status</span>
                <span className="rounded-full border border-slate-500/40 bg-slate-900/40 px-2.5 py-1 text-[11px] uppercase tracking-[0.13em]">
                  Waiting for first sync
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300/80">Next window</span>
                <span className="text-slate-100/95">8:00 AM / 5:00 PM</span>
              </div>

              <p className="pt-1 text-[11px] text-slate-400/85">
                When active, you’ll get structured clarity for your day.
              </p>
            </div>
          </div>
        </div>

        {/* EMAIL INTELLIGENCE */}
        <div
          className="
            relative overflow-hidden rounded-2xl
            backdrop-blur-2xl
            bg-white/6
            border-[1.5px]
            border-transparent
            [border-image:linear-gradient(120deg,rgba(56,189,248,0.5),rgba(244,114,182,0.45))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.65)]
            p-6 sm:p-7
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.45)]" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              EMAIL · SIGNAL BANDS
            </p>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Email Intelligence
              </h2>
              <p className="text-sm text-slate-200/85">
                Echo classifies messages into action, follow-up, or noise.
              </p>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-slate-200/95">
              {[
                { label: "Action", color: "rgba(244,114,182,0.35)" },
                { label: "Follow-up", color: "rgba(129,140,248,0.28)" },
                { label: "Noise", color: "rgba(56,189,248,0.25)" },
              ].map(({ label, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/30 px-3 py-2"
                  style={{
                    background: `linear-gradient(to right, ${color}, transparent)`,
                  }}
                >
                  <span>{label}</span>
                  <span className="text-slate-400/90 text-xs">
                    0 threads — waiting for sync
                  </span>
                </div>
              ))}

              <p className="pt-1 text-[11px] text-slate-400/85">
                This view becomes your triaged inbox once live.
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
