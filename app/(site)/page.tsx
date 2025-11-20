"use client";

import { useEffect, useState } from "react";
import { useSupabaseSession } from "@/components/SupabaseProvider";

import MeetingList, { Meeting } from "@/components/MeetingList";
import EmailList, { Email } from "@/components/EmailList";
import SummaryCard, { Summary } from "@/components/SummaryCard";

import { supabaseClient } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const session = useSupabaseSession();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      setLoading(true);

      const userId = session.user.id;

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const startOfDay = `${todayStr}T00:00:00.000Z`;
      const endOfDay = `${todayStr}T23:59:59.999Z`;

      const { data: meetingsData } = await supabaseClient
        .from("meetings")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", startOfDay)
        .lte("start_time", endOfDay)
        .order("start_time");

      const { data: emailsData } = await supabaseClient
        .from("emails")
        .select("*")
        .eq("user_id", userId)
        .order("received_at", { ascending: false })
        .limit(20);

      const { data: summariesData } = await supabaseClient
        .from("summaries")
        .select("*")
        .eq("user_id", userId)
        .eq("summary_date", todayStr)
        .order("time_of_day");

      setMeetings(meetingsData ?? []);
      setEmails(emailsData ?? []);
      setSummaries(summariesData ?? []);

      setLoading(false);
    };

    fetchData();
  }, [session]);

  if (!session) {
    return (
      <div className="text-center py-10 text-slate-300">
        Please{" "}
        <a className="text-purple underline" href="/auth/sign-in">
          sign in
        </a>
        .
      </div>
    );
  }

  const actionEmails = emails.filter((e) => e.category === "action" && !e.resolved);
  const followUpEmails = emails.filter((e) => e.category === "follow_up" && !e.resolved);
  const noiseEmails = emails.filter((e) => e.category === "noise" && !e.resolved);

  return (
    <div className="relative">

      {/* Orrya cinematic background */}
      <div className="absolute inset-0 z-0 opacity-60 blur-3xl pointer-events-none
        bg-[radial-gradient(circle_at_30%_20%,rgba(168,110,255,0.35),transparent_70%), 
            radial-gradient(circle_at_80%_80%,rgba(80,180,255,0.20),transparent_70%)]" 
      />

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 mb-10"
      >
        <h1 className="text-4xl font-semibold text-white tracking-tight drop-shadow-[0_0_18px_rgba(0,0,0,0.45)]">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-300 uppercase tracking-[0.18em]">
          Quiet Intelligence · Orrya Echo Suite
        </p>
      </motion.div>

      <div className="relative z-10 space-y-12">

        {/* Meetings */}
        <OrryaSection title="Today’s meetings" loading={loading}>
          <MeetingList meetings={meetings} />
        </OrryaSection>

        {/* Emails */}
        <OrryaSection title="Emails" loading={loading}>
          <EmailList emails={actionEmails} title="Action" />
          <EmailList emails={followUpEmails} title="Follow-up" />
          <EmailList emails={noiseEmails} title="Noise" />
        </OrryaSection>

        {/* Summaries */}
        <OrryaSection title="Today’s summaries" loading={loading}>
          <SummaryCard summaries={summaries} />
        </OrryaSection>

      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/*  REUSABLE ORRYA GLASS SECTION WRAPPER                                 */
/* --------------------------------------------------------------------- */

function OrryaSection({
  title,
  loading,
  children,
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="
        rounded-2xl p-6
        bg-white/5 backdrop-blur-xl
        border border-white/10
        shadow-[0_0_40px_rgba(0,0,0,0.25)]
      "
    >
      <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
        {title}
      </h2>

      {loading ? (
        <p className="text-slate-300">Loading...</p>
      ) : (
        children
      )}
    </motion.section>
  );
}
