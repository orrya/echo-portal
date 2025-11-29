// app/jar/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Info,
  Sparkles,
  TrendingUp,
  Brain,
  Activity,
  Clock3,
} from "lucide-react";

type EchoJarRow = {
  id: string;
  date: string;
  behavioural_summary: string | null;
  emerging_themes: any;
  detected_patterns: any;
  recommendations: any;
  predictive_signals: any;
  tags: any;
  focus_score: number | null;
  strain_score: number | null;
  momentum_score: number | null;
  consistency_score: number | null;
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

function InfoBadge({ text }: { text: string }) {
  return (
    <span
      className="
        ml-1 inline-flex h-4 w-4 items-center justify-center
        rounded-full border border-slate-500/60
        text-[10px] text-slate-300/80
        bg-slate-900/70
      "
      title={text}
    >
      i
    </span>
  );
}

function ScorePill({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: number | null | undefined;
  tooltip: string;
}) {
  const display = value == null ? "—" : value.toString();

  return (
    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
      <div className="flex items-center gap-1 text-slate-300">
        <span className="uppercase tracking-[0.18em] text-[10px] sm:text-[11px]">
          {label}
        </span>
        <InfoBadge text={tooltip} />
      </div>
      <div
        className="
          flex h-7 min-w-[52px] items-center justify-center
          rounded-full border border-slate-700/70 bg-slate-900/80
          px-3 text-[11px] sm:text-[12px]
        "
      >
        {display}
        {display !== "—" && <span className="ml-0.5 text-[10px]">/10</span>}
      </div>
    </div>
  );
}

function FocusGauge({ score }: { score: number | null }) {
  const clamped = score == null ? 0 : Math.max(0, Math.min(10, score));
  const percentage = (clamped / 10) * 100;

  return (
    <div className="flex flex-col items-end gap-4">
      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
        Focus
      </div>

      <div className="relative flex items-center justify-center">
        {/* Gold glow */}
        <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl" />

        {/* Outer ring */}
        <div
          className="
            relative flex h-24 w-24 items-center justify-center
            rounded-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950
            border border-slate-700/70 shadow-[0_0_40px_rgba(251,191,36,0.18)]
          "
        >
          {/* Progress ring */}
          <div
            className="absolute inset-1 rounded-full border-[3px]"
            style={{
              borderImage: `conic-gradient(from 270deg, #facc15 ${percentage}%, rgba(30,64,175,0.4) ${percentage}% 100%) 1`,
            }}
          />

          {/* Inner circle */}
          <div
            className="
              relative flex h-16 w-16 flex-col items-center justify-center
              rounded-full bg-slate-950
            "
          >
            <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
              Score
            </span>
            <span className="mt-0.5 text-2xl font-semibold text-amber-300">
              {clamped}
            </span>
            <span className="text-[9px] text-slate-500">/10</span>
          </div>
        </div>
      </div>

      <p className="max-w-xs text-[11px] leading-relaxed text-slate-400">
        <span className="font-medium text-slate-300">Focus score</span> is a
        0–10 signal for how protected your best work windows were today.
        <br />
        <span className="text-slate-300">
          1–3 = fragmented · 4–6 = mixed · 7–10 = well-protected deep work.
        </span>
      </p>
    </div>
  );
}

function computeTimeSaved(entry: EchoJarRow) {
  const rawEmail = parseJson<any[]>(entry.raw_email, []);
  const rawCalendar = parseJson<any>(entry.raw_calendar, {});

  // 1) Action-like emails → 45s each
  const actionEmails = rawEmail.filter((e) => {
    const category = (e?.Category || "").toLowerCase();
    const theme = (e?.theme || "").toLowerCase();
    return (
      category === "action" ||
      category === "urgent" ||
      theme === "action" ||
      theme === "followup"
    );
  }).length;
  const emailMinutes = (actionEmails * 45) / 60;

  // 2) Meeting load → assume 20% protected / avoided / shortened
  const today = rawCalendar?.today || {};
  const calInsights = today?.calendar_insights || {};
  const meetingMinutes = Number(calInsights.meetingMinutes ?? 0);
  const meetingSaved = meetingMinutes * 0.2;

  // 3) High-energy deep blocks from predictive_signals.energyMap → 10 min each
  const signals = parseJson<any>(entry.predictive_signals, {});
  const energyMap = signals.energyMap || {};
  const deepBlocks = Object.values<string>(energyMap).filter((v) =>
    typeof v === "string"
      ? v.toLowerCase().startsWith("high") &&
        !v.toLowerCase().includes("meeting")
      : false
  ).length;
  const deepMinutes = deepBlocks * 10;

  const total = Math.round(emailMinutes + meetingSaved + deepMinutes);

  return {
    total,
    breakdown: {
      actionEmails,
      emailMinutes: Math.round(emailMinutes),
      meetingMinutes,
      meetingSaved: Math.round(meetingSaved),
      deepBlocks,
      deepMinutes,
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Persona + Trend + Category helpers
// ──────────────────────────────────────────────────────────────

type Persona = {
  id: string;
  label: string;
  tone: "calm" | "loaded" | "recovering" | "ambitious";
  summary: string;
  headline: string;
};

function derivePersona(selected: EchoJarRow | null): Persona {
  if (!selected) {
    return {
      id: "unknown",
      label: "Forming",
      tone: "calm",
      headline: "EchoJar is still learning your rhythm.",
      summary:
        "As more days accumulate, Echo will classify your default working pattern and update this persona.",
    };
  }

  const f = selected.focus_score ?? 0;
  const s = selected.strain_score ?? 0;
  const m = selected.momentum_score ?? 0;

  // Deep focus, low strain
  if (f >= 7 && s <= 4) {
    return {
      id: "deep-operator",
      label: "Deep Operator",
      tone: "calm",
      headline: "Your day is built for deep work.",
      summary:
        "Focus windows stay clean and meetings aren’t overwhelming. Echo sees a pattern of deliberate work and low fragmentation.",
    };
  }

  // High strain, lower focus
  if (s >= 7 && f <= 5) {
    return {
      id: "load-bearer",
      label: "Load Bearer",
      tone: "loaded",
      headline: "You’re carrying a heavy operational load.",
      summary:
        "Calendar and email drag are eating into focus. Echo flags this pattern as structurally noisy and energy intensive.",
    };
  }

  // Moderate focus, rising momentum
  if (m >= 6 && f >= 5) {
    return {
      id: "builder",
      label: "Momentum Builder",
      tone: "ambitious",
      headline: "You’re steadily compounding progress.",
      summary:
        "Days aren’t perfectly clean, but important work keeps moving forward. Echo sees momentum building across your week.",
    };
  }

  // Otherwise: recalibrating
  return {
    id: "recalibrating",
    label: "Recalibrating",
    tone: "recovering",
    headline: "Today’s pattern is still settling.",
    summary:
      "Signals are mixed — some focus, some drag. Echo treats this as a calibration day rather than a strong pattern.",
  };
}

type TrendPoint = {
  id: string;
  date: string;
  focus: number | null;
  strain: number | null;
};

function buildSignalSeries(entries: EchoJarRow[]): TrendPoint[] {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      id: e.id,
      date: e.date,
      focus: e.focus_score,
      strain: e.strain_score,
    }));
}

type CategoryInsight = {
  label: string;
  count: number;
  lastSeen: string;
};

function computeCategoryInsights(entries: EchoJarRow[]): CategoryInsight[] {
  const map = new Map<string, { count: number; lastSeen: string }>();

  for (const entry of entries) {
    const themes: string[] = parseJson(entry.emerging_themes, []);
    const tags: string[] = parseJson(entry.tags, []);
    const all = [...themes, ...tags];

    for (const rawLabel of all) {
      const label = (rawLabel || "").toString().trim().toLowerCase();
      if (!label) continue;
      const current = map.get(label);
      if (!current) {
        map.set(label, { count: 1, lastSeen: entry.date });
      } else {
        current.count += 1;
        if (entry.date > current.lastSeen) {
          current.lastSeen = entry.date;
        }
      }
    }
  }

  return Array.from(map.entries())
    .map(([label, v]) => ({ label, count: v.count, lastSeen: v.lastSeen }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

// ──────────────────────────────────────────────────────────────
// Small visual components
// ──────────────────────────────────────────────────────────────

function PersonaCard({ persona }: { persona: Persona }) {
  return (
    <div
      className="
        rounded-2xl border border-slate-800 bg-slate-950/80
        p-4 shadow-[0_0_32px_rgba(15,23,42,0.85)]
      "
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Today&apos;s persona
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
      <h3 className="text-sm font-medium text-slate-100 mb-1">
        {persona.headline}
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed">
        {persona.summary}
      </p>
    </div>
  );
}

function SignalTrend({ series }: { series: TrendPoint[] }) {
  if (!series.length) return null;

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
            <div
              key={p.id}
              className="flex flex-1 flex-col items-center gap-1"
            >
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

function CategoryInsightsCard({ items }: { items: CategoryInsight[] }) {
  if (!items.length) return null;

  return (
    <div
      className="
        rounded-2xl border border-slate-800 bg-slate-950/80
        p-4 shadow-[0_0_26px_rgba(15,23,42,0.7)]
      "
    >
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-4 w-4 text-violet-300" />
        <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
          Category insights
        </div>
        <InfoBadge text="Top repeated themes and tags Echo sees across your recent days." />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="
              flex flex-col gap-1 rounded-xl border border-slate-800
              bg-slate-950/80 px-3 py-2
            "
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                {item.label}
              </span>
              <span className="text-[11px] text-slate-400">
                {item.count}×
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              Last seen {formatDateLabel(item.lastSeen).replace(/, \d{4}$/, "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────

export default function EchoJarPage() {
  const [entries, setEntries] = useState<EchoJarRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/echojar/all");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        const list: EchoJarRow[] = json.entries ?? [];
        setEntries(list);
        if (list.length > 0) {
          setSelectedId(list[list.length - 1].id); // default to most recent
        }
      } catch (e: any) {
        console.error("[EchoJar] fetch error", e);
        setError("EchoJar isn’t available yet.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? entries[entries.length - 1] ?? null,
    [entries, selectedId]
  );

  // Normalised fields for the selected day
  const themes: string[] = parseJson(selected?.emerging_themes, []);
  const patterns: string[] = parseJson(selected?.detected_patterns, []);
  const recommendations = parseJson<any>(selected?.recommendations, {});
  const signals = parseJson<any>(selected?.predictive_signals, {});
  const wins: string[] = recommendations.wins || [];
  const strains: string[] = recommendations.strains || [];
  const adjustments: string[] = recommendations.adjustments || [];
  const tags: string[] = parseJson(selected?.tags, []);
  const behaviour = selected?.behavioural_summary ?? "";

  const timeSaved = selected ? computeTimeSaved(selected) : null;

  const focusScore = selected?.focus_score ?? null;
  const strainScore = selected?.strain_score ?? null;
  const momentumScore = selected?.momentum_score ?? null;
  const consistencyScore = selected?.consistency_score ?? null;

  const dateLabel = selected ? formatDateLabel(selected.date) : "";
  const headline = "Your quiet behavioural OS.";

  const persona = derivePersona(selected);
  const series = buildSignalSeries(entries);
  const categoryInsights = computeCategoryInsights(entries);

  // ──────────────────────────────────────────────────────────────
  // Loading / empty states
  // ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-6">
        <p className="text-sm text-slate-400">Loading EchoJar…</p>
      </main>
    );
  }

  if (error || !selected) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-6">
        <div className="max-w-xl">
          <h1 className="mb-3 text-3xl sm:text-4xl font-semibold">
            EchoJar hasn&apos;t formed yet.
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Once Echo has seen enough of your day (email, meetings, summaries),
            it will start forming a daily EchoJar entry with patterns, themes
            and early predictions. Check back after a few AM and PM summaries
            have been generated.
          </p>
        </div>
      </main>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // MAIN UI
  // ──────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      {/* HERO ROW */}
      <section className="grid gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] items-start">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-amber-200">
              EchoJar
            </span>
            <span className="h-[3px] w-[3px] rounded-full bg-amber-300" />
            <span className="text-[10px] text-amber-100/80">
              behavioural intelligence
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold">
            {headline}{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-sky-300 bg-clip-text text-transparent">
              for your workday.
            </span>
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{dateLabel}</span>
            <span className="h-[1px] w-8 bg-slate-700" />
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-300" />
              <span>Echo learns from every AM / PM summary, email and meeting.</span>
            </span>
          </div>

          <p className="max-w-2xl text-sm sm:text-[15px] leading-relaxed text-slate-300">
            {behaviour ||
              "Once Echo has seen enough of your day, it will form a calm behavioural summary here — not of what you did, but of how you tend to work."}
          </p>
        </div>

        <FocusGauge score={focusScore} />
      </section>

      {/* TIMELINE ROW */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Timeline
            </div>
            <div className="text-[11px] text-slate-500">
              Last {entries.length} EchoJar {entries.length === 1 ? "day" : "days"}
            </div>
          </div>
        </div>

        <div
          className="
            flex gap-3 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/60
            px-4 py-3
          "
        >
          {entries.map((entry) => {
            const active = entry.id === selected.id;
            const label = formatDateLabel(entry.date).replace(/, \d{4}$/, "");
            const entryThemes: string[] = parseJson(entry.emerging_themes, []);
            return (
              <button
                key={entry.id}
                onClick={() => setSelectedId(entry.id)}
                className={`
                  flex min-w-[150px] flex-col items-start gap-1 rounded-xl px-3 py-2
                  text-left text-xs transition-all
                  ${
                    active
                      ? "bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-violet-500/10 border border-amber-400/60 shadow-[0_0_30px_rgba(251,191,36,0.18)]"
                      : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
                  }
                `}
              >
                <span className="text-[11px] text-slate-400">{label}</span>
                <div className="line-clamp-1 text-[12px] text-slate-100">
                  {entry.behavioural_summary || "EchoJar summary"}
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {entryThemes.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="
                        rounded-full bg-slate-950/80 px-2 py-[1px]
                        text-[10px] uppercase tracking-[0.18em] text-slate-400
                      "
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* MAIN CONTENT GRID */}
      <section className="grid gap-10 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* LEFT COLUMN – ENTRY DETAILS */}
        <div className="space-y-8">
          {/* Entry heading */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Entry
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold leading-snug">
              {behaviour}
            </h2>
          </div>

          {/* Themes */}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Themes
            </div>
            <div className="flex flex-wrap gap-2">
              {themes.length === 0 && (
                <p className="text-sm text-slate-500">
                  Echo didn&apos;t detect clear themes today yet.
                </p>
              )}
              {themes.map((t) => (
                <span
                  key={t}
                  className="
                    rounded-full border border-slate-700/70 bg-slate-900/80
                    px-3 py-1 text-[11px] uppercase tracking-[0.18em]
                  "
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Patterns */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Patterns
              </div>
              <InfoBadge text="Simple, interpretable patterns Echo keeps an eye on across days." />
            </div>
            <ul className="space-y-1 text-sm text-slate-300">
              {patterns.length === 0 && (
                <li className="text-slate-500 text-sm">
                  No clear patterns detected yet.
                </li>
              )}
              {patterns.map((p, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-[6px] h-[4px] w-[4px] rounded-full bg-slate-500" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Wins & Strains */}
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Wins
                </div>
              </div>
              <ul className="space-y-1 text-sm text-slate-300">
                {wins.length === 0 && (
                  <li className="text-slate-500 text-sm">
                    Echo didn&apos;t log specific wins for today.
                  </li>
                )}
                {wins.map((w, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[6px] h-[4px] w-[4px] rounded-full bg-emerald-400" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Strains
                </div>
              </div>
              <ul className="space-y-1 text-sm text-slate-300">
                {strains.length === 0 && (
                  <li className="text-slate-500 text-sm">
                    No major strain flagged today.
                  </li>
                )}
                {strains.map((s, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[6px] h-[4px] w-[4px] rounded-full bg-rose-400" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Adjustments */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Adjustments
              </div>
              <InfoBadge text="Light-touch nudges Echo thinks could make tomorrow feel quieter." />
            </div>
            <ul className="space-y-1 text-sm text-slate-300">
              {adjustments.length === 0 && (
                <li className="text-slate-500 text-sm">
                  No specific suggestions logged today.
                </li>
              )}
              {adjustments.map((a, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-[6px] h-[4px] w-[4px] rounded-full bg-sky-400" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN – SIGNALS, PERSONA, TIME SAVED, TRENDS */}
        <div className="space-y-6">
          {/* Signals card */}
          <div
            className="
              rounded-2xl border border-slate-800 bg-slate-950/70
              p-5 shadow-[0_0_40px_rgba(15,23,42,0.85)]
            "
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-300" />
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Signals
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <ScorePill
                label="Focus"
                value={focusScore}
                tooltip="How well your deep work windows were protected today."
              />
              <ScorePill
                label="Load"
                value={strainScore}
                tooltip="How heavy today felt in meetings, email and context switching."
              />
              <ScorePill
                label="Momentum"
                value={momentumScore}
                tooltip="How much you moved important work forward compared to recent days."
              />
              <ScorePill
                label="Consistency"
                value={consistencyScore}
                tooltip="How similar today’s cadence felt to your best days."
              />
            </div>

            {/* Optional tags */}
            {tags && tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="
                      rounded-full bg-slate-900/80 px-2 py-[2px]
                      text-[10px] uppercase tracking-[0.18em] text-slate-400
                    "
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Persona */}
          <PersonaCard persona={persona} />

          {/* Time saved card */}
          <div
            className="
              rounded-2xl border border-amber-500/40 bg-gradient-to-br
              from-amber-500/10 via-slate-900 to-slate-950
              p-5 shadow-[0_0_45px_rgba(251,191,36,0.18)]
            "
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1">
                  <div className="text-xs uppercase tracking-[0.24em] text-amber-300/80">
                    Time saved
                  </div>
                  <InfoBadge text="Estimate based on action-like emails, low/noise meetings and high-energy deep work windows Echo protects for you." />
                </div>
                <p className="mt-1 text-[11px] text-amber-100/80">
                  Echo&apos;s rough estimate of time you defended from noise
                  today.
                </p>
              </div>

              <div className="text-right">
                <div className="text-3xl font-semibold text-amber-300">
                  {timeSaved?.total ?? 0}
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-amber-200/80">
                  min
                </div>
              </div>
            </div>

            {timeSaved && (
              <div className="mt-4 grid gap-2 text-[11px] text-amber-100/80">
                <div className="flex justify-between">
                  <span>Deep work windows</span>
                  <span>
                    {timeSaved.breakdown.deepBlocks} blocks ·{" "}
                    {timeSaved.breakdown.deepMinutes} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Low/noise meetings</span>
                  <span>
                    {timeSaved.breakdown.meetingMinutes} min load →{" "}
                    {timeSaved.breakdown.meetingSaved} min saved
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Action-like emails</span>
                  <span>
                    {timeSaved.breakdown.actionEmails} ·{" "}
                    {timeSaved.breakdown.emailMinutes} min
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Trend + category insights */}
          <SignalTrend series={series} />
          <CategoryInsightsCard items={categoryInsights} />
        </div>
      </section>
    </main>
  );
}
