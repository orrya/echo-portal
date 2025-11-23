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

export default async function EmailPage() {
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

  const { data: emails } = await supabase
    .from("email_records")
    .select("*")
    .eq("user_id", user.id)
    .order("Date Received", { ascending: false });

  const all = emails ?? [];

  // Unresolved for headline counts (match dashboard semantics)
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

        <p className="text-xs text-slate-400/90 pt-1">
          {all.length === 0
            ? "No email records have been synced to Echo yet."
            : `${all.length} messages processed · ${actionUnresolved.length} action · ${followUpUnresolved.length} follow-up · ${noiseUnresolved.length} noise`}
        </p>
      </div>

      {/* Shell gets the full list; it handles bands, focus mode, etc. */}
      <EmailClientShell emails={all} />
    </div>
  );
}
