"use client";

import { useEffect, useState } from "react";
import { useHeadspace } from "@/app/context/HeadspaceContext";

type EchoNowData = {
  narrative: string;
};

export default function EchoNow() {
  const [data, setData] = useState<EchoNowData | null>(null);
  const [ready, setReady] = useState(false);
  const { mode, setMode } = useHeadspace();

  useEffect(() => {
    let mounted = true;

    fetch("/api/echo-now", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        setData(json);
        // small intentional delay = cognition settling
        setTimeout(() => setReady(true), 120);
      })
      .catch(() => {
        if (!mounted) return;
        setData({ narrative: "Nothing needs your attention right now." });
        setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const density =
    mode === "quiet"
      ? "max-w-xl"
      : mode === "aware"
      ? "max-w-3xl"
      : "max-w-5xl";

  return (
    <main
      className={`
        relative overflow-hidden mx-auto px-6 py-24 space-y-16
        transition-all duration-700 ease-out
        ${density}
      `}
    >
      {/* Ambient glow field */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-10 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-300/12 blur-3xl" />
        <div className="absolute right-10 top-24 h-64 w-64 rounded-full bg-fuchsia-300/10 blur-3xl" />
      </div>
      {/* Header */}
      <div className="text-xs uppercase tracking-[0.34em] text-slate-300/80">
        Echo · now
      </div>

      {/* Narrative container */}
      <div className="min-h-[6rem]">
        <p
          className={`
            text-3xl sm:text-4xl leading-[1.35] font-medium
            bg-gradient-to-b from-white via-sky-100 to-fuchsia-100/85 bg-clip-text text-transparent
            [text-shadow:0_0_24px_rgba(186,230,253,0.35)]
            transition-all duration-1000 ease-out
            ${
              ready
                ? "opacity-100 translate-y-0 blur-0"
                : "opacity-0 translate-y-4 blur-[3px]"
            }
          `}
        >
          {data?.narrative}
        </p>
      </div>

      {/* Headspace Slider (unchanged) */}
      <div className="pt-12">
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-3">
          Headspace
        </div>

        <div className="flex gap-3">
          {[
            { id: "quiet", label: "Quiet" },
            { id: "aware", label: "Aware" },
            { id: "full", label: "Full" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id as any)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                mode === opt.id
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
