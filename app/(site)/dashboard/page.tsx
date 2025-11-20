"use client";

import { Zap, Mail, Bell } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">

      {/* Eyebrow + hero */}
      <div className="space-y-4">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/70">
          ECHO · DASHBOARD
        </p>

        <div className="flex flex-wrap items-start justify-between gap-4">

          {/* TITLE */}
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
              Your control surface for summaries, email intelligence, and daily signal optimisation.
            </p>
          </div>

          {/* IMPROVED STATUS BADGE */}
          <div
            className="
              flex items-center gap-2 rounded-full
              px-3 py-1.5
              text-[10px] sm:text-[11px] font-medium
              text-slate-200/90
              border border-white/12
              bg-white/[0.05]
              backdrop-blur-2xl
              shadow-[0_0_22px_rgba(168,85,247,0.18)]
            "
          >
            <span
              className="
                h-2 w-2 rounded-full
                bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400
                shadow-[0_0_8px_rgba(168,85,247,0.8)]
              "
            />
            <span>Disconnected</span>
          </div>
        </div>
      </div>

      {/* MAIN MODULES */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* SUMMARY PANEL */}
        <div
          className="
            relative overflow-hidden rounded-2xl
            backdrop-blur-2xl
            bg-white/[0.09]
            border border-white/10
            [box-shadow:0_0_0_1px_rgba(255,255,255,0.04)_inset,0_20px_70px_rgba(0,0,0,0.65)]
            [border-image:linear-gradient(120deg,rgba(244,114,182,0.55),rgba(56,189,248,0.55))1]
            p-6 sm:p-7
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]
            transition-all duration-300 hover:translate-y-[-1px]
            hover:shadow-[0_28px_90px_rgba(0,0,0,0.55)]
          "
        >
          {/* subtle chroma wash */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.05),transparent_70%)]" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              SUMMARY · ECHO AM / PM
            </p>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Today&apos;s Summary
              </h2>
              <p className="text-sm text-slate-200/90">
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
            bg-white/[0.09]
            border border-white/10
            [box-shadow:0_0_0_1px_rgba(255,255,255,0.04)_inset,0_20px_70px_rgba(0,0,0,0.65)]
            [border-image:linear-gradient(120deg,rgba(56,189,248,0.55),rgba(244,114,182,0.55))1]
            p-6 sm:p-7
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]
            transition-all duration-300 hover:translate-y-[-1px]
            hover:shadow-[0_28px_90px_rgba(0,0,0,0.55)]
          "
        >
          {/* chroma wash */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.05),transparent_70%)]" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              EMAIL · SIGNAL BANDS
            </p>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Email Intelligence
              </h2>
              <p className="text-sm text-slate-200/90">
                Echo classifies messages into action, follow-up, or noise.
              </p>
            </div>

            {/* SIGNAL BANDS */}
            <div className="mt-4 grid gap-2 text-sm text-slate-200/95">

              {/* ACTION */}
              <div
                className="
                  flex items-center justify-between rounded-xl px-3 py-2
                  border border-white/10 bg-slate-900/40
                  shadow-[0_-2px_12px_rgba(244,114,182,0.25)]
                "
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-fuchsia-300" />
                  <span>Action</span>
                </div>
                <span className="text-slate-400/90 text-xs">
                  0 threads — waiting for sync
                </span>
              </div>

              {/* FOLLOW-UP */}
              <div
                className="
                  flex items-center justify-between rounded-xl px-3 py-2
                  border border-white/10 bg-slate-900/40
                  shadow-[0_-2px_12px_rgba(129,140,248,0.26)]
                "
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-indigo-300" />
                  <span>Follow-up</span>
                </div>
                <span className="text-slate-400/90 text-xs">
                  0 threads — waiting for sync
                </span>
              </div>

              {/* NOISE */}
              <div
                className="
                  flex items-center justify-between rounded-xl px-3 py-2
                  border border-white/10 bg-slate-900/40
                  shadow-[0_-2px_12px_rgba(56,189,248,0.28)]
                "
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-sky-300" />
                  <span>Noise</span>
                </div>
                <span className="text-slate-400/90 text-xs">
                  0 threads — waiting for sync
                </span>
              </div>

              <p className="pt-1 text-[11px] text-slate-400/85">
                This view becomes your triaged inbox once live.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTNOTE */}
      <div className="pt-4 text-center text-[11px] text-slate-400/80">
        Designed by Orrya · The Quiet Intelligence Layer.
      </div>
    </div>
  );
}
