// app/(site)/email/page.tsx
import { getUserFromSession } from "@/lib/getUserFromSession";
import { createClient } from "@supabase/supabase-js";
import EmailClientShell from "./EmailClientShell";

// 🔥 Correct category → band mapping
function getBandForCategory(category: string | null) {
  const c = (category ?? "").toLowerCase().trim();

  if (c === "follow-up" || c.includes("follow")) return "follow_up";
  if (c === "informational" || c.includes("info") || c.includes("promo") || c.includes("newsletter")) {
    return "noise";
  }

  return "action"; // default
}

export default async function EmailPage() {
  const user = await getUserFromSession();

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

  // 🎯 FIXED: Proper band grouping
  const actionEmails = all.filter(
    (e) => getBandForCategory(e.Category) === "action"
  );

  const followUpEmails = all.filter(
    (e) => getBandForCategory(e.Category) === "follow_up"
  );

  const noiseEmails = all.filter(
    (e) => getBandForCategory(e.Category) === "noise"
  );

  const total = all.length;

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
          everything into clear priority bands. Below is a preview of how your
          email signal will be grouped.
        </p>

        <p className="text-xs text-slate-400/90 pt-1">
          {total === 0
            ? "No email records have been synced to Echo yet."
            : `${total} messages processed · ${actionEmails.length} action · ${followUpEmails.length} follow-up · ${noiseEmails.length} noise`}
        </p>
      </div>

      {/* Category cards + drawer */}
      <EmailClientShell
        actionEmails={actionEmails}
        followUpEmails={followUpEmails}
        noiseEmails={noiseEmails}
      />
    </div>
  );
}
