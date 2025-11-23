"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type EmailRecord = {
  id: string;
  user_id: string;
  Category: string | null;
  From: string | null;
  Subject: string | null;
  Summary: string | null;
  "Action Notes"?: string | null;
  "Reply Link"?: string | null;
  "Date Received": string | null;
  "Email Status"?: string | null;
  "Finish Time"?: string | null;
  [key: string]: any;
};

type BandKey = "action" | "follow_up" | "noise";

interface Props {
  emails: EmailRecord[];
}

interface DraftPreview {
  subject: string;
  bodyPreview: string | null;
  htmlBody: string | null;
  webLink: string | null;
}

// Shared band helper (same as page/dashboard)
function getBandForCategory(category: string | null): BandKey {
  const c = (category ?? "").toLowerCase().trim();

  if (c.includes("follow")) return "follow_up";
  if (
    c.includes("info") ||
    c.includes("promo") ||
    c.includes("newsletter") ||
    c === "informational"
  ) {
    return "noise";
  }

  return "action";
}

function isResolved(status: string | null | undefined) {
  return status?.toLowerCase() === "resolved";
}

export default function EmailClientShell({ emails }: Props) {
  const [emailsState, setEmailsState] = useState<EmailRecord[]>(emails);
  const [selectedBand, setSelectedBand] = useState<BandKey | null>(null);
  const [loadingEmailId, setLoadingEmailId] = useState<string | null>(null);
  const [draftPreview, setDraftPreview] = useState<DraftPreview | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Band -> emails (all, including resolved)
  const bandMap: Record<BandKey, EmailRecord[]> = {
    action: emailsState.filter(
      (e) => getBandForCategory(e.Category) === "action"
    ),
    follow_up: emailsState.filter(
      (e) => getBandForCategory(e.Category) === "follow_up"
    ),
    noise: emailsState.filter(
      (e) => getBandForCategory(e.Category) === "noise"
    ),
  };

  const unresolvedForBand = (band: BandKey) =>
    bandMap[band].filter((e) => !isResolved(e["Email Status"]));

  const currentBase =
    selectedBand === null ? [] : bandMap[selectedBand] ?? [];

  // In focus mode, drawer only shows unresolved Action emails
  const currentEmails =
    focusMode && selectedBand === "action"
      ? unresolvedForBand("action")
      : currentBase;

  // --- Band label helper ---
  const bandLabel = (band: BandKey | null) => {
    if (band === "action") return "Action";
    if (band === "follow_up") return "Follow-up";
    if (band === "noise") return "Noise";
    return "";
  };

  // --- RESOLVE EMAIL (no reload, local state update) ---
  const resolveEmail = async (emailId: string) => {
    setLoadingEmailId(emailId);

    try {
      const res = await fetch("/api/resolve-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Update local state so UI reflects resolution without reload
      setEmailsState((prev) =>
        prev.map((e) =>
          e.id === emailId
            ? {
                ...e,
                "Email Status": "resolved",
                // Optional: stamp local finish time for UI only
                "Finish Time": e["Finish Time"] ?? new Date().toISOString(),
              }
            : e
        )
      );
    } catch (err) {
      console.error("Resolve error:", err);
    } finally {
      setLoadingEmailId(null);
    }
  };

  // --- GENERATE REPLY (your n8n-backed API) ---
  const handleGenerateDraft = async (emailId: string) => {
    try {
      setLoadingEmailId(emailId);
      setDraftError(null);
      setCopied(false);

      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to generate reply draft.");
      }

      const data = (await res.json()) as DraftPreview;
      setDraftPreview(data);
    } catch (err: any) {
      console.error(err);
      setDraftError(
        err?.message || "Something went wrong while generating the draft."
      );
    } finally {
      setLoadingEmailId(null);
    }
  };

  // --- COPY DRAFT TEXT ---
  const handleCopyDraft = async () => {
    if (!draftPreview) return;

    // Prefer bodyPreview; fallback to htmlBody stripped
    let text = draftPreview.bodyPreview ?? "";

    if (!text && draftPreview.htmlBody) {
      text = draftPreview.htmlBody.replace(/<[^>]+>/g, " ");
    }

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Clipboard error:", e);
    }
  };

  const handleSelectBand = (band: BandKey) => {
    setSelectedBand((prev) => (prev === band ? null : band));
    setDraftError(null);
  };

  const toggleFocusMode = () => {
    setFocusMode((prev) => {
      const next = !prev;
      if (next && selectedBand !== "action") {
        setSelectedBand("action");
      }
      return next;
    });
  };

  // --- Render ---
  return (
    <div className="space-y-8">
      {/* Focus mode control */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-slate-400/85">
          {focusMode
            ? "Focus mode · working through unresolved Action threads."
            : "Tap a band to explore, or enable focus mode to work through Action threads."}
        </p>
        <button
          type="button"
          onClick={toggleFocusMode}
          className={`
            inline-flex items-center gap-1 rounded-full px-3 py-1.5
            text-[11px] font-medium
            border border-white/15
            backdrop-blur-xl
            transition
            ${
              focusMode
                ? "bg-sky-500/90 text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.7)]"
                : "bg-white/5 text-slate-200 hover:bg-white/10"
            }
          `}
        >
          <span
            className={`
              h-1.5 w-1.5 rounded-full
              ${focusMode ? "bg-slate-900" : "bg-slate-400"}
            `}
          />
          {focusMode ? "Focus mode on" : "Focus mode off"}
        </button>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {renderBandCard("action", "ACTION BAND")}
        {renderBandCard("follow_up", "FOLLOW-UP BAND")}
        {renderBandCard("noise", "NOISE BAND")}
      </div>

      {/* Focused Threads Drawer */}
      <AnimatePresence initial={false}>
        {selectedBand && (
          <motion.div
            key={selectedBand}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mt-4 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.75)]"
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[11px] tracking-[0.22em] text-slate-400/80 font-semibold uppercase">
                  Focused threads · {bandLabel(selectedBand)}
                </p>
                <p className="text-xs text-slate-400/90 mt-1">
                  {focusMode && selectedBand === "action"
                    ? "Focus mode is showing only unresolved Action threads."
                    : "Echo is surfacing the most relevant threads in this band. Tap a card to act."}
                </p>
              </div>
              <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] text-slate-300/90 border border-white/10">
                {currentEmails.length} messages
              </span>
            </div>

            {currentEmails.length === 0 ? (
              <div className="signal-card border border-dashed border-slate-600/60 p-4 text-sm text-slate-300/85 rounded-2xl">
                No messages in this band yet. As Echo processes your inbox,
                threads will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {currentEmails.map((email) => {
                  const isLoading = loadingEmailId === email.id;
                  const category = (email.Category ?? "").toLowerCase();
                  const resolved = isResolved(email["Email Status"]);

                  let gradientClass =
                    "from-fuchsia-400 via-pink-400 to-sky-400";
                  if (selectedBand === "follow_up") {
                    gradientClass =
                      "from-violet-400 via-indigo-400 to-sky-400";
                  }
                  if (selectedBand === "noise") {
                    gradientClass =
                      "from-slate-500 via-slate-600 to-sky-500";
                  }

                  const finishDate =
                    email["Finish Time"] &&
                    new Date(email["Finish Time"]).toLocaleString(undefined, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                  return (
                    <div
                      key={email.id}
                      className={`
                        signal-card relative overflow-hidden rounded-2xl border border-white/10
                        bg-slate-900/70 px-4 py-4 sm:px-5 sm:py-4
                        shadow-[0_18px_55px_rgba(0,0,0,0.7)]
                        ${resolved ? "opacity-60" : ""}
                      `}
                    >
                      {/* Band accent bar */}
                      <div
                        className={`
                          absolute inset-y-0 left-0 w-1.5
                          bg-gradient-to-b ${gradientClass}
                        `}
                      />
                      <div className="relative pl-4 sm:pl-5 flex flex-col gap-2">
                        {/* Header row */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400/80">
                              {category || bandLabel(selectedBand)}
                            </p>
                            <p className="mt-1 text-sm sm:text-[15px] font-medium text-slate-50 line-clamp-2">
                              {email.Subject || "Untitled thread"}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-400/90">
                            <p className="truncate max-w-[180px]">
                              {email.From}
                            </p>
                            {email["Date Received"] && (
                              <p className="mt-0.5 opacity-80">
                                {new Date(
                                  email["Date Received"]
                                ).toLocaleString(undefined, {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Summary text */}
                        <p className="text-xs text-slate-300/90 line-clamp-2">
                          {email.Summary ||
                            email["Action Notes"] ||
                            "Echo has captured this thread for you."}
                        </p>

                        {/* Status + actions */}
                        <div className="mt-2 flex flex-wrap items-center gap-2 justify-between">
                          {/* Status chips */}
                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400/90">
                            {resolved ? (
                              <span className="rounded-full border border-slate-600/80 px-2 py-0.5">
                                Resolved
                                {finishDate ? ` · ${finishDate}` : ""}
                              </span>
                            ) : (
                              <span className="rounded-full border border-sky-500/60 px-2 py-0.5 text-sky-300">
                                Outstanding
                              </span>
                            )}

                            {email["Email Status"] && !resolved && (
                              <span className="rounded-full border border-slate-600/80 px-2 py-0.5">
                                {email["Email Status"]}
                              </span>
                            )}

                            <span className="rounded-full border border-slate-700/80 px-2 py-0.5">
                              Echo-linked · Draftable
                            </span>
                          </div>

                          {/* Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {/* Generate reply */}
                            <button
                              type="button"
                              onClick={() => handleGenerateDraft(email.id)}
                              disabled={
                                isLoading || !email["Reply Link"]
                              }
                              className="
                                rounded-full bg-sky-500/90 hover:bg-sky-400
                                disabled:bg-slate-700 disabled:text-slate-400
                                text-xs px-3 py-1.5 text-slate-950 font-semibold
                                shadow-[0_12px_32px_rgba(56,189,248,0.55)]
                                transition
                              "
                            >
                              {isLoading && loadingEmailId === email.id
                                ? "Working..."
                                : "Generate reply"}
                            </button>

                            {/* View thread – placeholder */}
                            <button
                              type="button"
                              className="
                                rounded-full border border-slate-600/80
                                text-[11px] px-3 py-1.5 text-slate-200/90
                                hover:border-slate-400/90 transition
                              "
                            >
                              View thread
                            </button>

                            {/* Resolve */}
                            {!resolved && (
                              <button
                                type="button"
                                onClick={() => resolveEmail(email.id)}
                                disabled={
                                  isLoading && loadingEmailId === email.id
                                }
                                className="
                                  rounded-full border border-fuchsia-500/70
                                  text-[11px] px-3 py-1.5 text-fuchsia-200
                                  hover:bg-fuchsia-500/15 transition
                                "
                              >
                                {isLoading && loadingEmailId === email.id
                                  ? "Resolving..."
                                  : "Resolve"}
                              </button>
                            )}

                            {/* Noise-specific action placeholder */}
                            {selectedBand === "noise" && (
                              <button
                                type="button"
                                className="
                                  rounded-full border border-slate-600/80
                                  text-[11px] px-3 py-1.5 text-slate-200/90
                                  hover:border-sky-400/90 transition
                                "
                              >
                                Unmute
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {draftError && (
              <p className="mt-4 text-xs text-rose-300/90">{draftError}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback helper text when nothing selected */}
      {!selectedBand && (
        <div className="signal-card mt-2 border border-white/10 p-6 text-sm text-slate-300/95 rounded-2xl bg-slate-900/40 backdrop-blur-xl">
          When live, this section will show a focused list of the most important
          threads across your inbox — ranked by Echo, not by recency. Tap a
          band above to reveal the cinematic threads view.
        </div>
      )}

      {/* Draft preview modal */}
      <AnimatePresence>
        {draftPreview && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setDraftPreview(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="
                relative z-50 max-w-2xl w-full
                rounded-3xl border border-white/10
                bg-slate-950/95 backdrop-blur-2xl
                shadow-[0_28px_90px_rgba(0,0,0,0.85)]
                p-5 sm:p-6
              "
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-[11px] tracking-[0.22em] text-slate-400/80 font-semibold uppercase">
                    Echo reply draft
                  </p>
                  <p className="mt-1 text-sm text-slate-50 line-clamp-2">
                    {draftPreview.subject}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDraftPreview(null)}
                  className="text-xs text-slate-400 hover:text-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 max-h-[320px] overflow-auto rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-100">
                {draftPreview.htmlBody ? (
                  <div
                    className="prose prose-invert max-w-none text-sm prose-p:my-1 prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: draftPreview.htmlBody,
                    }}
                  />
                ) : (
                  <p className="whitespace-pre-line text-sm">
                    {draftPreview.bodyPreview ??
                      "Draft created in Outlook. Open your drafts folder to review."}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={handleCopyDraft}
                    className="
                      rounded-full bg-sky-500/90 hover:bg-sky-400
                      text-xs px-3.5 py-1.5 text-slate-950 font-semibold
                      shadow-[0_16px_40px_rgba(56,189,248,0.6)]
                      transition
                    "
                  >
                    Copy
                  </button>
                  {copied && (
                    <span className="text-[11px] text-sky-300/90">
                      Copied to clipboard
                    </span>
                  )}
                  {draftPreview.webLink && (
                    <button
                      type="button"
                      onClick={() =>
                        window.open(draftPreview.webLink!, "_blank", "noopener")
                      }
                      className="
                        rounded-full border border-slate-600/80
                        text-xs px-3.5 py-1.5 text-slate-200/90
                        hover:border-sky-400/90 transition
                      "
                    >
                      Open in Outlook drafts
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400/80">
                  Draft already saved to Outlook · Echo just shows you a preview.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // --- Render Band Card with unresolved count ---
  function renderBandCard(band: BandKey, label: string) {
    const unresolvedCount = unresolvedForBand(band).length;

    const title =
      band === "action" ? "Action" : band === "follow_up" ? "Follow-up" : "Noise";

    const isMuted = focusMode && band !== "action";

    return (
      <button
        type="button"
        onClick={() => !isMuted && handleSelectBand(band)}
        disabled={isMuted}
        className={`
          text-left relative overflow-hidden rounded-2xl p-6 sm:p-7
          backdrop-blur-2xl bg-white/[0.07]
          border-[1.5px] border-transparent
          shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_22px_rgba(255,255,255,0.04)]
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(10,16,32,0.5))]
          transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(0,0,0,0.8)]
          outline-none focus-visible:ring-2
          ${
            band === "action"
              ? "focus-visible:ring-fuchsia-400/70"
              : band === "follow_up"
              ? "focus-visible:ring-violet-400/70"
              : "focus-visible:ring-sky-300/70"
          }
          ${
            selectedBand === band
              ? band === "action"
                ? "ring-2 ring-fuchsia-400/80"
                : band === "follow_up"
                ? "ring-2 ring-violet-400/80"
                : "ring-2 ring-sky-300/80"
              : ""
          }
          ${isMuted ? "opacity-40 cursor-not-allowed" : ""}
        `}
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(0,0,0,0.55)]" />
        <div className="relative space-y-3">
          <p className="text-[11px] tracking-[0.22em] text-slate-300/75 font-semibold">
            {label}
          </p>
          <h2 className="text-xl sm:text-2xl font-semibold text-white">
            {title}
          </h2>
          <p className="text-sm text-slate-200/95 leading-relaxed">
            {band === "action" &&
              "High-signal threads that need a decision, reply or clear next step."}
            {band === "follow_up" &&
              "Conversations you’re tracking, where Echo will remind you when things go quiet."}
            {band === "noise" &&
              "Low-value updates, promos and FYIs that Echo keeps out of your field of view."}
          </p>
          <div className="mt-4 rounded-xl bg-slate-900/50 border border-white/10 px-4 py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-slate-200/95">
              <span
                className={`
                  h-1.5 w-10 rounded-full animate-pulse
                  ${
                    band === "action"
                      ? "bg-gradient-to-r from-fuchsia-400 to-pink-400"
                      : band === "follow_up"
                      ? "bg-gradient-to-r from-violet-400 to-indigo-400"
                      : "bg-gradient-to-r from-slate-400 via-sky-400 to-cyan-300"
                  }
                `}
              />
              <span>
                {isMuted
                  ? "Muted in focus mode"
                  : `${unresolvedCount} ${
                      unresolvedCount === 1
                        ? "outstanding thread"
                        : "outstanding threads"
                    }`}
              </span>
            </span>
          </div>
        </div>
      </button>
    );
  }
}
