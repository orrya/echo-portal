import { NextRequest, NextResponse } from "next/server";

// IMPORTANT: force node runtime so crypto works
export const runtime = "nodejs";

import crypto from "crypto";
import { cookies } from "next/headers";

let createRouteHandlerClient: any = null;

// Safe dynamic import — avoids top-level crash
try {
  createRouteHandlerClient =
    require("@supabase/auth-helpers-nextjs").createRouteHandlerClient;
} catch (err) {
  console.error("FATAL IMPORT ERROR: createRouteHandlerClient failed", err);
}

const RENEWAL_LEAD_MINUTES = 60;

// --------------------------------------------
// Safe cookie reader (no top-level execution)
// --------------------------------------------
function getUserIdFromCookie() {
  try {
    const store = cookies();
    const c = store.get("echo-auth");
    if (!c?.value) return null;

    let parsed = JSON.parse(c.value);
    if (typeof parsed === "string") parsed = JSON.parse(parsed);

    return parsed?.user_id ?? null;
  } catch (err) {
    console.error("COOKIE PARSE ERROR:", err);
    return null;
  }
}

// --------------------------------------------
// POST — Create subscription
// --------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // Validate dynamic import
    if (!createRouteHandlerClient) {
      console.error("createRouteHandlerClient is null");
      return NextResponse.json(
        { error: "Server import failure" },
        { status: 500 }
      );
    }

    const userId = getUserIdFromCookie();
    if (!userId) {
      console.error("NO USER ID FROM COOKIE");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    const body = await req.json().catch(() => ({}));

    const resource =
      body.resource ??
      "me/mailFolders('Inbox')/messages?$filter=isDraft eq false";

    const notificationSecret = crypto.randomBytes(24).toString("hex");

    const n8nUrl = process.env.N8N_BASE_URL;
    const webhookPath =
      process.env.N8N_MS_CREATE_SUBSCRIPTION_PATH ??
      "/webhook/ms-create-subscription";
    const secret = process.env.N8N_SHARED_SECRET;

    if (!n8nUrl) {
      console.error("N8N_BASE_URL missing");
      return NextResponse.json(
        { error: "N8N_BASE_URL missing" },
        { status: 500 }
      );
    }

    // Call n8n
    const res = await fetch(`${n8nUrl.replace(/\/$/, "")}${webhookPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-n8n-secret": secret } : {}),
      },
      body: JSON.stringify({ userId, resource, notificationSecret }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("N8N ERROR:", txt);
      return NextResponse.json(
        { error: "n8n failed", details: txt },
        { status: 500 }
      );
    }

    const subscription = await res.json();

    const { id, expirationDateTime, clientState } = subscription;

    if (!id || !expirationDateTime || !clientState) {
      console.error("BAD SUBSCRIPTION PAYLOAD", subscription);
      return NextResponse.json(
        { error: "Invalid subscription", subscription },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("ms_subscriptions")
      .upsert(
        {
          user_id: userId,
          subscription_id: id,
          resource,
          client_state: clientState,
          notification_secret: notificationSecret,
          expires_at: expirationDateTime,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "subscription_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("SUPABASE UPSERT ERROR:", error);
      return NextResponse.json(
        { error: "Failed to upsert", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription: data });
  } catch (err: any) {
    console.error("POST FATAL ERROR:", err);
    return NextResponse.json(
      { error: "Fatal server error", details: err?.message },
      { status: 500 }
    );
  }
}
