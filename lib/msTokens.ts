// lib/msTokens.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenantId = process.env.AZURE_TENANT_ID || "common";
const clientId = process.env.AZURE_CLIENT_ID!;
const clientSecret = process.env.AZURE_CLIENT_SECRET!;

// Admin client (server-side only!)
const admin = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false },
});

type UserConnRow = {
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
};

const SAFETY_SECONDS = 60; // refresh 1 minute before expiry

export async function getValidMsAccessToken(userId: string): Promise<string> {
  const { data, error } = await admin
    .from("user_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "microsoft")
    .maybeSingle<UserConnRow>();

  if (error || !data) {
    throw new Error("No Microsoft connection found for user");
  }

  const now = Date.now();
  const expiresAt = new Date(data.expires_at).getTime();

  // Still valid?
  if (expiresAt - SAFETY_SECONDS * 1000 > now) {
    return data.access_token;
  }

  // Need to refresh
  if (!data.refresh_token) {
    throw new Error("No refresh_token stored for user");
  }

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: data.refresh_token,
      }),
    }
  );

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("Azure refresh_token error:", tokenData);
    throw new Error("Failed to refresh Microsoft token");
  }

  const newAccess = tokenData.access_token as string;
  const newRefresh = (tokenData.refresh_token || data.refresh_token) as string;
  const newExpiresIn = (tokenData.expires_in ?? 3600) as number;

  const newExpiresAt = new Date(now + newExpiresIn * 1000).toISOString();

  await admin
    .from("user_connections")
    .update({
      access_token: newAccess,
      refresh_token: newRefresh,
      expires_at: newExpiresAt,
    })
    .eq("user_id", userId)
    .eq("provider", "microsoft");

  return newAccess;
}
