import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"; 
import { createClient } from "@supabase/supabase-js"; 
// crypto is no longer needed since we aren't generating a client-side verifier
// import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    // Get the cookie store needed for Auth Helpers
    const cookieStore = cookies(); 

    if (!code) {
      console.error("❌ Missing code in callback URL:", req.url);
      return new Response("Missing authorization code", { status: 400 });
    }

    // --- ENV VARS ---
    const clientId =
      process.env.AZURE_CLIENT_ID || process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;

    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID || "common";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
    const redirectUri =
      process.env.AZURE_REDIRECT_URI ?? `${siteUrl}/auth/callback`;

    // --- 1) Exchange Microsoft auth code ---
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri
        })
      }
    );

    const tokenJson = await tokenRes.json();
    
    if (!tokenRes.ok) {
      console.error("❌ Token exchange failed:", tokenJson);
      return new Response("Token exchange failed", { status: 400 });
    }

    const accessToken = tokenJson.access_token as string;
    const refreshToken = tokenJson.refresh_token as string | undefined;
    const expiresIn = tokenJson.expires_in ?? 3600;

    // --- 2) Microsoft Profile ---
    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();

    const email =
      profile.mail ?? profile.userPrincipalName ?? undefined;

    if (!email) {
      console.error("❌ Microsoft profile missing email:", profile);
      return new Response("Microsoft profile error", { status: 400 });
    }

    // --- 3) Supabase Service Role Client ---
    // Renamed for clarity, using the service key
    const supabaseServiceRole = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // --- 4) Check/Create Auth User ---
    let authUserId: string;
    
    // Use the Service Role client to list users
    const { data: userList, error: listErr } =
      await supabaseServiceRole.auth.admin.listUsers();

    if (listErr) {
      console.error("❌ List users error:", listErr);
      return new Response("Auth lookup failed", { status: 400 });
    }

    const match = userList.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (match) {
      console.log("✔ Found existing user:", match.id);
      authUserId = match.id;
    } else {
      console.log("➡️ Creating new Supabase Auth user");
      // Use the Service Role client to create a user
      const created = await supabaseServiceRole.auth.admin.createUser({
        email,
        email_confirm: true
      });

      if (created.error || !created.data?.user) {
        console.error("❌ Failed to create auth user:", created.error);
        return new Response("Failed to create auth user", { status: 500 });
      }

      authUserId = created.data.user.id;
    }

    // --- 5) Upsert profile & connection (Crucial for linking data to authUserId) ---
    // Note: This correctly uses the Service Role client to write to your tables.
    await supabaseServiceRole.from("profiles").upsert(
      {
        id: authUserId,
        display_name: profile.displayName ?? null,
        notion_db_row_id: null,
        n8n_user_id: null
      },
      { onConflict: "id" }
    );

    await supabaseServiceRole.from("user_connections").upsert(
      {
        user_id: authUserId,
        provider: "microsoft",
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
      },
      { onConflict: "user_id,provider" }
    );

    // --- 6) GENERATE AUTH CODE FOR SIGN-IN ---

    // We use an 'as any' cast here to suppress the TypeScript error you encountered
    // on environments with mismatched or older Supabase typings.
    const { data: pkceData, error: pkceErr } =
        await (supabaseServiceRole.auth.admin as any).generateAuthCode(authUserId);
        
    if (pkceErr || !pkceData?.code) {
      console.error("❌ Auth code generation failed:", pkceErr);
      return new Response("Auth code generation failed", { status: 500 });
    }
    
    console.log("✔ Auth Code generated successfully.");
    const pkceCode = pkceData.code;


    // --- 7) EXCHANGE CODE FOR SESSION (using Auth Helpers) ---
    
    // Create the Auth Helpers client which manages cookie setting
    const supabaseRouteClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // This CRITICAL step exchanges the Admin-generated code for a full user session,
    // automatically setting the correct standard Supabase cookies (sb-...)
    const { error: signInErr } = await supabaseRouteClient.auth.exchangeCodeForSession(pkceCode);

    if (signInErr) {
        console.error("❌ exchangeCodeForSession failed:", signInErr);
        // Redirect back to sign-in on error
        return NextResponse.redirect(`${siteUrl}/auth/sign-in?error=auth_failed`);
    }

    console.log("✔ Supabase session established via code exchange.");

    // --- 8) REDIRECT TO DASHBOARD ---
    
    // The correct session cookies are now set in the response headers.
    return NextResponse.redirect(`${siteUrl}/dashboard`);

  } catch (err) {
    console.error("❌ Unhandled callback error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}