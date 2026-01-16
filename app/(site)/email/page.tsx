// app/(site)/email/page.tsx
import { getUser } from "@/lib/getUser";
import { createClient } from "@supabase/supabase-js";
import EmailClientShell from "./EmailClientShell";

// Shared band helper – same logic as dashboard
function getBandForCategory(category: string | null) {
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

export default async function EmailPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const user = await getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-slate-200/90">
          Please{" "}
          <a className="text-sky-300 underline" href="/auth/sign-in">
            sign in
          </a>{" "}
          to view your Echo email intelligence.
        </p>
      </div>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /* -------------------------------------------------------
     EMAIL RECORDS
  ------------------------------------------------------- */
  const { data: emails } = await supabase
    .from("email_records")
    .select("*")
    .eq("user_id", user.id)
    .order("Date Received", { ascending: false });

  const all = emails ?? [];

  const view = searchParams?.view ?? "all";

  /* -------------------------------------------------------
     PREPARED DRAFTS — ALWAYS FETCH
  ------------------------------------------------------- */
  const { data: drafts } = await supabase
    .from("prepared_email_drafts")
    .select("email_record_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .not("email_record_id", "is", null);

  const preparedEmailIds = (drafts ?? [])
    .map((d) => d.email_record_id)
    .filter(Boolean) as string[];

  /* -------------------------------------------------------
     FILTER VISIBLE EMAILS (ONLY FOR prepared VIEW)
  ------------------------------------------------------- */
  const visibleEmails =
    view === "prepared"
      ? all.filter((e) => preparedEmailIds.includes(e.id))
      : all;

  /* -------------------------------------------------------
     UNRESOLVED COUNTS (HEADLINE)
  ------------------------------------------------------- */
  const unresolved = all.filter(
    (e) =>
      !e["Email Status"] ||
      e["Email Status"]?.toLowerCase() !== "resolved"
  );

  const actionUnresolved = unresolved.filter(
    (e) => getBandForCategory(e.Category) === "action"
  );
  const followUpUnresolved = unresolved.filter(
    (e) => getBandForCategory(e.Category) === "follow_up"
  );
  const noiseUnresolved = unresolved.filter(
    (e) => getBandForCategory(e.Category) === "noise"
  );

  /* -------------------------------------------------------
     DECISIONS REMOVED — LAST 30 DAYS ONLY ✅
  ------------------------------------------------------- */
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const since = Date.now() - THIRTY_DAYS_MS;

  const decisionsRemoved = all.filter((e) => {
    const received = e["Date Received"]
      ? new Date(e["Date Received"]).getTime()
      : 0;

    return (
      received >= since &&
      (preparedEmailIds.includes(e.id) ||
        Boolean(e.Summary) ||
        Boolean(e["Action Notes"]))
    );
  }).length;

  const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

const resolvedToday = all.filter(
  (e) =>
    e["Email Status"]?.toLowerCase() === "resolved" &&
    e["Finish Time"] &&
    new Date(e["Finish Time"]).getTime() >= startOfToday.getTime()
).length;


  return (
    <div className="mx-auto max-w-6xl px-6 py-20 space-y-12">
      {/* Eyebrow */}
      <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/80">
        ECHO · EMAIL INTELLIGENCE
      </p>

      {/* Hero */}
      <div className="space-y-4 max-w-3xl">
        <h1
          className="
            text-white text-3xl sm:text-4xl lg:text-[2.4rem]
            font-semibold leading-tight
            drop-shadow-[0_0_18px_rgba(0,0,0,0.5)]
          "
        >
          A calmer view of your{" "}
          <span
            className="
              bg-[linear-gradient(120deg,#f4a8ff,#beb5fd,#3abdf8)]
              bg-clip-text text-transparent
            "
          >
            inbox.
          </span>
        </h1>

        <p className="max-w-2xl text-slate-200/90 sm:text-base leading-relaxed">
          Echo will sit above your Microsoft 365 inbox and quietly organise
          everything into clear priority bands. Below is a live view of how
          your email signal is being grouped.
        </p>

        {all.length === 0 ? (
  <p className="text-xs text-slate-400/90 pt-1">
    No email records have been synced to Echo yet.
  </p>
) : (
  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
    <span className="text-slate-300/90">
      {actionUnresolved.length} action
    </span>

    <span className="text-slate-400/80">
      {followUpUnresolved.length} follow-up
    </span>

    <span className="text-emerald-300">
      {resolvedToday} resolved today
    </span>

    <span className="text-sky-300">
      {decisionsRemoved} decisions removed (30d)
    </span>
  </div>
)}

      </div>

      {/* Client shell */}
      <EmailClientShell
        emails={visibleEmails}
        preparedEmailIds={preparedEmailIds}
      />
    </div>
  );
}
