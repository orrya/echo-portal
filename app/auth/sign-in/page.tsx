'use client'

import { supabaseClient } from '@/lib/supabaseClient'
import { useState } from 'react'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMicrosoft = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'openid email offline_access',
        // No redirectTo → Supabase routes to your custom callback
      },
    })

    if (error) {
      setError("Sign-in failed. Please try again.")
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-graphite-dark px-4">
      <div className="max-w-md w-full bg-graphite p-8 rounded-2xl shadow-glass text-center">
        
        {/* Brand */}
        <h1 className="text-3xl font-semibold text-purple mb-2">
          Echo Suite
        </h1>
        <p className="text-graphite-light mb-8">
          Your automation-first productivity assistant.
        </p>

        {/* Microsoft button */}
        <button
          onClick={handleMicrosoft}
          disabled={loading}
          className="w-full bg-purple hover:bg-magenta text-black font-medium py-3 px-4 rounded-lg transition-all"
        >
          {loading ? 'Redirecting…' : 'Continue with Microsoft'}
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-graphite-light"></div>
        </div>

        {/* Notice */}
        <p className="text-sm text-graphite-light">
          ⚠ Echo Suite works only with <br />
          <span className="text-purple font-medium">Microsoft 365 work or school accounts</span>.
        </p>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    </div>
  )
}
