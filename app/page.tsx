'use client';

import { useEffect, useState } from 'react';
import { useSupabaseSession } from '@/components/SupabaseProvider';

import MeetingList, { Meeting } from '@/components/MeetingList';
import EmailList, { Email } from '@/components/EmailList';
import SummaryCard, { Summary } from '@/components/SummaryCard';

import { supabaseClient } from '@/lib/supabaseClient';

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
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const startOfDay = `${todayStr}T00:00:00.000Z`;
      const endOfDay = `${todayStr}T23:59:59.999Z`;

      const { data: meetingsData } = await supabaseClient
        .from('meetings')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time');

      const { data: emailsData } = await supabaseClient
        .from('emails')
        .select('*')
        .eq('user_id', userId)
        .order('received_at', { ascending: false })
        .limit(20);

      const { data: summariesData } = await supabaseClient
        .from('summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('summary_date', todayStr)
        .order('time_of_day');

      setMeetings(meetingsData ?? []);
      setEmails(emailsData ?? []);
      setSummaries(summariesData ?? []);

      setLoading(false);
    };

    fetchData();
  }, [session]);

  if (!session) {
    return (
      <div className="text-center py-10">
        Please{' '}
        <a className="text-purple underline" href="/auth/sign-in">
          sign in
        </a>
        .
      </div>
    );
  }

  const actionEmails = emails.filter((e) => e.category === 'action' && !e.resolved);
  const followUpEmails = emails.filter((e) => e.category === 'follow_up' && !e.resolved);
  const noiseEmails = emails.filter((e) => e.category === 'noise' && !e.resolved);

  return (
    <div className="space-y-8">

      {/* Meetings */}
      <section>
        <h2 className="text-xl font-semibold text-purple mb-2">
          Today&apos;s meetings
        </h2>

        {loading ? <p>Loading...</p> : <MeetingList meetings={meetings} />}
      </section>

      {/* Emails */}
      <section>
        <h2 className="text-xl font-semibold text-purple mb-2">Emails</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <EmailList emails={actionEmails} title="Action" />
            <EmailList emails={followUpEmails} title="Follow-up" />
            <EmailList emails={noiseEmails} title="Noise" />
          </>
        )}
      </section>

      {/* Summaries */}
      <section>
        <h2 className="text-xl font-semibold text-purple mb-2">
          Today&apos;s summaries
        </h2>

        {loading ? <p>Loading...</p> : <SummaryCard summaries={summaries} />}
      </section>
    </div>
  );
}
