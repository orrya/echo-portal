"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignInPage() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm`,
  },
});

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-semibold text-white">Welcome to Echo</h1>
        <p className="text-slate-400">
          Sign in to your second mind.
        </p>

        {sent ? (
          <p className="text-emerald-400">
            Check your email for a secure sign-in link.
          </p>
        ) : (
          <>
            <input
              type="email"
              placeholder="you@work.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white"
            />

            <button
              onClick={handleSignIn}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4 text-lg font-semibold text-white shadow-xl hover:opacity-90 transition"
            >
              Continue
            </button>
          </>
        )}

        {error && <p className="text-red-400">{error}</p>}
      </div>
    </div>
  );
}
