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
        mx-auto px-6 py-24 space-y-16
        transition-all duration-700 ease-out
        ${density}
      `}
    >
      {/* Header */}
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
        Echo · now
      </div>

      {/* Narrative container */}
      <div className="min-h-[6rem]">
        <p
          className={`
            text-2xl leading-relaxed text-slate-100
            transition-all duration-700 ease-out
            ${
              ready
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
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
