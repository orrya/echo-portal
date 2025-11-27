import { getUser } from "@/lib/getUser";
import { createClient } from "@supabase/supabase-js";
import SummaryShell from "./SummaryShell";

type Metrics = {
  emailsReceived?: number | null;
  emailsSent?: number | null;
  actionEmailsResolved?: number | null;
  meetings?: number | null;
  [key: string]: any;
};

export type SummaryRow = {
  id: string;
  date: string; // "2025-11-20"
  mode: "am" | "pm";
  reflection: string;
  wins: string[];
  strains: string[];
  themes: string[];
  metrics: Metrics;
  htmlSummary: string;
};

function parseJsonArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((x) => typeof x === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((x) => typeof x === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}

function parseMetrics(value: any): Metrics {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Metrics;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") return parsed as Metrics;
    } catch {
      return {};
    }
  }
  return {};
}

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
      const modeRaw = (row.Mode ?? row.mode ?? "pm").toString().toLowerCase();
      const mode: "am" | "pm" = modeRaw === "am" ? "am" : "pm";

      const wins = parseJsonArray(row.wins ?? row.Wins);
      const strains = parseJsonArray(row.strains ?? row.Strains);
      const themes = parseJsonArray(row.themes ?? row.Themes);
      const metrics = parseMetrics(row.metrics ?? row.Metrics);

      return {
        id: row.id ?? `${row.Date}-${mode}`,
        date: row.Date, // assuming YYYY-MM-DD or ISO-ish
        mode,
        reflection:
          row.reflection ??
          row["Reflection Summary"] ??
          "",
        wins,
        strains,
        themes,
        metrics,
        htmlSummary: row.html_summary ?? row.htmlSummary ?? "",
      };
    }) ?? [];

  const total = summaries.length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 space-y-14">
      <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/90">
        ECHO · DAILY SUMMARIES
      </p>

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

      <SummaryShell summaries={summaries} />
    </div>
  );
}
