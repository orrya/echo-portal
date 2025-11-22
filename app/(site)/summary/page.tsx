// app/(site)/summary/page.tsx
import { getUser } from "@/lib/getUser";
import { createClient } from "@supabase/supabase-js";
import SummaryShell from "./SummaryShell";

type SummaryRow = {
  id: string;
  date: string; // "2025-11-20"
  mode: "am" | "pm";
  reflection: string;
  actionEmailsReceived: number | null;
  actionEmailsResolved: number | null;
  emailsReceived: number | null;
  emailsSent: number | null;
  meetings: number | null;
};

export default async function SummaryPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-slate-200/90">
          Please{" "}
          <a className="text-sky-300 underline" href="/auth/sign-in">
            sign in
          </a>{" "}
          to view your Echo summaries.
        </p>
      </div>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Pull from daily_summaries for this user
  const { data: raw, error } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("Date", { ascending: false });

  if (error) {
    console.error("Error loading daily_summaries:", error);
  }

  const summaries: SummaryRow[] =
    raw?.map((row: any) => {
      const modeRaw = (row.Mode ?? "pm").toString().toLowerCase();
      const mode: "am" | "pm" = modeRaw === "am" ? "am" : "pm";

      return {
        id: row.id ?? `${row.Date}-${mode}`,
        date: row.Date, // assuming YYYY-MM-DD or ISO-ish
        mode,
        reflection: row["Reflection Summary"] ?? "",
        actionEmailsReceived: row["Action Emails Received"] ?? null,
        actionEmailsResolved: row["Action Emails Resolved"] ?? null,
        emailsReceived: row["Emails Received"] ?? null,
        emailsSent: row["Emails Sent"] ?? null,
        meetings: row["Meetings"] ?? null,
      };
    }) ?? [];

  const total = summaries.length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 space-y-14">
      {/* Eyebrow Label */}
      <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/90">
        ECHO · DAILY SUMMARIES
      </p>

      {/* Hero Block */}
      <div className="space-y-4">
        <h1
          className="
            text-white text-3xl sm:text-4xl lg:text-[2.4rem]
            font-semibold leading-tight
            drop-shadow-[0_0_18px_rgba(0,0,0,0.45)]
          "
        >
          A single place for{" "}
          <span
            className="
              bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)]
              bg-clip-text text-transparent
            "
          >
            each day.
          </span>
        </h1>

        <p className="max-w-2xl text-slate-200/95 sm:text-base leading-relaxed">
          Echo writes a calm AM / PM snapshot of your workday – the meetings,
          threads and decisions that actually changed your trajectory.
        </p>

        <p className="text-xs text-slate-400/90 pt-1">
          {total > 0
            ? `${total} summaries stored for your account.`
            : "No summaries have been generated yet – once Echo is connected, they will appear here."}
        </p>
      </div>

      {/* Shell with bands + drawer */}
      <SummaryShell summaries={summaries} />
    </div>
  );
}
