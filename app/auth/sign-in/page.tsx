// app/auth/sign-in/page.tsx
"use client";

import { supabaseClient } from "@/lib/supabaseClient";

export default function SignInPage() {
  const handleSignIn = async () => {
    await supabaseClient.auth.signInWithOAuth({
      provider: "azure",
      options: {
        // You already requested these scopes in Azure config
        scopes: "openid email offline_access profile User.Read",
        // Where Supabase should send the browser after it has handled OAuth
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/90 text-center">
          ECHO · SIGN IN
        </p>

        <h1 className="text-center text-2xl font-semibold text-white">
          Sign in with Microsoft 365
        </h1>

        <p className="text-center text-sm text-slate-300/90">
          Echo connects to your Microsoft 365 inbox to classify email, write
          summaries, and prepare replies.
        </p>

        <div className="flex justify-center pt-2">
          <button
            onClick={handleSignIn}
            className="
              inline-flex items-center justify-center
              rounded-full px-6 py-2.5 text-sm font-medium
              bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500
              text-white shadow-[0_0_24px_rgba(129,140,248,0.55)]
              hover:shadow-[0_0_36px_rgba(129,140,248,0.85)]
              transition-all
            "
          >
            Continue with Microsoft
          </button>
        </div>
      </div>
    </div>
  );
}
