"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function SettingsForm() {
  const [tone, setTone] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoReply, setAutoReply] = useState(false);

  /** Load settings */
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) return;

      const { data } = await supabaseClient
        .from("profiles")
        .select("tone, auto_reply_rules")
        .eq("id", user.id)
        .single();

      if (data) {
        setTone(data.tone ?? "");
        setAutoReply(data.auto_reply_rules?.enabled ?? false);
      }
    };

    fetchProfile();
  }, []);

  /** Save settings */
  const saveSettings = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    await supabaseClient.from("profiles").upsert({
      id: user.id,
      tone,
      auto_reply_rules: { enabled: autoReply },
    });

    setLoading(false);
  };

  /** Microsoft OAuth */
  const connectMicrosoft = () => {
    window.location.href = "/auth/redirect";
  };

  return (
    <div className="space-y-10">
      {/* Preferred Tone */}
      <div className="space-y-3">
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
            bg-white/[0.06]
            border border-white/15
            text-slate-200 placeholder-slate-400
            shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]
            backdrop-blur-xl
            resize-none
            focus:outline-none
            focus:ring-2 focus:ring-fuchsia-400/40
          "
        />
      </div>

      {/* Auto-replies Group */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-200 tracking-wide">
          Auto-replies
        </p>

        <div
          className="
            flex items-center justify-between
            px-4 py-3 rounded-xl
            bg-white/[0.05] border border-white/10
            backdrop-blur-xl
          "
        >
          <label htmlFor="auto-reply" className="text-sm text-slate-200">
            Enable auto-replies
          </label>

          <input
            id="auto-reply"
            type="checkbox"
            checked={autoReply}
            onChange={(e) => setAutoReply(e.target.checked)}
            className="
              h-4 w-4 rounded border-white/30
              bg-black/30
              text-fuchsia-400
              focus:ring-fuchsia-400/40 focus:ring-offset-0
            "
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-row justify-end gap-4 pt-4">
        {/* Save button */}
        <button
          onClick={saveSettings}
          disabled={loading}
          className="
            inline-flex items-center justify-center
            rounded-full px-7 py-2.5
            text-sm font-medium text-white
            bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500
            shadow-[0_0_24px_rgba(129,140,248,0.55)]
            hover:shadow-[0_0_36px_rgba(129,140,248,0.85)]
            transition-all
          "
        >
          {loading ? "Saving…" : "Save settings"}
        </button>

        {/* Connect Microsoft */}
        <button
          onClick={connectMicrosoft}
          className="
            inline-flex items-center justify-center
            rounded-full px-7 py-2.5
            text-sm font-medium text-slate-200
            border border-white/15 bg-white/5
            backdrop-blur-xl
            hover:border-fuchsia-400/40 hover:bg-white/10
            transition-all
          "
        >
          Connect Microsoft
        </button>
      </div>
    </div>
  );
}
