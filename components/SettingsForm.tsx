"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function SettingsForm() {
  const [tone, setTone] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoReply, setAutoReply] = useState(false);

  // Load saved settings
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { data, error } = await supabaseClient
        .from("profiles")
        .select("tone, auto_reply_rules")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setTone(data.tone ?? "");
        setAutoReply(data.auto_reply_rules?.enabled ?? false);
      }
    };

    fetchProfile();
  }, []);

  // Save settings
  const saveSettings = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabaseClient.from("profiles").upsert({
      id: user.id,
      tone,
      auto_reply_rules: { enabled: autoReply },
    });

    setLoading(false);
    if (!error) alert("Settings saved");
  };

  // Microsoft OAuth
  const connectMicrosoft = async () => {
    await supabaseClient.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email offline_access",
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
  };

  return (
    <div className="space-y-8">

      {/* Preferred tone */}
      <div className="space-y-2">
        <label
          htmlFor="tone"
          className="text-sm font-medium text-slate-200 tracking-wide"
        >
          Preferred tone
        </label>

        <textarea
          id="tone"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          rows={4}
          placeholder="e.g., Friendly, professional, concise..."
          className="
            w-full rounded-xl p-4
            glass-panel
            text-slate-200 placeholder-slate-400
            resize-none
            focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40
          "
        />
      </div>

      {/* Auto reply toggle */}
      <div className="flex items-center gap-3">
        <input
          id="auto-reply"
          type="checkbox"
          checked={autoReply}
          onChange={(e) => setAutoReply(e.target.checked)}
          className="
            h-4 w-4 rounded border-white/20 bg-black/20
            text-fuchsia-400 focus:ring-fuchsia-300/40
          "
        />
        <label htmlFor="auto-reply" className="text-sm text-slate-200">
          Enable auto-replies
        </label>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-4 pt-2">

        {/* Primary button */}
        <button
          onClick={saveSettings}
          disabled={loading}
          className="
            inline-flex items-center justify-center
            rounded-full px-6 py-2.5 text-sm font-medium
            bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500
            text-white shadow-[0_0_24px_rgba(129,140,248,0.55)]
            hover:shadow-[0_0_36px_rgba(129,140,248,0.85)]
            transition-all
          "
        >
          {loading ? "Saving…" : "Save settings"}
        </button>

        {/* Secondary button */}
        <button
          onClick={connectMicrosoft}
          className="
            inline-flex items-center justify-center
            rounded-full px-6 py-2.5 text-sm font-medium
            border border-white/15 bg-white/5 backdrop-blur-lg
            text-slate-200 
            hover:border-fuchsia-400/50 hover:bg-white/10
            transition-all
          "
        >
          Connect Microsoft
        </button>
      </div>
    </div>
  );
}
