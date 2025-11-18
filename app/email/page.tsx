'use client'

import { useEffect, useState } from 'react'
import { useSupabaseSession } from '@/components/SupabaseProvider'
import EmailList, { Email } from '@/components/EmailList'
import { supabaseClient } from '@/lib/supabaseClient'

export default function EmailPage() {
  const session = useSupabaseSession()
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmails = async () => {
      if (!session) return
      const userId = session.user.id
      const { data } = await supabaseClient
        .from('emails')
        .select('*')
        .eq('user_id', userId)
        .order('received_at', { ascending: false })
      setEmails((data as any) ?? [])
      setLoading(false)
    }
    fetchEmails()
  }, [session])

  const actionEmails = emails.filter((e) => e.category === 'action')
  const followUpEmails = emails.filter((e) => e.category === 'follow_up')
  const noiseEmails = emails.filter((e) => e.category === 'noise')

  if (!session) {
    return (
      <div className="text-center py-10">
        Please{' '}
        <a className="text-purple underline" href="/auth/sign-in">
          sign in
        </a>
        .
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-purple">Email viewer</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <EmailList emails={actionEmails} title="Action" />
          <EmailList emails={followUpEmails} title="Follow-up" />
          <EmailList emails={noiseEmails} title="Noise" />
        </>
      )}
    </div>
  )
}