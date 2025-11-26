import { getUser } from "@/lib/getUser";
import { Zap } from "lucide-react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

type DailySummaryRow = {
  Date: string;
  Mode?: string | null;
  Summary?: string | null;
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

  // Supabase server client (RLS enabled)
  const supabase = createServerComponentClient(
    { cookies },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    }
  );

  // ---- DAILY SUMMARIES ----
  const { data: summaryRowsRaw } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("Date", { ascending: false });

  const summaries = (summaryRowsRaw ?? []) as DailySummaryRow[];

  const todayStr = new Date().toISOString().slice(0, 10);

  const todayAM = summaries.find(
    (s) =>
      s.Date.startsWith(todayStr) &&
      ["am", "morning"].includes((s.Mode ?? "").toLowerCase())
  );

  const todayPM = summaries.find(
    (s) =>
      s.Date.startsWith(todayStr) &&
      ["pm", "evening"].includes((s.Mode ?? "").toLowerCase())
  );

  const nextWindow = new Date().getHours() < 12 ? "8:00 AM" : "5:00 PM";

  // ---- EMAIL RECORDS ----
  const { data: emailsRaw } = await supabase
    .from("email_records")
    .select('Category,"Email Status","Date Received",Subject,From,Summary')
    .eq("user_id", user.id);

  const emails = (emailsRaw ?? []) as EmailRecordRow[];

  const unresolved = emails.filter((e) => e["Email Status"] !== "Resolved");

  const getBand = (c: string | null) => {
    if (!c) return "action";
    const v = c.toLowerCase();
    if (v.includes("follow")) return "follow_up";
    if (["info", "promo", "newsletter", "informational"].some((x) => v.includes(x)))
      return "noise";
    return "action";
  };

  const actionEmails = unresolved.filter((e) => getBand(e.Category) === "action");
  const followEmails = unresolved.filter((e) => getBand(e.Category) === "follow_up");
  const noiseEmails = unresolved.filter((e) => getBand(e.Category) === "noise");

  const keyEmail =
    actionEmails
      .filter((e) => !!e["Date Received"])
      .sort(
        (a, b) =>
          new Date(b["Date Received"] ?? "").getTime() -
          new Date(a["Date Received"] ?? "").getTime()
      )[0] ?? null;

  const isConnected = emails.length > 0;

  // ------------------------------------------
  // ------------   RENDER UI    --------------
  // ------------------------------------------
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      {/* Header + Hero */}
      <div className="space-y-4 pt-6">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/70">
          ECHO · DASHBOARD
        </p>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3 max-w-xl translate-y-[6px]">
            <h1 className="text-white text-3xl sm:text-4xl lg:text-[2.25rem] font-semibold leading-tight drop-shadow-[0_0_16px_rgba(0,0,0,0.45)]">
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
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-[11px] sm:text-xs font-medium text-slate-200 backdrop-blur-xl">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected
                    ? "bg-gradient-to-r from-sky-400 to-fuchsia-400 shadow-[0_0_8px_rgba(168,85,247,0.55)]"
                    : "bg-slate-500"
                }`}
              />
              <span>{isConnected ? "Connected" : "Disconnected"}</span>
            </div>

            {actionEmails.length > 0 && (
              <div className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] text-fuchsia-100">
                <Zap size={12} className="opacity-80" />
                <span>{actionEmails.length} action threads outstanding</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------- */}
      {/* Daily Summaries */}
      {/* -------------------------------------- */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Today’s Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AM */}
          <div className="rounded-xl bg-white/[0.05] border border-white/10 p-4 backdrop-blur-xl">
            <p className="text-sm text-slate-300/80 mb-1">Morning Summary</p>
            {todayAM ? (
              <p className="text-slate-100">{todayAM.Summary ?? "(No details)"}</p>
            ) : (
              <p className="text-slate-500 italic">
                Not generated yet · Next at 8:00 AM
              </p>
            )}
          </div>

          {/* PM */}
          <div className="rounded-xl bg-white/[0.05] border border-white/10 p-4 backdrop-blur-xl">
            <p className="text-sm text-slate-300/80 mb-1">Evening Summary</p>
            {todayPM ? (
              <p className="text-slate-100">{todayPM.Summary ?? "(No details)"}</p>
            ) : (
              <p className="text-slate-500 italic">
                Not generated yet · Next at 5:00 PM
              </p>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------- */}
      {/* Key Email */}
      {/* -------------------------------------- */}
      <div className="pt-10 space-y-6">
        <h2 className="text-xl font-semibold text-white">Key Signal</h2>

        <div className="rounded-xl bg-white/[0.05] border border-white/10 p-4 backdrop-blur-xl">
          {keyEmail ? (
            <>
              <p className="text-slate-300/80 mb-2">
                Latest actionable email received:
              </p>
              <p className="text-white font-medium">{keyEmail.Subject}</p>
              <p className="text-slate-400 text-sm mt-1">from {keyEmail.From}</p>
              <p className="text-slate-300/70 mt-3">{keyEmail.Summary}</p>
            </>
          ) : (
            <p className="text-slate-500 italic">No actionable emails detected.</p>
          )}
        </div>
      </div>

      {/* -------------------------------------- */}
      {/* Email Bands */}
      {/* -------------------------------------- */}
      <div className="pt-10 space-y-6">
        <h2 className="text-xl font-semibold text-white">Your Inbox Signals</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action */}
          <div className="rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/20 p-4">
            <p className="text-fuchsia-300 text-sm font-medium">Action</p>
            <p className="text-white text-3xl font-bold mt-2">
              {actionEmails.length}
            </p>
            <p className="text-slate-400 text-sm mt-1">threads requiring attention</p>
          </div>

          {/* Follow Up */}
          <div className="rounded-xl bg-sky-500/10 border border-sky-400/20 p-4">
            <p className="text-sky-300 text-sm font-medium">Follow-Up</p>
            <p className="text-white text-3xl font-bold mt-2">
              {followEmails.length}
            </p>
            <p className="text-slate-400 text-sm mt-1">threads to revisit</p>
          </div>

          {/* Noise */}
          <div className="rounded-xl bg-purple-500/10 border border-purple-400/20 p-4">
            <p className="text-purple-300 text-sm font-medium">Noise</p>
            <p className="text-white text-3xl font-bold mt-2">
              {noiseEmails.length}
            </p>
            <p className="text-slate-400 text-sm mt-1">low-signal messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}
