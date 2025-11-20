"use client";

import SettingsForm from "@/components/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="relative mx-auto max-w-5xl px-6 py-20 space-y-10">

      {/* Label */}
      <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/90">
        ECHO · PREFERENCES
      </p>

      {/* Heading + intro */}
      <div className="space-y-4">
        <h1
          className="
            text-white text-3xl sm:text-4xl
            font-semibold leading-tight"
        >
          Tune how Echo{" "}
          <span
            className="
              bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)]
              bg-clip-text text-transparent
            "
          >
            speaks for you.
          </span>
        </h1>

        <p className="max-w-xl text-slate-200/90 sm:text-base leading-relaxed">
          Set the tone of your summaries, choose how assertive Echo should be
          with replies, and connect your Microsoft 365 account.
        </p>
      </div>

      {/* Form container — Orrya glass aesthetic */}
      <div className="glass-panel p-6 sm:p-8 space-y-6 rounded-2xl">
        <SettingsForm />
      </div>
    </div>
  );
}
