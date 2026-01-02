"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SettingsForm() {
  const supabase = createClientComponentClient();

  const [tone, setTone] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoReply, setAutoReply] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://echo.orrya.co.uk";

  useEffect(() => {
    let alive = true;

    const fetchProfile = async () => {
      setStatus(null);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (!alive) return;

      if (userErr) {
        console.error("getUser error:", userErr);
        return;
      }

      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("tone, auto_reply_rules")
        .eq("id", user.id)
        .single();

      if (!alive) return;

      if (error) {
        console.error("fetch profiles error:", error);
        return;
      }

      if (data) {
        setTone(data.tone ?? "");
        setAutoReply(Boolean(data.auto_reply_rules?.enabled));
      }
    };

    fetchProfile();

    return () => {
      alive = false;
    };
  }, [supabase]);

  const saveSettings = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) {
        setStatus("Not signed in.");
        return;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        tone,
        auto_reply_rules: { enabled: autoReply },
      });

      if (error) throw error;

      setStatus("Saved.");
    } catch (err: any) {
      console.error("saveSettings error:", err);
      setStatus(err?.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  // Manual Microsoft OAuth redirect (keep if you still use it)
  const connectMicrosoft = () => {
    window.location.href = `${SITE_URL}/auth/redirect`;
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

      {/* Auto Replies */}
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

      {/* Buttons */}
      <div className="flex flex-row items-center justify-end gap-4 pt-4">
        {status && (
          <span className="mr-auto text-xs text-slate-300/80">{status}</span>
        )}

        {/* Save */}
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
            disabled:opacity-60 disabled:cursor-not-allowed
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
