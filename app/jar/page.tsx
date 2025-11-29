"use client";

import React, { useEffect, useState } from "react";

/* -------------------------------------------------------
   Types – aligned with your echo_jar row
------------------------------------------------------- */

type Recommendations = {
  wins?: string[];
  strains?: string[];
  adjustments?: string[];
};

type PredictiveSignals = {
  focusOutlook?: string | null;
  attentionRisks?: string[] | null;
  energyMap?: Record<string, string> | null;
};

type EchoJarRow = {
  date: string;
  behavioural_summary: string | null;
  emerging_themes: string[] | null;
  detected_patterns: string[] | null;
  recommendations: Recommendations | null;
  predictive_signals: PredictiveSignals | null;
  focus_score: number | null;
  strain_score: number | null;
  momentum_score: number | null;
  consistency_score: number | null;
  raw_email: any[] | null;
  raw_calendar: any | null;
  raw_am_summary: any;
  raw_pm_summary: any;
  tags: string[] | null;
  created_at: string;
};

type SelectedPanel =
  | "none"
  | "wins"
  | "strains"
  | "adjustments"
  | "patterns"
  | "themes"
  | "energy"
  | "attention"
  | "raw";

/* -------------------------------------------------------
   Page Component
------------------------------------------------------- */

export default function EchoJarPage() {
  const [jar, setJar] = useState<EchoJarRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPanel, setSelectedPanel] = useState<SelectedPanel>("none");

  useEffect(() => {
    let cancelled = false;

    async function loadJar() {
      try {
        const res = await fetch("/api/echojar/today");
        const json = await res.json();
        if (!cancelled) {
          setJar(json.jar ?? null);
        }
      } catch (err) {
        console.error("Failed to load EchoJar", err);
        if (!cancelled) setJar(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJar();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-2/3 rounded-xl bg-slate-800/70" />
          <div className="h-24 rounded-3xl bg-slate-900/70" />
          <div className="h-64 rounded-3xl bg-slate-900/70" />
        </div>
      </div>
    );
  }

  if (!jar) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-slate-300">
        <h1 className="text-2xl font-semibold text-white">
          EchoJar hasn&apos;t formed yet.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-slate-400">
          Once Echo has seen enough of your day (email, meetings, summaries),
          it will start forming a daily EchoJar entry with patterns, themes and
          signals. Check back after your AM and PM summaries have run.
        </p>
      </div>
    );
  }

  const createdLabel = new Date(jar.created_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateLabel = new Date(jar.date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const focus = jar.focus_score;
  const strain = jar.strain_score;
  const momentum = jar.momentum_score;
  const consistency = jar.consistency_score;

  const recs = jar.recommendations || {};
  const signals = jar.predictive_signals || {};

  const themes = jar.emerging_themes || [];
  const patterns = jar.detected_patterns || [];

  const activePanelTitle = (() => {
    switch (selectedPanel) {
      case "wins":
        return "Wins";
      case "strains":
        return "Strains";
      case "adjustments":
        return "Adjustments";
      case "patterns":
        return "Behavioural patterns";
      case "themes":
        return "Emerging themes";
      case "energy":
        return "Energy map";
      case "attention":
        return "Attention risks";
      case "raw":
        return "Raw signals";
      default:
        return "EchoJar details";
    }
  })();

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 space-y-10">
      {/* ---------------------------------------------------
         HERO
      ---------------------------------------------------- */}
      <header className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-400 uppercase">
              Echo · Daily Jar
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold leading-tight text-white">
              Your quiet{" "}
              <span className="bg-[linear-gradient(120deg,#facc15,#eab308,#f97316)] bg-clip-text text-transparent">
                operating system
              </span>{" "}
              for today.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300">
              EchoJar condenses email, meetings and summaries into a single
              daily intelligence object — themes, patterns and signals about
              how you actually worked.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-slate-950/80 px-4 py-1.5 shadow-[0_0_25px_rgba(251,191,36,0.25)]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-200">
                Daily Jar · Live
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {dateLabel} · captured at{" "}
              <span className="text-slate-200">{createdLabel}</span>
            </div>
          </div>
        </div>

        {/* Key tags pill row */}
        <div className="flex flex-wrap gap-2">
          {themes.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100"
            >
              {t}
            </span>
          ))}
          {themes.length === 0 && (
            <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
              Echo is still learning your themes.
            </span>
          )}
        </div>
      </header>

      {/* ---------------------------------------------------
         GRID: LEFT (overview) • RIGHT (detail panel)
      ---------------------------------------------------- */}
      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] gap-8">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Signal Bars */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-5 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold tracking-[0.22em] text-slate-300/90 uppercase">
                  Today&apos;s signals
                </h2>
                <InfoTooltip label="What is this?">
                  These four bars are compact scores EchoJar derives from your
                  calendar, email and summaries. They don&apos;t judge you —
                  they describe how the day is structured and how it likely
                  felt.
                </InfoTooltip>
              </div>
              <span className="text-[11px] text-slate-500">
                0 = quiet · 10 = intense
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <SignalBar
                label="Focus"
                score={focus}
                accent="focus"
                onClick={() => setSelectedPanel("energy")}
              >
                How much uninterrupted, usable attention the day gave you.
              </SignalBar>

              <SignalBar
                label="Strain"
                score={strain}
                accent="strain"
                onClick={() => setSelectedPanel("strains")}
              >
                How much load, friction and noise the day carried.
              </SignalBar>

              <SignalBar
                label="Momentum"
                score={momentum}
                accent="momentum"
                onClick={() => setSelectedPanel("wins")}
              >
                Whether the day built energy and progress or stalled.
              </SignalBar>

              <SignalBar
                label="Consistency"
                score={consistency}
                accent="consistency"
                onClick={() => setSelectedPanel("patterns")}
              >
                How similar this day is to your usual rhythm.
              </SignalBar>
            </div>
          </div>

          {/* Behavioural Summary */}
          <div className="rounded-3xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 px-6 py-5 shadow-[0_0_50px_rgba(251,191,36,0.22)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold tracking-[0.22em] text-amber-200 uppercase">
                  Behavioural summary
                </h2>
                <InfoTooltip label="In plain English">
                  A short, human-readable description of how you actually
                  worked today — derived from your meetings, email and Echo
                  summaries.
                </InfoTooltip>
              </div>
              <div className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100">
                EchoJar · v1
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-amber-50/90">
              {jar.behavioural_summary ||
                "Echo is still forming a view of how you worked today."}
            </p>
          </div>

          {/* Themes & Patterns */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold tracking-[0.22em] text-slate-300/90 uppercase">
                  Themes & patterns
                </h2>
                <InfoTooltip label="What Echo sees">
                  Themes are the labels Echo keeps seeing (admin, focus,
                  meetings). Patterns are the behavioural loops it infers over
                  time.
                </InfoTooltip>
              </div>
              <button
                onClick={() => setSelectedPanel("patterns")}
                className="text-[11px] text-amber-200 underline underline-offset-4 hover:text-amber-100"
              >
                Open in detail panel
              </button>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Themes
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {themes.length === 0 && (
                    <span className="rounded-full border border-slate-700/70 bg-slate-900/90 px-3 py-1 text-[11px] text-slate-400">
                      None detected yet.
                    </span>
                  )}
                  {themes.map((t) => (
                    <span
                      key={t}
                      onClick={() => setSelectedPanel("themes")}
                      className="cursor-pointer rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-100 hover:border-amber-400/70 hover:bg-amber-500/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Patterns
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                  {patterns.length === 0 && (
                    <li className="text-slate-500">
                      Echo will start spotting patterns as more days accumulate.
                    </li>
                  )}
                  {patterns.slice(0, 3).map((p, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-[3px] h-1 w-1 rounded-full bg-amber-400" />
                      <span>{p}</span>
                    </li>
                  ))}
                  {patterns.length > 3 && (
                    <li className="text-[11px] text-slate-500">
                      + {patterns.length - 3} more in the detail panel.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Actionable Blocks: Wins / Strains / Adjustments */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold tracking-[0.22em] text-slate-300/90 uppercase">
                Echo actions
              </h2>
              <InfoTooltip label="How to use this">
                These blocks are not tasks. They&apos;re observations Echo
                thinks are worth noticing so you can nudge how the next few days
                feel.
              </InfoTooltip>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <ActionCard
                title="Wins"
                items={recs.wins || []}
                tone="win"
                onClick={() => setSelectedPanel("wins")}
              />
              <ActionCard
                title="Strains"
                items={recs.strains || []}
                tone="strain"
                onClick={() => setSelectedPanel("strains")}
              />
              <ActionCard
                title="Adjustments"
                items={recs.adjustments || []}
                tone="adjust"
                onClick={() => setSelectedPanel("adjustments")}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN – DETAIL PANEL */}
        <aside className="rounded-3xl border border-slate-800 bg-slate-950/90 px-5 py-5 shadow-[0_0_60px_rgba(15,23,42,0.8)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-400 uppercase">
                {activePanelTitle}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Click any card on the left to change what appears here.
              </p>
            </div>
            <button
              onClick={() => setSelectedPanel("none")}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-300 hover:border-slate-500"
            >
              Clear
            </button>
          </div>

          <div className="mt-4 border-t border-slate-800/80 pt-4 text-sm text-slate-200 space-y-3">
            {renderDetailPanel(selectedPanel, jar)}
          </div>
        </aside>
      </section>
    </div>
  );
}

/* -------------------------------------------------------
   Signal bar component with tooltip
------------------------------------------------------- */

function SignalBar({
  label,
  score,
  accent,
  onClick,
  children,
}: {
  label: string;
  score: number | null;
  accent: "focus" | "strain" | "momentum" | "consistency";
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const safe = typeof score === "number" ? score : null;
  const pct = safe !== null ? Math.max(0, Math.min(10, safe)) * 10 : 0;

  const accentClass =
    accent === "focus"
      ? "from-amber-400 to-amber-200"
      : accent === "strain"
      ? "from-rose-500 to-amber-300"
      : accent === "momentum"
      ? "from-emerald-400 to-sky-300"
      : "from-sky-400 to-amber-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            {label}
          </span>
          <InfoTooltip label={label}>{children}</InfoTooltip>
        </div>
        <span className="text-[11px] text-slate-300">
          {safe !== null ? `${safe}/10` : "—"}
        </span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-slate-900/90">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${accentClass} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}

/* -------------------------------------------------------
   Action cards – wins / strains / adjustments
------------------------------------------------------- */

function ActionCard({
  title,
  items,
  tone,
  onClick,
}: {
  title: string;
  items: string[];
  tone: "win" | "strain" | "adjust";
  onClick?: () => void;
}) {
  const border =
    tone === "win"
      ? "border-emerald-400/60"
      : tone === "strain"
      ? "border-rose-400/60"
      : "border-amber-400/60";

  const bg =
    tone === "win"
      ? "bg-emerald-500/5"
      : tone === "strain"
      ? "bg-rose-500/5"
      : "bg-amber-500/5";

  const pillText =
    tone === "win" ? "Momentum" : tone === "strain" ? "Load" : "Next moves";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full flex-col rounded-2xl border px-4 py-3 text-left ${border} ${bg} hover:border-amber-400/80 hover:bg-slate-900/80 transition-colors`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-100">{title}</span>
        <span className="rounded-full border border-slate-600/70 bg-slate-900/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">
          {pillText}
        </span>
      </div>
      <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300">
        {items.length === 0 && (
          <li className="text-slate-500">Nothing obvious here today.</li>
        )}
        {items.slice(0, 3).map((item, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="mt-[3px] h-1 w-1 rounded-full bg-amber-400 group-hover:bg-amber-300" />
            <span>{item}</span>
          </li>
        ))}
        {items.length > 3 && (
          <li className="text-[10px] text-slate-500">
            + {items.length - 3} more in detail panel.
          </li>
        )}
      </ul>
    </button>
  );
}

/* -------------------------------------------------------
   Detail panel renderer
------------------------------------------------------- */

function renderDetailPanel(panel: SelectedPanel, jar: EchoJarRow) {
  const recs = jar.recommendations || {};
  const signals = jar.predictive_signals || {};
  const themes = jar.emerging_themes || [];
  const patterns = jar.detected_patterns || [];

  if (panel === "none") {
    return (
      <p className="text-sm text-slate-400">
        Start by clicking a signal, theme, pattern or action card on the left.
        EchoJar will open a deeper view here without cluttering the main page.
      </p>
    );
  }

  if (panel === "wins") {
    const wins = recs.wins || [];
    return (
      <DetailList
        title="Today’s wins"
        items={wins}
        empty="Echo didn’t detect clear wins yet — as more summaries arrive, this will fill in."
      />
    );
  }

  if (panel === "strains") {
    const strains = recs.strains || [];
    return (
      <DetailList
        title="Strains and friction"
        items={strains}
        empty="No obvious strains detected. On heavy days, this will highlight what’s quietly draining you."
      />
    );
  }

  if (panel === "adjustments") {
    const adj = recs.adjustments || [];
    return (
      <DetailList
        title="Suggested adjustments"
        items={adj}
        empty="Echo will start proposing tiny adjustments once it sees a few days of repeated patterns."
      />
    );
  }

  if (panel === "patterns") {
    return (
      <DetailList
        title="Behavioural patterns Echo sees"
        items={patterns}
        empty="Patterns emerge across multiple days. Once Echo has enough data, it will describe the loops it keeps seeing."
      />
    );
  }

  if (panel === "themes") {
    return (
      <DetailList
        title="Themes Echo is tracking"
        items={themes}
        empty="Themes will start to appear as Echo sees repeated kinds of work — admin, deep work, meetings, comms and more."
      />
    );
  }

  if (panel === "energy") {
    const map = signals.energyMap || {};
    const entries = Object.entries(map);
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-100">Energy map</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">
            Echo hasn&apos;t mapped today&apos;s energy curve yet. Once more
            days accumulate, this will show where you naturally run hottest.
          </p>
        ) : (
          <ul className="mt-1 space-y-1.5 text-sm text-slate-200">
            {entries.map(([block, desc]) => (
              <li key={block} className="flex gap-3">
                <span className="min-w-[96px] text-[11px] font-medium uppercase tracking-[0.16em] text-amber-200">
                  {block}
                </span>
                <span className="text-slate-200">{desc}</span>
              </li>
            ))}
          </ul>
        )}
        {signals.focusOutlook && (
          <p className="mt-3 text-xs text-slate-400">
            Focus outlook:{" "}
            <span className="text-slate-200">{signals.focusOutlook}</span>
          </p>
        )}
      </div>
    );
  }

  if (panel === "attention") {
    const risks = signals.attentionRisks || [];
    return (
      <DetailList
        title="Attention risks"
        items={risks}
        empty="When Echo sees repeated sources of drag or distraction, they’ll appear here."
      />
    );
  }

  if (panel === "raw") {
    return (
      <div className="space-y-2 text-xs text-slate-300">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Raw JSON snapshot
        </p>
        <pre className="max-h-80 overflow-auto rounded-xl bg-slate-950/90 p-3 text-[11px] leading-relaxed text-slate-300">
          {JSON.stringify(jar, null, 2)}
        </pre>
      </div>
    );
  }

  return null;
}

/* -------------------------------------------------------
   Simple detail list component
------------------------------------------------------- */

function DetailList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-100">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="mt-1 space-y-1.5 text-sm text-slate-200">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Tiny tooltip component
------------------------------------------------------- */

function InfoTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 bg-slate-900 text-[9px] font-semibold text-slate-300 hover:border-amber-400 hover:text-amber-200">
        i
      </span>
      {open && (
        <div className="absolute left-1/2 top-6 z-20 w-64 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-[11px] text-slate-200 shadow-[0_15px_50px_rgba(0,0,0,0.7)]">
          <p className="font-semibold text-[10px] uppercase tracking-[0.16em] text-amber-300">
            {label}
          </p>
          <p className="mt-1 text-[11px] text-slate-200">{children}</p>
        </div>
      )}
    </span>
  );
}
