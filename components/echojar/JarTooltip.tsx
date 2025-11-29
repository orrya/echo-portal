// components/echojar/JarTooltip.tsx
'use client';

type JarTooltipProps = {
  label: string;
  description: string;
};

export function JarTooltip({ label, description }: JarTooltipProps) {
  return (
    <div className="relative inline-flex items-center group cursor-help">
      <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-amber-400/60 bg-amber-400/10 text-[9px] font-semibold text-amber-300">
        i
      </span>
      <div className="jar-tooltip-panel">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </div>
        <p className="text-[11px] leading-relaxed text-slate-200">{description}</p>
      </div>
    </div>
  );
}
