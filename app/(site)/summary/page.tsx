'use client'

import { useEffect, useState } from 'react'
import { useSupabaseSession } from '@/components/SupabaseProvider'
import SummaryCard, { Summary } from '@/components/SummaryCard'
import { supabaseClient } from '@/lib/supabaseClient'

export default function SummaryPage() {
  const session = useSupabaseSession()
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummaries = async () => {
      if (!session) return
      const { data } = await supabaseClient
        .from('summaries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('summary_date', { ascending: false })
        .order('time_of_day', { ascending: true })
      setSummaries((data as any) ?? [])
      setLoading(false)
    }
    fetchSummaries()
  }, [session])

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
    <div>
      <h1 className="text-2xl font-semibold text-purple mb-4">Daily summary archive</h1>
      {loading ? <p>Loading...</p> : <SummaryCard summaries={summaries} />}
    </div>
  )
}