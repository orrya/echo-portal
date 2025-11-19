"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function OAuthLanding() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const finish = async () => {
      const uid = params.get("user");

      if (!uid) {
        console.error("Missing user param");
        router.push("/auth/sign-in");
        return;
      }

      // 🔥 Create a Supabase session for the user (magic link session)
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: uid + "@pseudo-login.echo",
        options: { emailRedirectTo: "/" },
      });

      if (error) {
        console.error(error);
        router.push("/auth/sign-in");
        return;
      }

      // Then push to dashboard
      router.push("/");
    };

    finish();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-graphite-dark">
      <p className="text-graphite-light">Finishing sign-in…</p>
    </div>
  );
}
