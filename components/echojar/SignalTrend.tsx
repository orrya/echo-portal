// components/echojar/SignalTrend.tsx

import { TrendingUp } from "lucide-react";

/** Local inline formatter — no external import required */
function formatDateLabel(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export interface TrendPoint {
  id: string;
  date: string;
  focus: number | null;
  strain: number | null;
}

export function SignalTrend({ series }: { series: TrendPoint[] }) {
  if (!series?.length) return null;

  const maxScore = 10;
  const points = series.slice(-7); // last 7 days

  return (
    <div
      className="
        rounded-2xl border border-slate-800 bg-slate-950/80
        p-4 shadow-[0_0_30px_rgba(15,23,42,0.75)]
      "
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sky-300" />
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Signal trend
          </div>
        </div>
        <span className="text-[10px] text-slate-500">
          Last {points.length} days
        </span>
      </div>

      <div className="flex items-end gap-2 h-24">
        {points.map((p) => {
          const f = p.focus ?? 0;
          const s = p.strain ?? 0;
          const focusHeight = (Math.max(0, f) / maxScore) * 100;
          const strainHeight = (Math.max(0, s) / maxScore) * 100;

          const label = formatDateLabel(p.date).replace(/, \d{4}$/, "");

          return (
            <div key={p.id} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-end gap-1">
                {/* Focus bar */}
                <div
                  className="flex-1 rounded-full bg-amber-500/20"
                  style={{ height: `${focusHeight || 4}%` }}
                  title={`Focus ${f ?? "—"}/10`}
                />

                {/* Strain bar */}
                <div
                  className="flex-1 rounded-full bg-sky-500/20"
                  style={{ height: `${strainHeight || 4}%` }}
                  title={`Load ${s ?? "—"}/10`}
                />
              </div>

              <div className="text-[9px] text-slate-500 text-center">
                {label.split(" ").slice(0, 2).join(" ")}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
          <span>Focus protection</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
          <span>Load / drag</span>
        </div>
      </div>
    </div>
  );
}
