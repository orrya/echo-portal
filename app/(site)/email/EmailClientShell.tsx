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
  actionEmails: EmailRecord[];
  followUpEmails: EmailRecord[];
  noiseEmails: EmailRecord[];
}

export default function EmailClientShell({
  actionEmails,
  followUpEmails,
  noiseEmails,
}: Props) {
  const [selectedBand, setSelectedBand] = useState<BandKey | null>(null);
  const [loadingEmailId, setLoadingEmailId] = useState<string | null>(null);

  const bandMap: Record<BandKey, EmailRecord[]> = {
    action: actionEmails.filter(
      (e) => getBand(e.Category) === "action"
    ),
    follow_up: followUpEmails.filter(
      (e) => getBand(e.Category) === "follow_up"
    ),
    noise: noiseEmails.filter(
      (e) => getBand(e.Category) === "noise"
    ),
  };

  const currentEmails =
    selectedBand === null ? [] : bandMap[selectedBand] ?? [];

  function getBand(category: string | null) {
    const c = (category ?? "").toLowerCase();
    if (c.includes("follow")) return "follow_up";
    if (
      c.includes("info") ||
      c.includes("promo") ||
      c.includes("newsletter")
    )
      return "noise";
    return "action";
  }

  // --- MARK EMAIL AS RESOLVED ---
  const resolveEmail = async (emailId: string) => {
    setLoadingEmailId(emailId);

    try {
      const res = await fetch("/api/resolve-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });

      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (err) {
      console.error("Resolve error:", err);
    } finally {
      setLoadingEmailId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Category cards */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {renderBandCard("action", "ACTION BAND")}
        {renderBandCard("follow_up", "FOLLOW-UP BAND")}
        {renderBandCard("noise", "NOISE BAND")}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selectedBand && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl p-6 sm:p-7"
          >
            {currentEmails.map((email) => {
              const resolved =
                email["Email Status"]?.toLowerCase() === "resolved";

              return (
                <div
                  key={email.id}
                  className={`
                    relative rounded-2xl border border-white/10 bg-slate-900/70 p-4 mb-4
                    ${resolved ? "opacity-50 grayscale" : ""}
                  `}
                >
                  {/* Title row */}
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <p className="text-xs uppercase text-slate-400/80">
                        {email.Category ?? selectedBand}
                      </p>
                      <p className="text-sm font-medium text-slate-50">
                        {email.Subject}
                      </p>
                    </div>

                    <div className="text-xs text-right text-slate-400">
                      {email["Date Received"] &&
                        new Date(email["Date Received"]).toLocaleString()}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300/90">
                    {email.Summary ?? email["Action Notes"] ?? ""}
                  </p>

                  {/* STATUS + ACTIONS */}
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex gap-2">
                      {resolved ? (
                        <span className="text-[11px] px-2 py-1 rounded-full border border-slate-600/80 text-slate-300">
                          Resolved ·{" "}
                          {email["Finish Time"]
                            ? new Date(email["Finish Time"]).toLocaleDateString(
                                undefined,
                                { day: "2-digit", month: "short" }
                              )
                            : ""}
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-1 rounded-full border border-sky-500/40 text-sky-300">
                          Outstanding
                        </span>
                      )}
                    </div>

                    {!resolved && (
                      <button
                        onClick={() => resolveEmail(email.id)}
                        disabled={loadingEmailId === email.id}
                        className="text-xs px-3 py-1.5 rounded-full bg-fuchsia-500/90 text-slate-900 font-semibold"
                      >
                        {loadingEmailId === email.id
                          ? "Resolving..."
                          : "Resolve"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // --- Render Band Card ---
  function renderBandCard(band: BandKey, label: string) {
    const count = bandMap[band].filter(
      (e) =>
        !e["Email Status"] ||
        e["Email Status"]?.toLowerCase() !== "resolved"
    ).length;

    return (
      <button
        onClick={() =>
          setSelectedBand((prev) => (prev === band ? null : band))
        }
        className="relative rounded-2xl p-6 sm:p-7 bg-white/[0.07] backdrop-blur-2xl border border-white/10"
      >
        <p className="text-[11px] tracking-[0.22em] text-slate-300/75 font-semibold">
          {label}
        </p>
        <h2 className="text-xl text-white mt-2 capitalize">{band}</h2>
        <p className="text-xs text-slate-400 mt-4">{count} outstanding</p>
      </button>
    );
  }
}
