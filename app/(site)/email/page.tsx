// app/(site)/email/page.tsx
import { getUserFromSession } from "@/lib/getUserFromSession";
import { createClient } from "@supabase/supabase-js";
import EmailClientShell from "./EmailClientShell";

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

  // ✅ SAFE: This is a SERVER COMPONENT — service key never leaves server
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: emails } = await supabase
    .from("email_records") // ← your real table
    .select("*")
    .eq("user_id", user.id)
    .order("Date Received", { ascending: false });

  const actionEmails = emails?.filter(
    (e) => (e.Category ?? "").toLowerCase().includes("action")
  ) ?? [];

  const followUpEmails = emails?.filter(
    (e) => (e.Category ?? "").toLowerCase().includes("follow")
  ) ?? [];

  const noiseEmails = emails?.filter(
    (e) =>
      (e.Category ?? "").toLowerCase().includes("noise") ||
      (e.Category ?? "").toLowerCase().includes("promo") ||
      (e.Category ?? "").toLowerCase().includes("muted")
  ) ?? [];

  const total = emails?.length ?? 0;

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

      {/* Category cards + cinematic drawer system */}
      <EmailClientShell
        actionEmails={actionEmails}
        followUpEmails={followUpEmails}
        noiseEmails={noiseEmails}
      />
    </div>
  );
}
