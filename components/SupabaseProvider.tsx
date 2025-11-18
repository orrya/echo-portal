'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabaseClient } from '@/lib/supabaseClient'

interface SupabaseContextValue {
  session: Session | null
}

const SupabaseContext = createContext<SupabaseContextValue>({ session: null })

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <SupabaseContext.Provider value={{ session }}>{children}</SupabaseContext.Provider>
}

export const useSupabaseSession = () => {
  return useContext(SupabaseContext).session
}