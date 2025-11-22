// app/(site)/summary/SummaryShell.tsx
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Summary = {
  id: string;
  date: string;
  mode: "am" | "pm";
  reflection: string;
  actionEmailsReceived: number | null;
  actionEmailsResolved: number | null;
  emailsReceived: number | null;
  emailsSent: number | null;
  meetings: number | null;
};

type BandKey = "all" | "am" | "pm";

interface Props {
  summaries: Summary[];
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function labelForMode(mode: "am" | "pm") {
  return mode === "am" ? "Morning" : "Evening";
}

function metricsPills(s: Summary) {
  const pills: string[] = [];

  if (s.actionEmailsReceived != null)
    pills.push(`${s.actionEmailsReceived} action emails`);
  if (s.actionEmailsResolved != null)
    pills.push(`${s.actionEmailsResolved} resolved`);
  if (s.emailsReceived != null)
    pills.push(`${s.emailsReceived} received`);
  if (s.emailsSent != null) pills.push(`${s.emailsSent} sent`);
  if (s.meetings != null) pills.push(`${s.meetings} meetings`);

  return pills;
}

export default function SummaryShell({ summaries }: Props) {
  const [selectedBand, setSelectedBand] = useState<BandKey | null>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const amSummaries = useMemo(
    () => summaries.filter((s) => s.mode === "am"),
    [summaries]
  );
  const pmSummaries = useMemo(
    () => summaries.filter((s) => s.mode === "pm"),
    [summaries]
  );

  const latestAmToday = useMemo(
    () =>
      amSummaries.find(
        (s) => s.date && s.date.toString().slice(0, 10) === todayStr
      ),
    [amSummaries, todayStr]
  );

  const pmForCard = useMemo(() => {
    // Today first, otherwise yesterday / most recent PM
    const todayPm = pmSummaries.find(
      (s) => s.date && s.date.toString().slice(0, 10) === todayStr
    );
    if (todayPm) return todayPm;
    return pmSummaries[0];
  }, [pmSummaries, todayStr]);

  const latestAny = summaries[0];

  const currentSummaries: Summary[] =
    selectedBand === "all"
      ? summaries
      : selectedBand === "am"
      ? amSummaries
      : selectedBand === "pm"
      ? pmSummaries
      : [];

  const bandLabel = (band: BandKey | null) => {
    if (band === "all") return "All summaries";
    if (band === "am") return "Morning summaries";
    if (band === "pm") return "Evening summaries";
    return "";
  };

  return (
    <div className="space-y-10">
      {/* Band cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* AM CARD */}
        <button
          type="button"
          onClick={() =>
            setSelectedBand((prev) => (prev === "am" ? null : "am"))
          }
          className={`
            text-left relative overflow-hidden rounded-2xl p-6 sm:p-7
            backdrop-blur-2xl bg-white/[0.08]
            border-[1.5px] border-transparent
            [border-image:linear-gradient(125deg,rgba(244,114,182,0.65),rgba(56,189,248,0.65))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_22px_rgba(255,255,255,0.04)]
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(10,16,32,0.5))]
            transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(0,0,0,0.8)]
            outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70
            ${selectedBand === "am" ? "ring-2 ring-fuchsia-400/80" : ""}
          `}
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />
          <div className="relative space-y-3">
            <p className="text-[11px] tracking-[0.22em] text-slate-300/75 font-semibold">
              MORNING SNAPSHOT
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              AM Summary
            </h2>
            <p className="text-sm text-slate-200/95 leading-relaxed line-clamp-3">
              {latestAmToday
                ? latestAmToday.reflection ||
                  "Echo captured this morning, tap to revisit."
                : "When Echo starts writing morning summaries, they’ll land here."}
            </p>
            <p className="mt-3 text-[11px] text-slate-400/85">
              Tap to open today’s AM summaries log.
            </p>
          </div>
        </button>

        {/* PM CARD */}
        <button
          type="button"
          onClick={() =>
            setSelectedBand((prev) => (prev === "pm" ? null : "pm"))
          }
          className={`
            text-left relative overflow-hidden rounded-2xl p-6 sm:p-7
            backdrop-blur-2xl bg-white/[0.08]
            border-[1.5px] border-transparent
            [border-image:linear-gradient(125deg,rgba(168,85,247,0.65),rgba(56,189,248,0.65))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_22px_rgba(255,255,255,0.04)]
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(10,16,32,0.5))]
            transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(0,0,0,0.8)]
            outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70
            ${selectedBand === "pm" ? "ring-2 ring-violet-400/80" : ""}
          `}
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />
          <div className="relative space-y-3">
            <p className="text-[11px] tracking-[0.22em] text-slate-300/75 font-semibold">
              EVENING SNAPSHOT
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              PM Summary
            </h2>
            <p className="text-sm text-slate-200/95 leading-relaxed line-clamp-3">
              {pmForCard
                ? pmForCard.reflection ||
                  "Echo wrapped this evening, tap to revisit."
                : "Once Echo closes out your days, your PM reflections will appear here."}
            </p>
            <p className="mt-3 text-[11px] text-slate-400/85">
              Tap to open recent PM summaries (today & yesterday).
            </p>
          </div>
        </button>

        {/* ALL CARD */}
        <button
          type="button"
          onClick={() =>
            setSelectedBand((prev) => (prev === "all" ? null : "all"))
          }
          className={`
            text-left relative overflow-hidden rounded-2xl p-6 sm:p-7
            backdrop-blur-2xl bg-white/[0.08]
            border-[1.5px] border-transparent
            [border-image:linear-gradient(135deg,rgba(148,163,184,0.7),rgba(56,189,248,0.7))1]
            shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_22px_rgba(255,255,255,0.04)]
            bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(10,16,32,0.5))]
            transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(0,0,0,0.8)]
            outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70
            ${selectedBand === "all" ? "ring-2 ring-sky-300/80" : ""}
          `}
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />
          <div className="relative space-y-3">
            <p className="text-[11px] tracking-[0.22em] text-slate-300/75 font-semibold">
              QUIET ARCHIVE
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              All summaries
            </h2>
            <p className="text-sm text-slate-200/95 leading-relaxed line-clamp-3">
              {latestAny
                ? `Scroll back through every AM/PM recap Echo has written – a calm log of your trajectory.`
                : "Once Echo has a few days under its belt, this becomes your personal work history."}
            </p>
            <p className="mt-3 text-[11px] text-slate-400/85">
              Tap to open the full Echo archive.
            </p>
          </div>
        </button>
      </div>

      {/* Drawer */}
      <AnimatePresence initial={false}>
        {selectedBand && (
          <motion.div
            key={selectedBand}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="
              rounded-3xl border border-white/10 bg-slate-900/60
              backdrop-blur-2xl p-6 sm:p-7
              shadow-[0_24px_80px_rgba(0,0,0,0.75)]
            "
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[11px] tracking-[0.22em] text-slate-400/80 font-semibold uppercase">
                  {bandLabel(selectedBand)}
                </p>
                <p className="text-xs text-slate-400/90 mt-1">
                  Echo keeps a running log of your days. Tap a line to skim the
                  reflection and metrics.
                </p>
              </div>
              <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] text-slate-300/90 border border-white/10">
                {currentSummaries.length} summaries
              </span>
            </div>

            {currentSummaries.length === 0 ? (
              <div className="border border-dashed border-slate-600/60 p-4 text-sm text-slate-300/85 rounded-2xl">
                No summaries in this band yet. As Echo processes your days, AM /
                PM recaps will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {currentSummaries.map((summary) => {
                  const pills = metricsPills(summary);

                  return (
                    <div
                      key={summary.id}
                      className="
                        relative overflow-hidden rounded-2xl border border-white/10
                        bg-slate-950/70 px-4 py-4 sm:px-5 sm:py-4
                        shadow-[0_18px_55px_rgba(0,0,0,0.7)]
                      "
                    >
                      <div className="relative flex flex-col gap-2">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400/80">
                              {formatDate(summary.date)} ·{" "}
                              {labelForMode(summary.mode)}
                            </p>
                          </div>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400/90">
                            Echo summary
                          </span>
                        </div>

                        <p className="text-sm text-slate-200/90 leading-relaxed whitespace-pre-line line-clamp-4">
                          {summary.reflection ||
                            "Echo captured this day for you – reflection coming soon."}
                        </p>

                        {pills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300/90">
                            {pills.map((pill) => (
                              <span
                                key={pill}
                                className="
                                  rounded-full border border-slate-600/80
                                  px-2.5 py-0.5
                                  bg-slate-900/70
                                "
                              >
                                {pill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder when nothing selected */}
      {!selectedBand && (
        <div className="signal-card mt-2 border border-white/10 p-6 text-sm text-slate-300/95 rounded-2xl bg-slate-900/40 backdrop-blur-xl">
          Echo keeps a quiet AM / PM log for you. Tap{" "}
          <span className="font-semibold text-sky-300">AM</span>,{" "}
          <span className="font-semibold text-violet-300">PM</span> or{" "}
          <span className="font-semibold text-slate-200">All summaries</span>{" "}
          above to slide open the archive.
        </div>
      )}
    </div>
  );
}
