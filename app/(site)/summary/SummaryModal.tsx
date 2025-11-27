"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { SummaryRow } from "./page";
import MetricPills from "../summary/MetricPills";


interface Props {
  summary: SummaryRow | null;
  onClose: () => void;
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function SummaryModal({ summary, onClose }: Props) {
  const hasHtml = !!summary?.htmlSummary;
  const hasWins = summary?.wins && summary.wins.length > 0;
  const hasStrains = summary?.strains && summary.strains.length > 0;
  const hasThemes = summary?.themes && summary.themes.length > 0;

  const [showHtml, setShowHtml] = React.useState(false);

  React.useEffect(() => {
    if (!summary) setShowHtml(false);
  }, [summary]);

  return (
    <AnimatePresence>
      {summary && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="
              relative z-50 max-w-3xl w-full
              rounded-3xl border border-white/10
              bg-slate-950/95 backdrop-blur-2xl
              shadow-[0_32px_100px_rgba(0,0,0,0.9)]
              p-5 sm:p-7 space-y-5
            "
          >
            {/* header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400/85 font-semibold">
                  Echo daily reflection
                </p>
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  {formatFullDate(summary.date)} ·{" "}
                  {summary.mode === "am" ? "Morning" : "Evening"}
                </h2>
                <p className="text-xs text-slate-400/90">
                  A calm recap of your day’s signal – reflection, wins, strains,
                  themes and the exact email Echo sent you.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/70 text-slate-300 hover:text-white hover:border-slate-400 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* metrics row */}
            <div
              className="
                rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3
                shadow-[0_18px_60px_rgba(0,0,0,0.7)]
              "
            >
              <MetricPills metrics={summary.metrics} />
            </div>

            {/* reflection */}
            <div
              className="
                rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5
              "
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400/80 mb-2">
                Reflection
              </p>
              <p className="text-sm text-slate-200/90 leading-relaxed whitespace-pre-line">
                {summary.reflection ||
                  "Echo captured this day for you – reflection coming soon."}
              </p>
            </div>

            {/* wins / strains / themes */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className="
                  rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3
                "
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200 mb-1.5">
                  Wins
                </p>
                {hasWins ? (
                  <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm text-emerald-50/95">
                    {summary.wins.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-100/70">
                    Echo will surface your notable wins here.
                  </p>
                )}
              </div>

              <div
                className="
                  rounded-2xl border border-rose-500/35 bg-rose-500/5 px-4 py-3
                "
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-rose-200 mb-1.5">
                  Strains
                </p>
                {hasStrains ? (
                  <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm text-rose-50/95">
                    {summary.strains.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-rose-100/80">
                    Echo will gently flag recurring friction here.
                  </p>
                )}
              </div>
            </div>

            <div
              className="
                rounded-2xl border border-sky-500/35 bg-sky-500/5 px-4 py-3
              "
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-sky-200 mb-1.5">
                Themes
              </p>
              {hasThemes ? (
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-100">
                  {summary.themes.map((t) => (
                    <span
                      key={t}
                      className="
                        rounded-full border border-sky-400/60
                        px-3 py-1
                        bg-sky-500/10
                      "
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-sky-100/85">
                  Echo will derive emerging themes from your inbox, meetings and
                  tasks.
                </p>
              )}
            </div>

            {/* HTML summary toggle + iframe */}
            {hasHtml && (
              <div
                className="
                  rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 space-y-3
                "
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400/85">
                      Email summary
                    </p>
                    <p className="text-xs text-slate-400/90">
                      The exact HTML email Echo generated for this snapshot.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHtml((v) => !v)}
                    className="
                      rounded-full border border-slate-600/80
                      px-3 py-1.5 text-[11px] text-slate-200
                      hover:border-sky-400/80 hover:text-sky-100
                      transition
                    "
                  >
                    {showHtml ? "Hide email view" : "View summary email"}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {showHtml && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="mt-2 rounded-2xl border border-slate-800/90 overflow-hidden bg-black"
                    >
                      <iframe
                        title="Echo summary email"
                        sandbox=""
                        srcDoc={summary.htmlSummary}
                        className="w-full h-[340px] bg-black"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
