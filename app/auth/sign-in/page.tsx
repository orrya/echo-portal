// app/auth/sign-in/page.tsx
"use client";

import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const handleMicrosoft = () => {
    setLoading(true);
    console.log("SIGN_IN: redirecting to /auth/redirect");
    // Let the server build the Azure URL
    window.location.href = "/auth/redirect";
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0E0B14] text-white">
      {/* Cinematic gradient background */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(circle_at_20%_0%,rgba(168,110,255,0.32),transparent_60%),
              radial-gradient(circle_at_82%_80%,rgba(56,189,248,0.24),transparent_65%),
              linear-gradient(to_bottom,#0E0B14_0%,#120F1C_26%,#1A1528_60%,#09070F_100%)]
        "
      />

      {/* Soft vignette */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(circle_at_left,rgba(15,23,42,0.9),transparent_65%)]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          {/* Brand label */}
          <p className="mb-2 text-[11px] font-semibold tracking-[0.28em] text-slate-300/90">
            ORRYA · QUIET INTELLIGENCE
          </p>

          {/* Title */}
          <h1 className="mb-3 text-2xl font-semibold sm:text-3xl">
            Echo Suite
          </h1>

          {/* Subheadline with gradient accent */}
          <p className="mb-6 text-sm leading-relaxed text-slate-200/90">
            Quiet tools for{" "}
            <span className="bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)] bg-clip-text font-semibold text-transparent">
              louder thinking.
            </span>{" "}
            Connect with your Microsoft 365 account to let Echo sit above your
            inbox, calendar, and tasks.
          </p>

          {/* Microsoft button */}
          <button
            onClick={handleMicrosoft}
            disabled={loading}
            className="
              mb-4 inline-flex w-full items-center justify-center rounded-full
              bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500
              px-5 py-2.5 text-sm font-medium text-white
              shadow-[0_0_28px_rgba(129,140,248,0.7)]
              transition-all
              hover:shadow-[0_0_44px_rgba(129,140,248,0.95)]
              disabled:cursor-not-allowed disabled:opacity-70
            "
          >
            {loading ? "Redirecting to Microsoft…" : "Continue with Microsoft"}
          </button>

          <div className="my-4 flex items-center gap-3 text-[11px] text-slate-400">
            <span className="h-px flex-1 bg-slate-600/40" />
            <span>Single sign-on only</span>
            <span className="h-px flex-1 bg-slate-600/40" />
          </div>

          {/* Notice */}
          <p className="text-[12px] leading-relaxed text-slate-300/85">
            ⚠ Echo Suite currently works only with{" "}
            <span className="font-medium text-slate-50">
              Microsoft 365 work or school accounts
            </span>
            . Personal Outlook / Hotmail accounts aren’t supported yet.
          </p>
        </div>
      </div>
    </div>
  );
}
