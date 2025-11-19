'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
    }
  }

  const handleMicrosoft = async () => {
    await supabaseClient.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email offline_access',
        // FINAL FIX → DIRECT HARD-CODED REDIRECT URL
        redirectTo: 'https://echo-portal.vercel.app/auth/callback',
      },
    })
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      alert('Check your email for a confirmation link.')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-graphite-dark p-6 rounded-lg shadow-glass">
      <h1 className="text-2xl font-semibold text-purple mb-4">
        Sign in to Echo Suite
      </h1>

      <button
        onClick={handleMicrosoft}
        className="w-full bg-purple hover:bg-magenta text-black py-2 px-4 rounded-md mb-4"
      >
        Continue with Microsoft
      </button>

      <div className="flex items-center my-4">
        <div className="flex-grow border-t border-graphite-light"></div>
        <span className="mx-2 text-graphite-light text-xs">or</span>
        <div className="flex-grow border-t border-graphite-light"></div>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-purple">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full bg-graphite-light border border-graphite-dark rounded-md p-2 text-white text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-purple">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full bg-graphite-light border border-graphite-dark rounded-md p-2 text-white text-sm"
            required
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple hover:bg-magenta text-black py-2 px-4 rounded-md"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSignUp}
            className="flex-1 bg-graphite-light hover:bg-purple text-white py-2 px-4 rounded-md"
          >
            {loading ? '...' : 'Sign up'}
          </button>
        </div>
      </form>
    </div>
  )
}
