// app/(site)/email/page.tsx
import { getUser } from "@/lib/getUser";
import { createClient } from "@supabase/supabase-js";
import EmailClientShell from "./EmailClientShell";

function getBandForCategory(category: string | null) {
  const c = (category ?? "").toLowerCase().trim();

  if (c.includes("follow")) return "follow_up";
  if (
    c.includes("info") ||
    c.includes("promo") ||
    c.includes("newsletter") ||
    c === "informational"
  )
    return "noise";

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

  // ---- Filter unresolved ----
  const unresolved = all.filter(
    (e) =>
      !e["Email Status"] ||
      e["Email Status"]?.toLowerCase() !== "resolved"
  );

  const actionEmails = unresolved.filter(
    (e) => getBandForCategory(e.Category) === "action"
  );
  const followUpEmails = unresolved.filter(
    (e) => getBandForCategory(e.Category) === "follow_up"
  );
  const noiseEmails = unresolved.filter(
    (e) => getBandForCategory(e.Category) === "noise"
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 space-y-12">
      <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/80">
        ECHO · EMAIL INTELLIGENCE
      </p>

      <div className="space-y-4 max-w-3xl">
        <h1 className="text-white text-3xl sm:text-4xl lg:text-[2.4rem] font-semibold leading-tight">
          A calmer view of your{" "}
          <span className="bg-[linear-gradient(120deg,#f4a8ff,#beb5fd,#3abdf8)] bg-clip-text text-transparent">
            inbox.
          </span>
        </h1>

        <p className="max-w-2xl text-slate-200/90 sm:text-base leading-relaxed">
          Echo quietly organises your inbox into focused priority bands.
        </p>

        <p className="text-xs text-slate-400/90 pt-1">
          {all.length === 0
            ? "No email records have been synced to Echo yet."
            : `${all.length} messages processed · ${actionEmails.length} action · ${followUpEmails.length} follow-up · ${noiseEmails.length} noise`}
        </p>
      </div>

      <EmailClientShell
        actionEmails={actionEmails}
        followUpEmails={followUpEmails}
        noiseEmails={noiseEmails}
      />
    </div>
  );
}
