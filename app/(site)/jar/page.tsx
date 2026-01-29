"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Activity, Info } from "lucide-react";

/* -------------------------------------------------
   TYPES + HELPERS
------------------------------------------------- */

type EchoJarRow = {
  id: string;
  date: string;
  behavioural_summary: string | null;
  emerging_themes: any;
  detected_patterns: any;
  raw_calendar: any;
  raw_email: any;
};

function parseJson<T = any>(value: any, fallback: T): T {
  if (value == null) return fallback;
  if (Array.isArray(value) || typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

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

function humanize(label: string) {
  return label.replace(/_/g, " ");
}

/* -------------------------------------------------
   POSITIVE MEMORY EXTRACTION (QUIET, RARE)
------------------------------------------------- */

function extractPositiveSignals(entry: EchoJarRow): string[] {
  const emails = parseJson<any[]>(entry.raw_email, []);
  const signals: string[] = [];

  for (const e of emails) {
    if (
      e.tone === "positive" &&
      (e.relationshipImpact === "medium" ||
        e.relationshipImpact === "high")
    ) {
      signals.push(
        e.summary ||
          e.subject ||
          "Positive feedback received"
      );
    }
  }

  return signals.slice(0, 3);
}

/* -------------------------------------------------
   MAIN PAGE
------------------------------------------------- */

export default function EchoJarPage() {
  const [entries, setEntries] = useState<EchoJarRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);

  useEffect(() => {
    fetch("/api/echojar/all")
      .then((r) => r.json())
      .then((json) => {
        const list = json.entries ?? [];
        setEntries(list);
        if (list.length) setSelectedId(list[list.length - 1].id);
      });
  }, []);

  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId]
  );

  if (!selected) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-24">
        <p className="text-slate-400">EchoJar hasn’t formed yet.</p>
      </main>
    );
  }

  const dateLabel = formatDateLabel(selected.date);
  const behaviour = selected.behavioural_summary ?? "";
  const achievements = extractPositiveSignals(selected);
  const themes = parseJson<string[]>(selected.emerging_themes, []);
  const patterns = parseJson<string[]>(selected.detected_patterns, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 space-y-16">
      {/* HEADER */}
      <section className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1">
          <span className="text-[10px] uppercase tracking-[0.3em] text-amber-200">
            EchoJar
          </span>
          <span className="h-[3px] w-[3px] rounded-full bg-amber-300" />
          <span className="text-[10px] text-amber-100/80">
            memory
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{dateLabel}</span>
          <span className="h-[1px] w-8 bg-slate-700" />
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-emerald-300" />
            <span>Remembered, not interpreted</span>
          </span>
        </div>

        <p className="max-w-3xl text-[16px] leading-relaxed text-slate-200">
          {behaviour}
        </p>
      </section>

      {/* REMEMBERED MOMENTS */}
      {achievements.length > 0 && (
        <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <div className="text-xs uppercase tracking-[0.24em] text-emerald-200">
              Remembered moments
            </div>
          </div>

          <ul className="space-y-1 text-sm text-emerald-100/80 italic">
            {achievements.map((a, i) => (
              <li key={i}>“{a}”</li>
            ))}
          </ul>
        </section>
      )}

      {/* TIMELINE */}
      <section className="space-y-4">
        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Timeline
        </div>

        <div className="flex gap-3 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
          {entries.map((entry) => {
            const active = entry.id === selected.id;
            const label = formatDateLabel(entry.date).replace(/, \d{4}$/, "");

            return (
              <button
                key={entry.id}
                onClick={() => setSelectedId(entry.id)}
                className={`min-w-[160px] rounded-xl px-3 py-3 text-left text-xs transition ${
                  active
                    ? "border border-amber-400/60 bg-amber-500/10"
                    : "border border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="text-[11px] text-slate-400">{label}</div>
                <div className="mt-1 line-clamp-2 text-[13px] text-slate-200">
                  {entry.behavioural_summary}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* RECALL CONTEXT */}
      <section className="space-y-4">
        <button
          onClick={() => setShowContext((v) => !v)}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white"
        >
          <Info className="h-3 w-3" />
          {showContext ? "Hide remembered context" : "Show remembered context"}
        </button>

        {showContext && (
          <div className="grid gap-8 md:grid-cols-2 text-sm text-slate-300">
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                Themes
              </div>
              <div className="text-slate-300">
                {themes.length
                  ? themes.map(humanize).join(" · ")
                  : "—"}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                Patterns
              </div>
              <div className="text-slate-300">
                {patterns.length
                  ? patterns.map(humanize).join(" · ")
                  : "—"}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
