'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'

export default function SettingsForm() {
  const [tone, setTone] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoReply, setAutoReply] = useState(false)

  useEffect(() => {
    // load existing settings from the profile table when the component mounts
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()
      if (!user) return
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('tone, auto_reply_rules')
        .eq('id', user.id)
        .single()
      if (!error && data) {
        setTone(data.tone ?? '')
        setAutoReply(data.auto_reply_rules?.enabled ?? false)
      }
    }
    fetchProfile()
  }, [])

  const saveSettings = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { error } = await supabaseClient
      .from('profiles')
      .upsert({
        id: user.id,
        tone,
        auto_reply_rules: { enabled: autoReply },
      })
    setLoading(false)
    if (!error) {
      alert('Settings saved')
    }
  }

  const connectMicrosoft = async () => {
    await supabaseClient.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email offline_access',
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="tone" className="block text-sm font-medium text-purple">
          Preferred tone
        </label>
        <textarea
          id="tone"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="mt-1 w-full bg-graphite-light border border-graphite-dark rounded-md p-2 text-white text-sm"
          rows={3}
          placeholder="e.g., Friendly, professional, concise..."
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="auto-reply"
          type="checkbox"
          checked={autoReply}
          onChange={(e) => setAutoReply(e.target.checked)}
          className="h-4 w-4 text-purple"
        />
        <label htmlFor="auto-reply" className="text-sm text-purple">
          Enable auto-replies
        </label>
      </div>
      <div className="flex gap-3">
        <button
          onClick={saveSettings}
          disabled={loading}
          className="bg-purple hover:bg-magenta text-black py-2 px-4 rounded-md text-sm transition-colors"
        >
          {loading ? 'Saving...' : 'Save settings'}
        </button>
        <button
          onClick={connectMicrosoft}
          className="bg-graphite-light hover:bg-purple text-white py-2 px-4 rounded-md text-sm transition-colors"
        >
          Connect Microsoft
        </button>
      </div>
    </div>
  )
}