"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Get the session after Microsoft redirects back
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        console.error("No session found");
        router.push("/auth/sign-in");
        return;
      }

      // Extract MS Graph tokens
      const access_token =
        session.provider_token || session.access_token;
      const refresh_token =
        session.provider_refresh_token || session.refresh_token;

      const expires_at = session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : null;

      // Store in Supabase table
      const { error } = await supabaseClient
        .from("user_connections")
        .upsert({
          user_id: session.user.id,
          provider: "microsoft",
          access_token,
          refresh_token,
          expires_at,
        });

      if (error) {
        console.error("DB error:", error);
      }

      // Redirect into app
      router.push("/");
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-graphite-dark">
      <p className="text-graphite-light">Finishing sign-in…</p>
    </div>
  );
}
