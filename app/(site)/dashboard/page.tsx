import { getUser } from "@/lib/getUser";
import { createClient } from "@supabase/supabase-js";
import { Zap, Mail, Bell } from "lucide-react";

type DailySummaryRow = {
  Date: string;
  Mode?: string | null;
};

type EmailRecordRow = {
  Category: string | null;
  "Email Status"?: string | null;
  "Date Received"?: string | null;
  Subject?: string | null;
  From?: string | null;
  Summary?: string | null;
};

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-slate-200/90">
          Please{" "}
          <a className="text-sky-300 underline" href="/auth/sign-in">
            sign in
          </a>{" "}
          to access your Echo dashboard.
        </p>
      </div>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ---- SUMMARY STATUS ----
  const { data: summaryRowsRaw } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("Date", { ascending: false });

  const summaryRows = (summaryRowsRaw ?? []) as DailySummaryRow[];
  const todayStr = new Date().toISOString().slice(0, 10);

  const todayAM = summaryRows.find(
    (r) =>
      r.Date.startsWith(todayStr) &&
      (r.Mode?.toLowerCase() === "am" || r.Mode?.toLowerCase() === "morning")
  );

  const todayPM = summaryRows.find(
    (r) =>
      r.Date.startsWith(todayStr) &&
      (r.Mode?.toLowerCase() === "pm" || r.Mode?.toLowerCase() === "evening")
  );

  const nextWindow = new Date().getHours() < 12 ? "8:00 AM" : "5:00 PM";

  // ---- EMAIL BANDS ----
  const { data: emailsRaw } = await supabase
    .from("email_records")
    .select('Category,"Email Status","Date Received",Subject,From,Summary')
    .eq("user_id", user.id);

  const emails = (emailsRaw ?? []) as EmailRecordRow[];
  const unresolvedEmails = emails.filter(
    (e) => e["Email Status"] !== "Resolved"
  );

  const getBand = (c: string | null) => {
    if (!c) return "action";
    const cc = c.toLowerCase();
    if (cc.includes("follow")) return "follow_up";
    if (
      cc.includes("info") ||
      cc.includes("promo") ||
      cc.includes("newsletter") ||
      cc === "informational"
    ) {
      return "noise";
    }
    return "action";
  };

  const unresolvedAction = unresolvedEmails.filter(
    (e) => getBand(e.Category) === "action"
  );
  const unresolvedFollow = unresolvedEmails.filter(
    (e) => getBand(e.Category) === "follow_up"
  );
  const unresolvedNoise = unresolvedEmails.filter(
    (e) => getBand(e.Category) === "noise"
  );

  const outstandingActionCount = unresolvedAction.length;
  const followCount = unresolvedFollow.length;
  const noiseCount = unresolvedNoise.length;

  const keyEmail =
    unresolvedAction
      .filter((e) => !!e["Date Received"])
      .slice()
      .sort(
        (a, b) =>
          new Date(b["Date Received"] as string).getTime() -
          new Date(a["Date Received"] as string).getTime()
      )[0] ?? null;

  const isConnected = emails.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      {/* Eyebrow + hero */}
      <div className="space-y-4 pt-6">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/70">
          ECHO · DASHBOARD
        </p>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3 max-w-xl translate-y-[6px]">
            <h1 className="
              text-white text-3xl sm:text-4xl lg:text-[2.25rem]
              font-semibold leading-tight
              drop-shadow-[0_0_16px_rgba(0,0,0,0.45)]
            ">
              Quiet tools for{" "}
              <span className="bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)] bg-clip-text text-transparent">
                louder thinking.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed">
              Your control surface for summaries, email intelligence, and daily
              signal optimisation.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="
              flex items-center gap-2
              rounded-full border border-white/20 bg-white/[0.06]
              px-3 py-1.5 text-[11px] sm:text-xs font-medium text-slate-200
              backdrop-blur-xl
            ">
              <span className={`h-2 w-2 rounded-full ${
                isConnected
                  ? "bg-gradient-to-r from-sky-400 to-fuchsia-400 shadow-[0_0_8px_rgba(168,85,247,0.55)]"
                  : "bg-slate-500"
              }`} />
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>

            {outstandingActionCount > 0 && (
              <div className="
                inline-flex items-center gap-1
                rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10
                px-3 py-1 text-[11px] text-fuchsia-100
              ">
                <Zap size={12} className="opacity-80" />
                <span>{outstandingActionCount} action threads outstanding</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* SUMMARY CARD */}
        <div className="
          relative overflow-hidden rounded-2xl backdrop-blur-2xl
          bg-white/[0.09] border border-white/14 shadow-[0_20px_70px_rgba(0,0,0,0.58)]
          hover:shadow-[0_24px_90px_rgba(0,0,0,0.7)] transition-all p-6 sm:p-7
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.07),rgba(255,255,255,0.02))]
        ">
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(255,255,255,0.04)]" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              SUMMARY · ECHO AM / PM
            </p>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Today's Summary
              </h2>
              {todayAM || todayPM ? (
                <p className="text-sm text-slate-200/90 leading-relaxed">
                  {todayPM
                    ? "Your PM reflection is ready."
                    : "Your AM reflection is ready."}
                </p>
              ) : (
                <p className="text-sm text-slate-200/90">
                  Echo will generate a calm AM/PM digest once Microsoft 365 is connected.
                </p>
              )}
            </div>

            <div className="mt-3 grid gap-3 text-sm text-slate-200/95">
              <div className="flex items-center justify-between">
                <span className="text-slate-300/90">Status</span>
                <span className="rounded-full border border-slate-500/40 bg-slate-900/40 px-2.5 py-1 text-[11px] uppercase tracking-[0.13em]">
                  {todayAM || todayPM ? "Generated" : "Waiting"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300/80">Next window</span>
                <span className="text-slate-100/95">{nextWindow}</span>
              </div>

              <p className="pt-1 text-[11px] text-slate-400/85">
                Echo generates summaries twice a day using your real email activity.
              </p>
            </div>
          </div>
        </div>

        {/* EMAIL INTELLIGENCE CARD */}
        <div className="
          relative overflow-hidden rounded-2xl backdrop-blur-2xl
          bg-white/[0.09] border border-white/14 shadow-[0_20px_70px_rgba(0,0,0,0.58)]
          hover:shadow-[0_24px_90px_rgba(0,0,0,0.7)] transition-all p-6 sm:p-7
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.07),rgba(255,255,255,0.02))]
        ">
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(255,255,255,0.04)]" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              EMAIL · SIGNAL BANDS
            </p>

            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              Email Intelligence
            </h2>

            <p className="text-sm text-slate-200/90">
              Echo classifies messages into action, follow-up, and noise — only counting
              threads that still need attention.
            </p>

            <div className="mt-4 grid gap-2 text-sm text-slate-200/95">
              {/* ACTION */}
              <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(244,114,182,0.25)]">
                <span className="flex items-center gap-1">
                  <Zap size={14} className="text-fuchsia-400 opacity-80" /> Action
                </span>
                <span className="text-slate-400/90 text-xs">
                  {outstandingActionCount} threads outstanding
                </span>
              </div>

              {/* FOLLOW UP */}
              <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(129,140,248,0.26)]">
                <span className="flex items-center gap-1">
                  <Mail size={14} className="text-violet-300 opacity-80" /> Follow-up
                </span>
                <span className="text-slate-400/90 text-xs">
                  {followCount} threads tracking
                </span>
              </div>

              {/* NOISE */}
              <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(56,189,248,0.28)]">
                <span className="flex items-center gap-1">
                  <Bell size={14} className="text-sky-300 opacity-80" /> Noise
                </span>
                <span className="text-slate-400/90 text-xs">
                  {noiseCount} threads muted
                </span>
              </div>
            </div>

            {/* KEY EMAIL */}
            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs sm:text-[13px] text-slate-200/95">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400/85 mb-1.5">
                Today's key email
              </p>

              {keyEmail ? (
                <>
                  <p className="font-medium line-clamp-2 text-slate-50">
                    {keyEmail.Subject || "Untitled thread"}
                  </p>

                  <p className="mt-0.5 text-slate-400/90 line-clamp-1">
                    {keyEmail.From}
                  </p>

                  {keyEmail.Summary && (
                    <p className="mt-1 text-slate-300/90 line-clamp-2">
                      {keyEmail.Summary}
                    </p>
                  )}

                  <p className="mt-2 text-[10px] text-slate-500/90">
                    Pulled from your Action band · unresolved only.
                  </p>
                </>
              ) : (
                <p className="text-slate-400/90">
                  Once Echo has outstanding action threads, your highest-signal
                  one will appear here.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTNOTE */}
      <div className="pt-4 text-center text-[11px] text-slate-400/80">
        Designed by Orrya · The Quiet Intelligence Layer.
      </div>
    </div>
  );
}
