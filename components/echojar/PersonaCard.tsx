"use client";

import { Sparkles } from "lucide-react";

export type Persona = {
  label: string;
  headline: string;
  summary: string;
};

export function PersonaCard({ persona }: { persona: Persona }) {
  return (
    <div
      className="
        rounded-2xl border border-amber-500/40 bg-amber-500/10
        p-4 shadow-[0_0_32px_rgba(255,191,0,0.20)]
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Today’s Persona
          </div>
        </div>

        <span
          className="
            rounded-full border border-amber-400/60 bg-amber-500/10
            px-2 py-[2px] text-[10px] uppercase tracking-[0.2em]
            text-amber-200
          "
        >
          {persona.label}
        </span>
      </div>

      {/* Headline */}
      <h3 className="text-sm font-medium text-slate-100 mb-1">
        {persona.headline}
      </h3>

      {/* Summary */}
      <p className="text-xs text-slate-400 leading-relaxed">
        {persona.summary}
      </p>

      {/* Echo Insight */}
      <p className="mt-4 text-[10px] text-amber-200/80 italic">
        Echo projects that today will generate 22–35 minutes
        of avoidable cognitive noise.
      </p>
    </div>
  );
}
