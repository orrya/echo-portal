import { getUser } from "@/lib/getUser";
import { createClient } from "@supabase/supabase-js";
import { Zap, Mail, Bell } from "lucide-react";

// ✅ ADD THIS
import DashboardSubscription from "./DashboardSubscription";

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
    <>
      {/* 🔥 ADD THIS — calls /api/ms-subscription ONCE when dashboard loads */}
      <DashboardSubscription />

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Eyebrow + hero */}
        <div className="space-y-4 pt-6">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/70">
            ECHO · DASHBOARD
          </p>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3 max-w-xl translate-y-[6px]">
              <h1
                className="
              text-white text-3xl sm:text-4xl lg:text-[2.25rem]
              font-semibold leading-tight
              drop-shadow-[0_0_16px_rgba(0,0,0,0.45)]
            "
              >
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
              <div
                className="
              flex items-center gap-2
              rounded-full border border-white/20 bg-white/[0.06]
              px-3 py-1.5 text-[11px] sm:text-xs font-medium text-slate-200
              backdrop-blur-xl
            "
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected
                      ? "bg-gradient-to-r from-sky-400 to-fuchsia-400 shadow-[0_0_8px_rgba(168,85,247,0.55)]"
                      : "bg-slate-500"
                  }`}
                />
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
              </div>

              {outstandingActionCount > 0 && (
                <div
                  className="
                inline-flex items-center gap-1
                rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10
                px-3 py-1 text-[11px] text-fuchsia-100
              "
                >
                  <Zap size={12} className="opacity-80" />
                  <span>{outstandingActionCount} action threads outstanding</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN GRID — UNTOUCHED */}
        {/* ... your entire UI remains exactly the same ... */}

        <div className="pt-4 text-center text-[11px] text-slate-400/80">
          Designed by Orrya · The Quiet Intelligence Layer.
        </div>
      </div>
    </>
  );
}
