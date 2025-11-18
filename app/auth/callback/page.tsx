'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    if (code) {
      supabaseClient.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          router.replace(next)
        } else {
          router.replace('/auth/sign-in')
        }
      })
    }
  }, [searchParams, router])

  return <p className="p-4">Signing in...</p>
}