import { getUser } from "@/lib/getUser";
import { createClient } from "@supabase/supabase-js";
import { Zap, Mail, Bell } from "lucide-react";

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
  const { data: summaryRows } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("Date", { ascending: false });

  const todayStr = new Date().toISOString().slice(0, 10);

  const todayAM = summaryRows?.find(
    (r) => r.Date.startsWith(todayStr) && (r.Mode?.toLowerCase() === "am")
  );

  const todayPM = summaryRows?.find(
    (r) => r.Date.startsWith(todayStr) && (r.Mode?.toLowerCase() === "pm")
  );

  const nextWindow =
    new Date().getHours() < 12 ? "8:00 AM" : "5:00 PM";

  // ---- EMAIL BANDS ----
  const { data: emails } = await supabase
    .from("email_records")
    .select("Category")
    .eq("user_id", user.id);

  const getBand = (c: string | null) => {
    if (!c) return "action";
    const cc = c.toLowerCase();
    if (cc.includes("follow")) return "follow_up";
    if (
      cc.includes("info") ||
      cc.includes("promo") ||
      cc.includes("newsletter") ||
      cc === "informational"
    )
      return "noise";
    return "action";
  };

  const actionCount = emails?.filter((e) => getBand(e.Category) === "action").length ?? 0;
  const followCount = emails?.filter((e) => getBand(e.Category) === "follow_up").length ?? 0;
  const noiseCount = emails?.filter((e) => getBand(e.Category) === "noise").length ?? 0;

  const isConnected = emails && emails.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      {/* Eyebrow + hero */}
      <div className="space-y-4 pt-6">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/70">
          ECHO · DASHBOARD
        </p>

        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Title */}
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
              Your control surface for summaries, email intelligence, and daily signal optimisation.
            </p>
          </div>

          {/* Connection Status */}
          <div
            className="
              flex items-center gap-2
              rounded-full
              border border-white/20
              bg-white/[0.06]
              px-3 py-1.5
              text-[11px] sm:text-xs
              font-medium text-slate-200
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
        </div>
      </div>

      {/* Main modules */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* SUMMARY CARD */}
        <div
          className="
            relative overflow-hidden rounded-2xl backdrop-blur-2xl
            bg-white/[0.09] border border-white/14
            shadow-[0_20px_70px_rgba(0,0,0,0.58)]
            hover:shadow-[0_24px_90px_rgba(0,0,0,0.7)]
            transition-all p-6 sm:p-7
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(255,255,255,0.04)]" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              SUMMARY · ECHO AM / PM
            </p>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                Today&apos;s Summary
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

        {/* EMAIL INTELLIGENCE */}
        <div
          className="
            relative overflow-hidden rounded-2xl backdrop-blur-2xl
            bg-white/[0.09] border border-white/14
            shadow-[0_20px_70px_rgba(0,0,0,0.58)]
            hover:shadow-[0_24px_90px_rgba(0,0,0,0.7)]
            transition-all p-6 sm:p-7
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_22px_rgba(255,255,255,0.04)]" />

          <div className="relative space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-300/80">
              EMAIL · SIGNAL BANDS
            </p>

            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              Email Intelligence
            </h2>

            <p className="text-sm text-slate-200/90">
              Echo classifies messages into action, follow-up, or noise.
            </p>

            <div className="mt-4 grid gap-2 text-sm text-slate-200/95">
              {/* ACTION */}
              <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(244,114,182,0.25)]">
                <span className="flex items-center gap-1">
                  <Zap size={14} className="text-fuchsia-400 opacity-80" />
                  Action
                </span>
                <span className="text-slate-400/90 text-xs">{actionCount} threads</span>
              </div>

              {/* FOLLOW UP */}
              <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(129,140,248,0.26)]">
                <span className="flex items-center gap-1">
                  <Mail size={14} className="text-violet-300 opacity-80" />
                  Follow-up
                </span>
                <span className="text-slate-400/90 text-xs">{followCount} threads</span>
              </div>

              {/* NOISE */}
              <div className="flex items-center justify-between rounded-xl px-3 py-2 border border-white/10 bg-slate-900/40 shadow-[0_-2px_12px_rgba(56,189,248,0.28)]">
                <span className="flex items-center gap-1">
                  <Bell size={14} className="text-sky-300 opacity-80" />
                  Noise
                </span>
                <span className="text-slate-400/90 text-xs">{noiseCount} threads</span>
              </div>

              <p className="pt-1 text-[11px] text-slate-400/85">
                Echo keeps your inbox calm by organising the signal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div className="pt-4 text-center text-[11px] text-slate-400/80">
        Designed by Orrya · The Quiet Intelligence Layer.
      </div>
    </div>
  );
}
