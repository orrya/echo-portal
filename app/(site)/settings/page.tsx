"use client";

import SettingsForm from "@/components/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="relative mx-auto max-w-5xl px-6 py-10 md:py-14 space-y-14">

      {/* Soft top fade */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

      {/* Label */}
      <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/90">
        ECHO · PREFERENCES
      </p>

      {/* Heading */}
      <div className="space-y-5">
        <h1 className="text-white text-3xl sm:text-4xl font-semibold leading-tight">
          Tune how Echo{" "}
          <span className="bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)] bg-clip-text text-transparent">
            speaks for you.
          </span>
        </h1>

        <p className="max-w-xl text-slate-200/90 sm:text-base leading-relaxed">
          Set the tone of your summaries, choose how assertive Echo should be
          with replies, and connect your Microsoft 365 account.
        </p>
      </div>

      {/* Form panel */}
      <div
        className="
          relative rounded-2xl p-8 space-y-8
          bg-white/[0.05]
          backdrop-blur-2xl
          border border-white/10
          shadow-[0_20px_60px_-10px_rgba(0,0,0,0.65)]
          [background-image:linear-gradient(to_bottom,rgba(255,255,255,0.05),rgba(255,255,255,0.015))]
        "
      >
        <SettingsForm />
      </div>

      {/* Footer */}
      <p className="pt-6 text-center text-[11px] text-slate-400/80">
        Designed by Orrya · The Quiet Intelligence Layer.
      </p>
    </div>
  );
}
