// app/(site)/email/EmailClientShell.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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
    thread_id?: string | null;   // 👈 ADD THIS
    draft_body?: string | null;
    [key: string]: any;
};

type BandKey = "action" | "follow_up" | "noise";

interface Props {
    emails: EmailRecord[];
    preparedEmailIds?: string[];
}

interface DraftPreview {
    subject: string;
    bodyPreview: string | null;
    htmlBody: string | null;
    webLink: string | null;
}

export default function EmailClientShell({
    emails,
    preparedEmailIds = [],
}: Props) {
    const [selectedBand, setSelectedBand] = useState<BandKey | null>(null);
    const [loadingEmailId, setLoadingEmailId] = useState<string | null>(null);
    const [draftPreview, setDraftPreview] = useState<DraftPreview | null>(null);
    const [draftError, setDraftError] = useState<string | null>(null);

    // Local mutable copy so we can update "resolved" without reloading
    const [localEmails, setLocalEmails] = useState<EmailRecord[]>(emails);

    const preparedSet = useMemo(
        () => new Set(preparedEmailIds ?? []),
        [preparedEmailIds]
    );

    const [showPrepared, setShowPrepared] = useState(false);
    const [showResolved, setShowResolved] = useState(false);
    const [threadData, setThreadData] = useState<{
        messages: any[];
        unsupported: boolean;
    } | null>(null);

    const [threadLoading, setThreadLoading] = useState(false);


    const [showActive, setShowActive] = useState(true);




    // Focus mode state
    const [focusMode, setFocusMode] = useState(false);
    const [focusDurationMinutes, setFocusDurationMinutes] = useState<number | null>(null);
    const [focusEndAt, setFocusEndAt] = useState<number | null>(null);
    const [focusBaselineCount, setFocusBaselineCount] = useState<number | null>(null);
    const [now, setNow] = useState<number>(Date.now());

    // Keep localEmails synced if props change
    useEffect(() => {
        setLocalEmails(emails);
    }, [emails]);

    // Helper: band from category
    function getBand(category: string | null): BandKey {
        const c = (category ?? "").toLowerCase().trim();
        if (c.includes("follow")) return "follow_up";
        if (
            c.includes("info") ||
            c.includes("promo") ||
            c.includes("newsletter") ||
            c === "informational"
        )
            return "noise";
        return "action";
    }

    const isUnresolved = (e: EmailRecord) => {
        const isPrepared = preparedSet.has(e.id);
        const isResolved =
            e["Email Status"]?.toLowerCase() === "resolved" || isPrepared;

        return !isResolved;
    };

    // ---- Band groupings (from localEmails) ----
    const {
        actionAll,
        followUpAll,
        noiseAll,
        actionUnresolved,
        followUpUnresolved,
        noiseUnresolved,
    } = useMemo(() => {
        const actionAll = localEmails.filter((e) => getBand(e.Category) === "action");
        const followUpAll = localEmails.filter((e) => getBand(e.Category) === "follow_up");
        const noiseAll = localEmails.filter((e) => getBand(e.Category) === "noise");

        const actionUnresolved = actionAll.filter(isUnresolved);
        const followUpUnresolved = followUpAll.filter(isUnresolved);
        const noiseUnresolved = noiseAll.filter(isUnresolved);

        return {
            actionAll,
            followUpAll,
            noiseAll,
            actionUnresolved,
            followUpUnresolved,
            noiseUnresolved,
        };
    }, [localEmails]);

    const bandMap: Record<BandKey, EmailRecord[]> = {
        action: actionAll,
        follow_up: followUpAll,
        noise: noiseAll,
    };


    const currentEmails =
        selectedBand === null
            ? []
            : bandMap[selectedBand].filter((e) => {
                const isPrepared = preparedSet.has(e.id);
                const isResolved =
                    e["Email Status"]?.toLowerCase() === "resolved" || isPrepared;

                // Prepared emails are always shown, but treated as resolved
                if (isPrepared) return true;

                // Hide resolved unless explicitly showing them
                if (!showResolved && isResolved) return false;

                return true;
            });

    // ---- Focus mode timer tick ----
    useEffect(() => {
        if (!focusMode || !focusEndAt) return;

        const id = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => window.clearInterval(id);
    }, [focusMode, focusEndAt]);

    const remainingMs =
        focusMode && focusEndAt ? Math.max(0, focusEndAt - now) : 0;

    const remainingMinutes = Math.floor(remainingMs / 60000);
    const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);

    const focusTimeLabel =
        focusMode && focusEndAt
            ? `${String(remainingMinutes).padStart(2, "0")}:${String(
                remainingSeconds
            ).padStart(2, "0")}`
            : null;

    // Progress in focus session (based on unresolved action at start vs now)
    const currentUnresolvedActionCount = actionUnresolved.length;
    const baseline = focusBaselineCount ?? currentUnresolvedActionCount;
    const resolvedThisSession =
        baseline > currentUnresolvedActionCount
            ? baseline - currentUnresolvedActionCount
            : 0;
    const totalForProgress = baseline || 1;
    const focusProgress =
        resolvedThisSession > 0 ? resolvedThisSession / totalForProgress : 0;

    // ---- Band label helper ----
    const bandLabel = (band: BandKey | null) => {
        if (band === "action") return "Action";
        if (band === "follow_up") return "Follow-up";
        if (band === "noise") return "Noise";
        return "";
    };

    const handleSelectBand = (band: BandKey) => {
        if (focusMode && band !== "action") return;

        setSelectedBand((prev) => (prev === band ? null : band));
        setShowResolved(false); // 👈 reset per band
        setDraftError(null);
    };

    // ---- Focus session controls ----
    const startFocusSession = (minutes: number) => {
        if (minutes <= 0) return;

        setFocusDurationMinutes(minutes);
        setFocusEndAt(Date.now() + minutes * 60_000);
        setFocusBaselineCount(currentUnresolvedActionCount);
        setFocusMode(true);
        setSelectedBand("action");
    };

    const stopFocusSession = () => {
        setFocusMode(false);
        setFocusEndAt(null);
        setFocusDurationMinutes(null);
        setFocusBaselineCount(null);
    };

    const handleCustomDuration = () => {
        const value = window.prompt("Focus minutes (e.g. 30):", "30");
        if (!value) return;
        const minutes = parseInt(value, 10);
        if (Number.isNaN(minutes) || minutes <= 0) return;
        startFocusSession(minutes);
    };

    // ---- Mark email as resolved (no reload) ----
    const resolveEmail = async (emailId: string) => {
        setLoadingEmailId(emailId);

        try {
            const res = await fetch("/api/resolve-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailId }),
            });

            if (!res.ok) throw new Error(await res.text());

            // Optimistically update local state so UI reflects "Resolved"
            setLocalEmails((prev) =>
                prev.map((e) =>
                    e.id === emailId
                        ? {
                            ...e,
                            "Email Status": "Resolved",
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

    // ---- Generate reply (calls your n8n-backed /api/generate-reply) ----
    const handleGenerateDraft = async (emailId: string) => {
        try {
            setLoadingEmailId(emailId);
            setDraftError(null);

            const res = await fetch("/api/generate-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailId }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to generate reply draft.");
            }

            const raw = await res.json();

            // Handle either a single object or an array like your Graph output
            const payload = Array.isArray(raw) ? raw[0] ?? {} : raw ?? {};

            const subject =
                payload.subject ??
                payload.Subject ??
                "Draft reply";
            const bodyPreview =
                payload.bodyPreview ??
                payload.preview ??
                null;
            const htmlBody =
                payload.htmlBody ??
                payload.body?.content ??
                null;
            const webLink =
                payload.webLink ??
                payload.WebLink ??
                null;

            const draft: DraftPreview = {
                subject,
                bodyPreview,
                htmlBody,
                webLink,
            };

            setDraftPreview(draft);
            // ✅ Echo already sent a draft → mark resolved in UI
            setLocalEmails((prev) =>
                prev.map((e) =>
                    e.id === emailId
                        ? {
                            ...e,
                            "Email Status": "Resolved",
                            "Finish Time": new Date().toISOString(),
                        }
                        : e
                )
            );

        } catch (err: any) {
            console.error(err);
            setDraftError(
                err?.message || "Something went wrong while generating the draft."
            );
        } finally {
            setLoadingEmailId(null);
        }
    };

    const preparedEmails = useMemo(
        () => currentEmails.filter((e) => preparedSet.has(e.id)),
        [currentEmails, preparedSet]
    );

    const activeEmails = useMemo(
        () => currentEmails.filter((e) => !preparedSet.has(e.id)),
        [currentEmails, preparedSet]
    );

    function timeSince(dateString?: string | null) {
        if (!dateString) return null;

        const now = new Date().getTime();
        const then = new Date(dateString).getTime();
        const diffMs = now - then;

        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMinutes > 0) return `${diffMinutes}m ago`;
        return "Just now";
    }


    // ---- Render ----
    return (
        <div className="space-y-8">
            {/* Focus mode strip */}
            <div
                className="
          flex flex-wrap items-center justify-between gap-3
          rounded-2xl border border-white/10 bg-slate-900/60
          px-4 py-3 sm:px-5 sm:py-3.5
          backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)]
        "
            >
                <div className="space-y-1">
                    <p className="text-[11px] tracking-[0.22em] text-slate-300/80 font-semibold uppercase">
                        Echo focus mode
                    </p>
                    {focusMode && focusTimeLabel ? (
                        <p className="text-xs text-slate-200/90">
                            In flow · {focusTimeLabel} remaining ·{" "}
                            <span className="text-sky-300">
                                {currentUnresolvedActionCount}{" "}
                                {currentUnresolvedActionCount === 1
                                    ? "action email left"
                                    : "action emails left"}
                            </span>
                            {resolvedThisSession > 0 && (
                                <> · {resolvedThisSession} resolved this session</>
                            )}
                        </p>
                    ) : (
                        <p className="text-xs text-slate-400/90">
                            Start a focused block on your{" "}
                            <span className="text-sky-300">Action</span> emails only.
                            Echo will quietly grey out everything else.
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!focusMode && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-200/90">
                            <button
                                type="button"
                                onClick={() => startFocusSession(25)}
                                className="rounded-full border border-slate-600/80 px-3 py-1 hover:border-sky-400/90 transition"
                            >
                                25 min
                            </button>
                            <button
                                type="button"
                                onClick={() => startFocusSession(45)}
                                className="rounded-full border border-slate-600/80 px-3 py-1 hover:border-sky-400/90 transition"
                            >
                                45 min
                            </button>
                            <button
                                type="button"
                                onClick={handleCustomDuration}
                                className="rounded-full border border-slate-600/80 px-3 py-1 hover:border-sky-400/90 transition"
                            >
                                Custom
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            if (focusMode) {
                                stopFocusSession();
                            } else {
                                // Default: 25 min auto-start
                                startFocusSession(25);
                            }
                        }}
                        className={`
              rounded-full text-xs px-3.5 py-1.5 font-semibold
              shadow-[0_14px_36px_rgba(56,189,248,0.55)]
              ${focusMode
                                ? "bg-slate-800 text-slate-200 border border-slate-500/80 hover:border-rose-400/80"
                                : "bg-sky-500/90 text-slate-950 hover:bg-sky-400"
                            }
            `}
                    >
                        {focusMode ? "Exit focus" : "Start 25-min focus"}
                    </button>
                </div>
            </div>

            {/* When focus mode is active, show a soft progress bar */}
            {focusMode && (
                <div className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-300/85 mb-1.5">
                        <span>Session progress</span>
                        <span>
                            {resolvedThisSession}/{baseline} resolved
                        </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800/90 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-fuchsia-400 to-emerald-400 transition-all duration-500"
                            style={{
                                width: `${Math.min(100, Math.round(focusProgress * 100))}%`,
                            }}
                        />
                    </div>
                </div>
            )}

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
                            {/* Left: title + description */}
                            <div>
                                <p className="text-[11px] tracking-[0.22em] text-slate-400/80 font-semibold uppercase">
                                    Focused threads · {bandLabel(selectedBand)}
                                </p>
                                <p className="text-xs text-slate-400/90 mt-1">
                                    {focusMode && selectedBand === "action"
                                        ? "Echo is keeping you in a tight action lane. Work your way down; everything else can wait."
                                        : "Echo is surfacing the most relevant threads in this band. Tap a card to act."}
                                </p>
                            </div>

                            {/* Right: controls (always aligned together) */}
                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowResolved((v) => !v)}
                                    className="
        rounded-full border border-slate-600/80
        px-3 py-1 text-[11px] text-slate-300
        hover:border-slate-400 transition
      "
                                >
                                    {showResolved ? "Hide resolved" : "Show resolved"}
                                </button>

                                {selectedBand !== "noise" && (
                                    <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] text-slate-300/90 border border-white/10">
                                        {currentEmails.length} messages
                                    </span>
                                )}
                            </div>
                        </div>



                        {currentEmails.length === 0 ? (
                            <div className="signal-card border border-dashed border-slate-600/60 p-4 text-sm text-slate-300/85 rounded-2xl">
                                No messages in this band yet. As Echo processes your inbox,
                                threads will appear here.
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setShowActive((v) => !v)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.04]"
                                >
                                    <span className="text-[11px] tracking-[0.22em] uppercase text-fuchsia-300">
                                        Active threads ({activeEmails.length})
                                    </span>
                                    <span
                                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${showActive
                                            ? "border-sky-400/70 bg-sky-500/15 text-sky-200"
                                            : "border-slate-500/80 bg-slate-800/80 text-slate-300"
                                            }`}
                                    >
                                        {showActive ? "Hide" : "Show"}
                                    </span>
                                </button>

                                {showActive && (
                                    <div className="px-4 pb-4 pt-3 space-y-4">

                                        {activeEmails.map((email) => {
                                            const isLoading = loadingEmailId === email.id;
                                            const category = (email.Category ?? "").toLowerCase();
                                            const isPrepared = preparedSet.has(email.id);
                                            const isResolved =
                                                email["Email Status"]?.toLowerCase() === "resolved" || isPrepared;

                                            let gradientClass =
                                                "from-fuchsia-400 via-pink-400 to-sky-400";
                                            if (selectedBand === "follow_up") {
                                                gradientClass = "from-violet-400 via-indigo-400 to-sky-400";
                                            }
                                            if (selectedBand === "noise") {
                                                gradientClass = "from-slate-500 via-slate-600 to-sky-500";
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
                        ${isPrepared
                                                            ? "opacity-70 bg-slate-900/40"
                                                            : isResolved
                                                                ? "opacity-50"
                                                                : ""
                                                        }
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
                                                                {/* Resolved / Outstanding */}
                                                                {isResolved ? (
                                                                    <span className="rounded-full border border-slate-600/80 px-2 py-0.5">
                                                                        Resolved
                                                                        {finishDate ? ` · ${finishDate}` : ""}
                                                                    </span>
                                                                ) : (
                                                                    <span className="rounded-full border border-sky-500/60 px-2 py-0.5 text-sky-300">
                                                                        Outstanding
                                                                    </span>
                                                                )}

                                                                {/* Raw email status if present */}
                                                                {email["Email Status"] && !isResolved && (
                                                                    <span className="rounded-full border border-slate-600/80 px-2 py-0.5">
                                                                        {email["Email Status"]}
                                                                    </span>
                                                                )}

                                                                {/* Echo state */}
                                                                {isPrepared ? (
                                                                    <span className="rounded-full border border-emerald-400/40 px-2 py-0.5 text-emerald-300/80">
                                                                        ✓ Draft saved in Outlook
                                                                    </span>
                                                                ) : !isResolved ? (
                                                                    <span className="rounded-full border border-slate-700/80 px-2 py-0.5">
                                                                        Echo-linked · Draftable
                                                                    </span>
                                                                ) : null}
                                                            </div>


                                                            {/* Buttons */}
                                                            <div className="flex flex-wrap gap-2">
                                                                {/* Generate reply */}
                                                                {preparedSet.has(email.id) ? null : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleGenerateDraft(email.id)}
                                                                        disabled={isLoading || !email["Reply Link"]}
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
                                                                )}

                                                                {/* View thread – future Outlook web link */}
                                                                <button
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        // No thread_id → predates Echo
                                                                        if (!email.thread_id) {
                                                                            setThreadData({ messages: [], unsupported: true });
                                                                            return;
                                                                        }

                                                                        try {
                                                                            setThreadLoading(true);

                                                                            const res = await fetch("/api/email-thread", {
                                                                                method: "POST",
                                                                                headers: { "Content-Type": "application/json" },
                                                                                body: JSON.stringify({ emailId: email.id }),
                                                                            });

                                                                            const data = await res.json();

                                                                            setThreadData({
                                                                                messages: data.messages ?? [],
                                                                                unsupported: Boolean(data.unsupported),
                                                                            });
                                                                        } catch (e) {
                                                                            console.error(e);
                                                                            setThreadData({ messages: [], unsupported: true });
                                                                        } finally {
                                                                            setThreadLoading(false);
                                                                        }
                                                                    }}
                                                                    className="
    rounded-full border border-slate-600/80
    text-[11px] px-3 py-1.5 text-slate-200/90
    hover:border-slate-400/90 transition
  "
                                                                >
                                                                    View thread
                                                                </button>


                                                                {/* Resolve — only for non-prepared items */}
                                                                {!isResolved && !preparedSet.has(email.id) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => resolveEmail(email.id)}
                                                                        disabled={isLoading && loadingEmailId === email.id}
                                                                        className="
      rounded-full border border-fuchsia-500/70
      text-[11px] px-3 py-1.5 text-fuchsia-200
      hover:bg-fuchsia-500/15 transition
    "
                                                                    >
                                                                        {isLoading && loadingEmailId === email.id ? "Resolving..." : "Resolve"}
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

                                {/* -------- PREPARED SECTION -------- */}
                                {preparedEmails.length > 0 && (
                                    <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setShowPrepared((v) => !v)}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.04]"
                                        >
                                            <span className="text-[11px] tracking-[0.22em] uppercase text-emerald-300">
                                                Echo already handled these ({preparedEmails.length})
                                            </span>
                                            <span
                                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${showPrepared
                                                    ? "border-sky-400/70 bg-sky-500/15 text-sky-200"
                                                    : "border-slate-500/80 bg-slate-800/80 text-slate-300"
                                                    }`}
                                            >
                                                {showPrepared ? "Hide" : "Show"}
                                            </span>
                                        </button>

                                        {showPrepared && (
                                            <div className="px-4 pb-4 pt-3 space-y-4">
                                                {preparedEmails.map((email) => (
                                                    <div
                                                        key={email.id}
                                                        onClick={() =>
                                                            setDraftPreview({
                                                                subject: email.Subject ?? "Draft reply",
                                                                bodyPreview: email.draft_body ?? null,
                                                                htmlBody: null,
                                                                webLink: null,
                                                            })
                                                        }
                                                        className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-4 opacity-80 cursor-pointer hover:bg-white/[0.04] transition"
                                                    >
                                                        <div className="flex justify-between items-start gap-3">
                                                            <p className="text-sm font-medium leading-snug">
                                                                <span className="text-slate-300/90">
                                                                    {email.From || "Unknown sender"}
                                                                </span>
                                                                <span className="text-slate-500"> - </span>
                                                                <span className="text-slate-100">
                                                                    {email.Subject || "Untitled thread"}
                                                                </span>
                                                            </p>

                                                            {email["Date Received"] && (
                                                                <div className="text-right text-[10px] text-slate-400">
                                                                    {new Date(email["Date Received"]).toLocaleDateString(undefined, {
                                                                        day: "2-digit",
                                                                        month: "short",
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {email["Action Notes"] && (
                                                            <p className="text-xs text-sky-300 mt-1 font-light italic line-clamp-2">
                                                                {email["Action Notes"]}
                                                            </p>
                                                        )}

                                                        {email.draft_body && (
                                                            <p className="text-xs text-slate-100/95 mt-2 line-clamp-2">
                                                                <span className="text-white font-semibold">Draft preview:</span>{" "}
                                                                {email.draft_body.substring(0, 120)}...
                                                            </p>
                                                        )}

                                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                                            <span className="inline-flex items-center rounded-full border border-emerald-400/45 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                                                                Draft saved in Outlook
                                                            </span>
                                                            <span className="inline-flex items-center rounded-full border border-sky-400/60 bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-200">
                                                                Click to preview
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}


                                {draftError && (
                                    <p className="mt-4 text-xs text-rose-300/90">{draftError}</p>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fallback helper text when nothing selected */}
            {!selectedBand && (
                <div className="signal-card mt-2 border border-white/10 p-6 text-sm text-slate-300/95 rounded-2xl bg-slate-900/40 backdrop-blur-xl">
                    When live, this section will show a focused list of the most important
                    threads across your inbox — ranked by Echo, not by recency. Tap a
                    band above to reveal the cinematic threads view, or start a focus
                    block to lock onto your Action emails.
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
                                ) : draftPreview.bodyPreview ? (
                                    <p className="whitespace-pre-line text-sm">
                                        {draftPreview.bodyPreview}
                                    </p>
                                ) : draftPreview.webLink ? (
                                    <p className="text-xs">
                                        Draft created ·{" "}
                                        <a
                                            className="text-sky-300 underline"
                                            href={draftPreview.webLink}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            open in Outlook
                                        </a>
                                    </p>
                                ) : (
                                    <p className="whitespace-pre-line text-sm">
                                        Draft created in Outlook. Open your drafts folder to review.
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex gap-2">
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

            {/* Thread viewer modal */}
            <AnimatePresence>
                {threadData !== null && (
                    <motion.div
                        className="fixed inset-0 z-40 flex items-center justify-center px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setThreadData(null)}
                        />

                        <motion.div
                            initial={{ y: 16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 12, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="
              relative z-50 max-w-3xl w-full
              rounded-3xl border border-white/10
              bg-slate-950/95 backdrop-blur-2xl
              shadow-[0_28px_90px_rgba(0,0,0,0.85)]
              p-6
            "
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[11px] tracking-[0.22em] text-slate-400 font-semibold uppercase">
                                    Conversation history
                                </p>
                                <button
                                    onClick={() => setThreadData(null)}
                                    className="text-xs text-slate-400 hover:text-slate-100"
                                >
                                    ✕
                                </button>
                            </div>

                            {threadLoading && (
                                <p className="text-xs text-slate-400/80 mb-3">
                                    Fetching conversation…
                                </p>
                            )}


                            {/* Messages */}
                            <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
                                {threadData.unsupported ? (
                                    <div className="py-10 text-center text-sm text-slate-400/90">
                                        This conversation predates Echo’s threading.
                                        <br />
                                        Future replies will appear here automatically.
                                    </div>
                                ) : threadData.messages.length === 0 ? (
                                    <div className="py-10 text-center text-sm text-slate-400/90">
                                        No replies yet.
                                        <br />
                                        New messages in this conversation will appear here.
                                    </div>
                                ) : (
                                    (() => {
                                        let lastGroup: string | null = null;

                                        const getGroupLabel = (date?: string) => {
                                            if (!date) return "Earlier";
                                            const d = new Date(date);
                                            const now = new Date();

                                            const isToday =
                                                d.toDateString() === now.toDateString();

                                            const yesterday = new Date();
                                            yesterday.setDate(now.getDate() - 1);

                                            const isYesterday =
                                                d.toDateString() === yesterday.toDateString();

                                            if (isToday) return "Today";
                                            if (isYesterday) return "Yesterday";
                                            return "Earlier";
                                        };

                                        return threadData.messages.map((m) => {
                                            const group = getGroupLabel(m.date);
                                            const showGroupHeader = group !== lastGroup;
                                            lastGroup = group;

                                            return (
                                                <div key={m.id}>
                                                    {/* Timeline header */}
                                                    {showGroupHeader && (
                                                        <div className="my-3 text-center text-[11px] uppercase tracking-wide text-slate-500">
                                                            {group}
                                                        </div>
                                                    )}

                                                    {/* Message bubble */}
                                                    <div
                                                        className={`rounded-xl px-4 py-3 text-sm ${m.isInbound
                                                            ? "bg-slate-900/70 text-slate-200"
                                                            : "bg-sky-900/60 text-sky-100 ml-6"
                                                            }`}
                                                    >
                                                        {/* From + date */}
                                                        <p className="text-[11px] text-slate-400 mb-0.5">
                                                            {m.from} ·{" "}
                                                            {m.date &&
                                                                new Date(m.date).toLocaleString(undefined, {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                        </p>

                                                        {/* Direction label */}
                                                        <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                                                            {m.isInbound ? "Received" : "Sent"}
                                                        </p>

                                                        {/* Body */}
                                                        <p className="leading-relaxed">{m.body}</p>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()
                                )}
                            </div>

                            <p className="mt-4 text-[11px] text-slate-400">
                                Read-only · Replies continue in Outlook
                            </p>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );




    // --- Render Band Card with unresolved count ---
    function renderBandCard(band: BandKey, label: string) {
        const unresolvedCount =
            band === "action"
                ? actionUnresolved.length
                : band === "follow_up"
                    ? followUpUnresolved.length
                    : null;

        const title =
            band === "action" ? "Action" : band === "follow_up" ? "Follow-up" : "Noise";

        const disabledInFocus = focusMode && band !== "action";

        return (
            <button
                type="button"
                onClick={() => handleSelectBand(band)}
                disabled={disabledInFocus}
                className={`
          text-left relative overflow-hidden rounded-2xl p-6 sm:p-7
          backdrop-blur-2xl bg-white/[0.07]
          border-[1.5px] border-transparent
          shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_22px_rgba(255,255,255,0.04)]
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(10,16,32,0.5))]
          transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(0,0,0,0.8)]
          outline-none focus-visible:ring-2
          ${band === "action"
                        ? "focus-visible:ring-fuchsia-400/70"
                        : band === "follow_up"
                            ? "focus-visible:ring-violet-400/70"
                            : "focus-visible:ring-sky-300/70"
                    }
          ${selectedBand === band
                        ? band === "action"
                            ? "ring-2 ring-fuchsia-400/80"
                            : band === "follow_up"
                                ? "ring-2 ring-violet-400/80"
                                : "ring-2 ring-sky-300/80"
                        : ""
                    }
          ${disabledInFocus ? "opacity-40 cursor-not-allowed hover:translate-y-0" : ""}
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
                  ${band === "action"
                                        ? "bg-gradient-to-r from-fuchsia-400 to-pink-400"
                                        : band === "follow_up"
                                            ? "bg-gradient-to-r from-violet-400 to-indigo-400"
                                            : "bg-gradient-to-r from-slate-400 via-sky-400 to-cyan-300"
                                    }
                `}
                            />
                            {band === "noise" ? (
                                <span className="text-slate-400/80">
                                    Quietly stored · no action required
                                </span>
                            ) : (
                                <span>
                                    {band === "follow_up"
                                        ? `${unresolvedCount} conversation${unresolvedCount === 1 ? "" : "s"} being tracked`
                                        : `${unresolvedCount} outstanding thread${unresolvedCount === 1 ? "" : "s"}`}
                                </span>
                            )}
                        </span>
                        {focusMode && band !== "action" && (
                            <span className="text-[10px] text-slate-400/80">
                                Paused during focus
                            </span>
                        )}
                    </div>
                </div>
            </button>
        );
    }
}
