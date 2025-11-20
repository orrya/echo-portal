"use client";

export default function DashboardPage() {  return (
    <div className="mx-auto max-w-6xl px-6 py-14 space-y-10">
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

            <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed">
              This is your control panel for summaries, email intelligence and
              daily optimisation. Connect Microsoft 365 to start seeing Echo’s
              live signals for your day.
            </p>
          </div>

          {/* Connection status pill */}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] sm:text-xs font-medium text-slate-200/90 backdrop-blur-md shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
            <span className="h-2 w-2 rounded-full bg-slate-400/90" />
            <span>Disconnected</span>
            <span className="hidden sm:inline text-slate-400/85">
              – connect Microsoft 365 in Settings
            </span>
          </div>
        </div>
      </div>

      {/* Main intelligence modules */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* TODAY'S SUMMARY */}
        <div
          className="
            relative overflow-hidden rounded-2xl
            border border-white/10 bg-white/5
            backdrop-blur-xl
            shadow-[0_24px_80px_rgba(15,23,42,0.9)]
            p-6 sm:p-7
          "
        >
          {/* Accent line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400 opacity-80" />

          {/* Soft radial highlight */}
          <div className="pointer-events-none absolute -top-24 -left-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.28),transparent_70%)] opacity-70" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              SUMMARY · ECHO AM / PM
            </p>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Today&apos;s Summary
              </h2>
              <p className="text-sm text-slate-200/85">
                Echo will generate a calm AM / PM digest of your inbox,
                meetings and tasks once your Microsoft 365 account is
                connected.
              </p>
            </div>

            <div className="mt-3 grid gap-3 text-sm text-slate-200/90">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300/90">Status</span>
                <span className="rounded-full border border-slate-500/50 bg-slate-900/40 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-200/90">
                  Waiting for first sync
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300/80">Next summary window</span>
                <span className="text-slate-100/95">Today · 8:00 AM & 5:00 PM</span>
              </div>

              <p className="pt-1 text-[11px] text-slate-400/85">
                Once live, you’ll see a single, quiet view of what actually
                matters today.
              </p>
            </div>
          </div>
        </div>

        {/* EMAIL INTELLIGENCE */}
        <div
          className="
            relative overflow-hidden rounded-2xl
            border border-white/10 bg-white/5
            backdrop-blur-xl
            shadow-[0_24px_80px_rgba(15,23,42,0.9)]
            p-6 sm:p-7
          "
        >
          {/* Accent line (cooler hue) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 opacity-80" />

          {/* Soft radial highlight */}
          <div className="pointer-events-none absolute -top-24 -right-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.26),transparent_70%)] opacity-80" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              EMAIL · SIGNAL BANDS
            </p>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Email Intelligence
              </h2>
              <p className="text-sm text-slate-200/85">
                Echo classifies each message into action, follow-up or noise,
                so your inbox becomes a signal-first control surface.
              </p>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-slate-200/95">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
                <span className="text-slate-200/95">Action</span>
                <span className="text-slate-400/90 text-xs">
                  0 threads — connect to start surfacing priorities
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/30 px-3 py-2">
                <span className="text-slate-200/95">Follow-up</span>
                <span className="text-slate-400/90 text-xs">
                  0 threads waiting for your response
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/20 px-3 py-2">
                <span className="text-slate-200/95">Noise</span>
                <span className="text-slate-400/90 text-xs">
                  Noise suppression will appear here once live
                </span>
              </div>

              <p className="pt-1 text-[11px] text-slate-400/85">
                When connected, this view becomes your calm, triaged inbox —
                without leaving Outlook.
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
