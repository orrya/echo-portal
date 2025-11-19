"use client";

import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const handleMicrosoft = () => {
    setLoading(true);

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
      response_type: "code",
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      scope: "openid email offline_access profile User.Read",
      response_mode: "query",
    });

    window.location.href =
      `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-graphite-dark px-4">
      <div className="max-w-md w-full bg-graphite p-8 rounded-2xl shadow-glass text-center">
        <h1 className="text-3xl font-semibold text-purple mb-2">Echo Suite</h1>
        <p className="text-graphite-light mb-8">
          Your automation-first productivity assistant.
        </p>

        <button
          onClick={handleMicrosoft}
          disabled={loading}
          className="w-full bg-purple hover:bg-magenta text-black font-medium py-3 px-4 rounded-lg transition-all"
        >
          {loading ? "Redirecting…" : "Continue with Microsoft"}
        </button>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-graphite-light" />
        </div>

        <p className="text-sm text-graphite-light">
          ⚠ Echo Suite works only with <br />
          <span className="text-purple font-medium">
            Microsoft 365 work or school accounts
          </span>.
        </p>
      </div>
    </div>
  );
}
