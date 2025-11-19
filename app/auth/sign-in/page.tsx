"use client";

import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const handleMicrosoft = () => {
    setLoading(true);

    const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!clientId) {
      console.error("❌ Missing NEXT_PUBLIC_AZURE_CLIENT_ID");
      alert("Microsoft login is not configured.");
      return;
    }

    if (!siteUrl) {
      console.error("❌ Missing NEXT_PUBLIC_SITE_URL");
      alert("Site URL is not configured.");
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: `${siteUrl}/auth/callback`,
      scope: "openid email offline_access profile User.Read",
      response_mode: "query",
    });

    window.location.href =
      `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
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
