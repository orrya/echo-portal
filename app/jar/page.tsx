// app/jar/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { Info } from "lucide-react";

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
        {/* Glow */}
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
        0–10 signal for how protected your best work windows were today. Roughly:
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

  // 1) Action emails → 45s each
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

  // 2) Low/noise meetings → some minutes saved (20% of meeting load)
  const today = rawCalendar?.today || {};
  const calInsights = today?.calendar_insights || {};
  const meetingMinutes = Number(calInsights.meetingMinutes ?? 0);
  const meetingSaved = meetingMinutes * 0.2; // 20% of that time as "protected"

  // 3) Deep work windows from predictive_signals.energyMap → 10 min per 'High' block
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
          setSelectedId(list[0].id);
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
    () => entries.find((e) => e.id === selectedId) ?? entries[0] ?? null,
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

  if (!selected) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-6">
        <div className="max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-3">
            EchoJar hasn&apos;t formed yet.
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Once Echo has seen enough of your day (email, meetings, summaries),
            it will start forming a daily EchoJar entry with patterns, themes
            and signals. Check back after your AM and PM summaries have run.
          </p>
        </div>
      </main>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // Main UI
  // ──────────────────────────────────────────────────────────────
  const dateLabel = formatDateLabel(selected.date);
  const focusScore = selected.focus_score ?? null;
  const strainScore = selected.strain_score ?? null;
  const momentumScore = selected.momentum_score ?? null;
  const consistencyScore = selected.consistency_score ?? null;

  const headline = "Your quiet timeline.";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      {/* HERO ROW */}
      <section className="grid gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-[0.26em] text-slate-400">
            EchoJar
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold">{headline}</h1>
          <div className="text-xs text-slate-400">{dateLabel}</div>
          <p className="max-w-2xl text-sm sm:text-[15px] leading-relaxed text-slate-300">
            {behaviour ||
              "Once Echo has seen enough of your day, it will form a calm summary here."}
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
      <section className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
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
              <InfoBadge text="Simple rule-based patterns Echo keeps an eye on over time." />
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
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Wins
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
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Strains
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
              <InfoBadge text="Light-touch nudges Echo thinks could improve tomorrow." />
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

        {/* RIGHT COLUMN – SIGNALS & TIME SAVED */}
        <div className="space-y-6">
          {/* Signals card */}
          <div
            className="
              rounded-2xl border border-slate-800 bg-slate-950/70
              p-5 shadow-[0_0_40px_rgba(15,23,42,0.85)]
            "
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Signals
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

            {/* Optional small tags */}
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
                  <InfoBadge text="Rough estimate based on action emails, low/noise meetings and deep work windows Echo protected for you." />
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
                  <span>Action emails resolved</span>
                  <span>
                    {timeSaved.breakdown.actionEmails} ·{" "}
                    {timeSaved.breakdown.emailMinutes} min
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
