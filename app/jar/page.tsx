"use client";

import React, { useMemo, useState } from "react";

// ---------------------------
// Types matching your schema
// ---------------------------

type EchoRecommendations = {
  wins?: string[];
  strains?: string[];
  adjustments?: string[];
};

type EchoPredictiveSignals = {
  focusOutlook?: string | null;
  attentionRisks?: string[];
  energyMap?: Record<string, string> | null;
};

export type EchoJarEntry = {
  id: string;
  user_id: string;
  date: string; // "YYYY-MM-DD"

  raw_email?: any[];
  raw_calendar?: any;
  raw_am_summary?: any;
  raw_pm_summary?: any;

  behavioural_summary?: string;
  emerging_themes?: string[];
  detected_patterns?: string[];
  recommendations?: EchoRecommendations;
  predictive_signals?: EchoPredictiveSignals;
  tags?: string[];

  focus_score?: number | null; // 0–10
  strain_score?: number | null; // 0–10
  momentum_score?: number | null; // 0–10
  consistency_score?: number | null; // 0–10

  created_at?: string;
};

// ---------------------------------------------
// ❗ TEMP: Mock data – replace with Supabase
// ---------------------------------------------

const MOCK_ENTRIES: EchoJarEntry[] = [
  {
    id: "demo-1",
    user_id: "demo-user",
    date: "2025-11-29",
    behavioural_summary:
      "Focused and structured with long uninterrupted deep work blocks, minimal task switching, and limited but purposeful meetings.",
    emerging_themes: ["focus", "low meeting load", "admin"],
    detected_patterns: [
      "Preference for long deep work windows with few context switches or fragmentation",
      "Low noise and distractions during focused periods",
      "Minimal meeting fragmentation and context switching",
    ],
    recommendations: {
      wins: [
        "Sustained deep work sessions totaling 420 minutes",
        "Single well-structured in-person meeting with low noise",
        "High work ability score at 88",
      ],
      strains: [
        "Meeting occupies a fixed 60-minute block",
        "Potential low cognitive load could indicate under-stimulation",
      ],
      adjustments: [
        "Consider scheduling varied cognitive tasks to maintain stimulation throughout day",
        "Maintain meeting frequency to preserve deep work time",
        "Monitor for potential cognitive underload and adjust task complexity accordingly",
      ],
    },
    predictive_signals: {
      focusOutlook:
        "High potential for productive focus maintained by long work blocks, with stable environment supporting concentration.",
      attentionRisks: [
        "Relatively low cognitive load might risk dips in engagement.",
        "Single meeting could disrupt flow if not well-prepared.",
      ],
      energyMap: {
        "09:00–10:00": "High focus – deep work before meeting.",
        "10:00–11:00": "Moderate – in-person meeting, some noise.",
        "11:00–17:00": "High – extended deep work window.",
        Other: "Low – wind-down and recovery.",
      },
    },
    tags: ["admin"],
    focus_score: 8,
    strain_score: 3,
    momentum_score: 7,
    consistency_score: 8,
    created_at: "2025-11-29T12:58:08.645838+00",
  },
];

// -------------------------------------------------
// Utility: pretty date + derived fields per entry
// -------------------------------------------------

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function shortDateLabel(dateStr: string) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    const weekday = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
    }).format(d);
    const day = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
    }).format(d);
    const month = new Intl.DateTimeFormat("en-GB", {
      month: "short",
    }).format(d);
    return `${weekday} ${day} ${month}`;
  } catch {
    return dateStr;
  }
}

function deriveHeadline(entry: EchoJarEntry) {
  if (!entry.behavioural_summary) {
    return "Quiet, low-noise workday.";
  }
  const firstSentence = entry.behavioural_summary.split(".")[0].trim();
  return firstSentence || entry.behavioural_summary;
}

function deriveTomorrowFocus(entry: EchoJarEntry) {
  const focusOutlook = entry.predictive_signals?.focusOutlook;
  if (focusOutlook) return focusOutlook;
  if (entry.recommendations?.adjustments?.length) {
    return entry.recommendations.adjustments[0];
  }
  return "Tomorrow, Echo suggests you protect one clear focus window and keep your meetings honest.";
}

function clampScore(score: number | null | undefined) {
  if (score == null || Number.isNaN(score)) return null;
  return Math.max(0, Math.min(10, score));
}

function scoreToPercent(score: number | null | undefined) {
  const s = clampScore(score);
  if (s == null) return 0;
  return (s / 10) * 100;
}

// -----------------------
// Layout root component
// -----------------------

export default function JarPage() {
  // TODO: replace MOCK_ENTRIES with Supabase data:
  // const entries = dataFromSupabase ?? [];
  const entries = MOCK_ENTRIES;

  const [selectedId, setSelectedId] = useState<string | null>(
    entries[0]?.id ?? null,
  );

  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? entries[0],
    [entries, selectedId],
  );

  return (
    <main className="min-h-screen bg-[#050814] text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-10 pt-10 lg:flex-row lg:gap-10">
        {/* Left: hero + timeline */}
        <div className="flex flex-1 flex-col gap-6">
          <HeroPanel selected={selected} />

          <TimelinePanel
            entries={entries}
            selectedId={selected?.id ?? null}
            onSelect={(id) => setSelectedId(id)}
          />
        </div>

        {/* Right: entry drawer (on desktop always visible; on mobile it sits below) */}
        <div className="mt-2 w-full rounded-3xl border border-white/5 bg-gradient-to-b from-slate-950/70 to-slate-950/40 p-5 shadow-[0_0_40px_rgba(0,0,0,0.65)] lg:mt-0 lg:w-[380px]">
          {selected && <EntryDetail entry={selected} />}
        </div>
      </div>
    </main>
  );
}

// --------------------------
// Hero panel (top section)
// --------------------------

function HeroPanel({ selected }: { selected: EchoJarEntry | undefined }) {
  const focusScore = clampScore(selected?.focus_score ?? null);
  const focusPercent = scoreToPercent(selected?.focus_score ?? null);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950/80 via-slate-950/60 to-slate-900/40 p-6 shadow-[0_26px_80px_rgba(0,0,0,0.75)]">
      {/* soft gold glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,#f1d8a6_0,transparent_60%)] blur-3xl" />
      </div>

      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
            EchoJar
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Your quiet timeline.
          </h1>
          {selected && (
            <>
              <p className="text-xs text-slate-400">
                {formatDate(selected.date)}
              </p>
              <p className="max-w-xl text-sm leading-relaxed text-slate-300">
                {deriveHeadline(selected)}
              </p>
            </>
          )}
        </div>

        {/* Focus pill */}
        <div className="mt-3 flex items-start md:mt-0">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-b from-slate-900/80 to-slate-950/60 p-[1px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950/90">
                <div className="relative h-16 w-16 rounded-full bg-slate-950 shadow-[0_0_0_1px_rgba(248,250,252,0.05)]">
                  <div className="absolute inset-[3px] rounded-full bg-[radial-gradient(circle_at_30%_10%,rgba(241,216,166,0.45)_0,transparent_55%),radial-gradient(circle_at_80%_90%,rgba(248,250,252,0.25)_0,transparent_55%)]" />
                  <div className="relative flex h-full w-full flex-col items-center justify-center text-[11px]">
                    <span className="text-[9px] uppercase tracking-[0.22em] text-slate-400">
                      Focus
                    </span>
                    <span className="text-lg font-semibold text-slate-50">
                      {focusScore ?? "–"}
                    </span>
                    <span className="text-[9px] text-slate-400">/10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ring */}
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-full border border-[rgba(229,199,146,0.35)] blur-[0.5px]" />

            {/* arc bar under pill */}
            <div className="mt-3 h-[3px] w-full rounded-full bg-slate-800/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#e5c792] via-[#f1d8a6] to-[#f9e8c8]"
                style={{ width: `${focusPercent || 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --------------------------
// Timeline list panel
// --------------------------

function TimelinePanel({
  entries,
  selectedId,
  onSelect,
}: {
  entries: EchoJarEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-white/5 bg-slate-950/60 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.75)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
            Timeline
          </p>
          <p className="text-xs text-slate-400">
            Last {entries.length || 0} day
            {entries.length === 1 ? "" : "s"} of your EchoJar.
          </p>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {entries.map((entry) => (
          <TimelineRow
            key={entry.id}
            entry={entry}
            isActive={entry.id === selectedId}
            onClick={() => onSelect(entry.id)}
          />
        ))}
      </div>
    </section>
  );
}

function TimelineRow({
  entry,
  isActive,
  onClick,
}: {
  entry: EchoJarEntry;
  isActive: boolean;
  onClick: () => void;
}) {
  const headline = deriveHeadline(entry);
  const themes = entry.emerging_themes ?? [];
  const focus = clampScore(entry.focus_score ?? null);
  const load = clampScore(entry.strain_score ?? null); // using strain as "load" for now
  const emailDrag = entry.raw_email?.length ?? 0;
  const meetingNoise =
    entry.predictive_signals?.attentionRisks?.length ?? null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition
        ${
          isActive
            ? "bg-gradient-to-r from-slate-900/90 to-slate-900/60 shadow-[0_0_30px_rgba(229,199,146,0.15)] border border-[rgba(229,199,146,0.4)]"
            : "border border-transparent hover:border-[rgba(229,199,146,0.25)] hover:bg-slate-900/60 hover:shadow-[0_0_26px_rgba(229,199,146,0.12)]"
        }`}
    >
      {/* Date badge */}
      <div className="mt-0.5 flex flex-col items-center">
        <div className="rounded-full border border-[rgba(229,199,146,0.45)] bg-slate-950/90 px-3 py-1 text-[11px] font-medium text-[#f1d8a6] shadow-[0_0_18px_rgba(249,224,180,0.4)]">
          {shortDateLabel(entry.date)}
        </div>
      </div>

      {/* Text & chips */}
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="line-clamp-1 text-sm font-medium text-slate-50">
            {headline}
          </p>
          <span className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-500 md:inline">
            View
          </span>
        </div>

        {themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {themes.slice(0, 3).map((theme) => (
              <span
                key={theme}
                className="rounded-full border border-white/5 bg-slate-950/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300"
              >
                {theme}
              </span>
            ))}
          </div>
        )}

        {/* tiny pill metrics */}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <MiniPill label="Focus" value={focus} />
          <MiniPill label="Load" value={load} />
          <MiniPill
            label="Email drag"
            value={emailDrag}
            variant="count"
          />
          <MiniPill
            label="Noise"
            value={meetingNoise}
            variant="count"
          />
        </div>
      </div>
    </button>
  );
}

function MiniPill({
  label,
  value,
  variant = "score",
}: {
  label: string;
  value: number | null | undefined;
  variant?: "score" | "count";
}) {
  const display =
    value == null || Number.isNaN(value) ? "–" : value.toString();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-300">
      <span className="uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="text-[11px] text-[#f1d8a6]">
        {display}
        {variant === "score" && display !== "–" ? "/10" : ""}
      </span>
    </div>
  );
}

// --------------------------
// Entry Detail (drawer card)
// --------------------------

function EntryDetail({ entry }: { entry: EchoJarEntry }) {
  const headline = deriveHeadline(entry);
  const tomorrowFocus = deriveTomorrowFocus(entry);
  const recs = entry.recommendations ?? {};
  const signals = entry.predictive_signals ?? {};

  const focus = clampScore(entry.focus_score);
  const load = clampScore(entry.strain_score);
  const momentum = clampScore(entry.momentum_score);
  const consistency = clampScore(entry.consistency_score);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
          Entry
        </p>
        <h2 className="text-lg font-semibold text-slate-50">
          {headline}
        </h2>
        <p className="text-xs text-slate-400">{formatDate(entry.date)}</p>
      </header>

      {/* Day story */}
      {entry.behavioural_summary && (
        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            day_story
          </p>
          <p className="text-sm leading-relaxed text-slate-200">
            {entry.behavioural_summary}
          </p>
        </section>
      )}

      {/* Wins / Strains */}
      {(recs.wins?.length || recs.strains?.length) && (
        <section className="space-y-3 border-t border-white/5 pt-3">
          {recs.wins?.length ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Wins
              </p>
              <ul className="space-y-1.5 text-sm text-slate-200">
                {recs.wins.map((w, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[6px] h-[3px] w-[3px] rounded-full bg-[#f1d8a6]" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {recs.strains?.length ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Strains
              </p>
              <ul className="space-y-1.5 text-sm text-slate-200">
                {recs.strains.map((s, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[6px] h-[3px] w-[3px] rounded-full bg-slate-500" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}

      {/* Themes */}
      {entry.emerging_themes?.length ? (
        <section className="space-y-2 border-t border-white/5 pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Themes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {entry.emerging_themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full border border-[rgba(229,199,146,0.4)] bg-slate-950/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-100"
              >
                {theme}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Signals */}
      <section className="space-y-2 border-t border-white/5 pt-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Signals
        </p>
        <div className="space-y-2">
          <SignalRow label="Focus" score={focus} />
          <SignalRow label="Load" score={load} />
          <SignalRow label="Momentum" score={momentum} />
          <SignalRow label="Consistency" score={consistency} />
        </div>
      </section>

      {/* Tomorrow focus */}
      <section className="space-y-2 border-t border-white/5 pt-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tomorrow, Echo suggests…
        </p>
        <p className="text-sm leading-relaxed text-slate-200">
          {tomorrowFocus}
        </p>
      </section>

      {/* Attention risks / energy map */}
      {(signals.attentionRisks?.length || signals.energyMap) && (
        <section className="space-y-3 border-t border-white/5 pt-3">
          {signals.attentionRisks?.length ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Attention risks
              </p>
              <ul className="space-y-1.5 text-sm text-slate-200">
                {signals.attentionRisks.map((r, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[6px] h-[3px] w-[3px] rounded-full bg-red-400/80" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {signals.energyMap && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Energy map
              </p>
              <div className="space-y-1.5 text-xs text-slate-200">
                {Object.entries(signals.energyMap).map(
                  ([slot, desc]) => (
                    <div
                      key={slot}
                      className="flex items-start justify-between gap-2 rounded-xl bg-slate-950/70 px-2.5 py-1.5"
                    >
                      <span className="text-[11px] font-medium text-[#f1d8a6]">
                        {slot}
                      </span>
                      <span className="text-[11px] text-slate-300">
                        {desc}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* small footer */}
      <footer className="mt-3 border-t border-white/5 pt-2">
        <p className="text-[10px] text-slate-500">
          Read-only. Calm. Echo keeps the memory so you can keep the
          momentum.
        </p>
      </footer>
    </div>
  );
}

function SignalRow({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  const percent = scoreToPercent(score);
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-[11px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <div className="flex-1 rounded-full bg-slate-900/80">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-[#e5c792] via-[#f1d8a6] to-[#f9e8c8]"
          style={{ width: `${percent || 6}%` }}
        />
      </div>
      <span className="w-8 text-right text-[11px] text-slate-200">
        {score == null ? "–" : `${score}/10`}
      </span>
    </div>
  );
}
