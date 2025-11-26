// app/api/ms-subscription/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const RENEWAL_LEAD_MINUTES = 60;

// -------------------------------------------------------
// AUTH HELPER — fully safe cookie decoding
// -------------------------------------------------------
function getUserIdFromCookie() {
  const store = cookies();
  const raw = store.get("echo-auth");

  if (!raw?.value) return null;

  let value = raw.value;

  // Step 1 — decode URI-encoded cookies
  try {
    value = decodeURIComponent(value);
  } catch {
    // ignore — means cookie was not encoded
  }

  let parsed: any = null;

  // Step 2 — parse JSON
  try {
    parsed = JSON.parse(value);

    // Step 3 — handle double-encoded JSON (string containing JSON)
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
  } catch (err) {
    console.error("❌ echo-auth cookie parse error:", err, "raw:", raw.value);
    return null;
  }

  return parsed?.user_id ?? null;
}

// -------------------------------------------------------
// POST → Create Subscription
// -------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // Load authenticated user
    const userId = getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json().catch(() => ({}));

    const resource =
      body.resource ??
      "me/mailFolders('Inbox')/messages?$filter=isDraft eq false";

    const notificationSecret = crypto.randomBytes(24).toString('hex');

    const n8nUrl = process.env.N8N_BASE_URL;
    const n8nWebhookPath =
      process.env.N8N_MS_CREATE_SUBSCRIPTION_PATH ??
      '/webhook/ms-create-subscription';
    const n8nAuthSecret = process.env.N8N_SHARED_SECRET;

    if (!n8nUrl) {
      return NextResponse.json(
        { error: 'N8N_BASE_URL not configured' },
        { status: 500 }
      );
    }

    // Call n8n webhook
    const res = await fetch(
      `${n8nUrl.replace(/\/$/, '')}${n8nWebhookPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(n8nAuthSecret ? { 'x-n8n-secret': n8nAuthSecret } : {}),
        },
        body: JSON.stringify({
          userId,
          resource,
          notificationSecret,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: 'Failed to create subscription in n8n', details: text },
        { status: 500 }
      );
    }

    const subscription = await res.json();

    const {
      id: subscriptionId,
      resource: subResource,
      clientState,
      expirationDateTime,
    } = subscription;

    if (!subscriptionId || !expirationDateTime || !clientState) {
      return NextResponse.json(
        { error: 'Invalid subscription payload from n8n', subscription },
        { status: 500 }
      );
    }

    // Save subscription
    const { data, error } = await supabase
      .from('ms_subscriptions')
      .upsert(
        {
          user_id: userId,
          subscription_id: subscriptionId,
          resource: subResource ?? resource,
          client_state: clientState,
          notification_secret: notificationSecret,
          expires_at: expirationDateTime,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'subscription_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save subscription', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription: data });

  } catch (err: any) {
    console.error('POST /api/ms-subscription error:', err);
    return NextResponse.json(
      { error: 'Internal error', details: err?.message },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------
// GET → Renewal (n8n only)
// -------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get('mode');
    if (mode !== 'due') {
      return NextResponse.json(
        { error: 'Invalid mode', details: 'Only mode=due is supported' },
        { status: 400 }
      );
    }

    const auth = req.headers.get('x-n8n-secret');
    if (!auth || auth !== process.env.N8N_SHARED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    const now = new Date();
    const cutoff = new Date(
      now.getTime() + RENEWAL_LEAD_MINUTES * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from('ms_subscriptions')
      .select('*')
      .lte('expires_at', cutoff);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch due subscriptions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscriptions: data ?? [] });

  } catch (err: any) {
    console.error('GET /api/ms-subscription error:', err);
    return NextResponse.json(
      { error: 'Internal error', details: err?.message },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------
// PUT → Update expiration (n8n only)
// -------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const auth = req.headers.get('x-n8n-secret');
    if (!auth || auth !== process.env.N8N_SHARED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, expiresAt } = body;

    if (!subscriptionId || !expiresAt) {
      return NextResponse.json(
        { error: 'subscriptionId and expiresAt are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('ms_subscriptions')
      .update({
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscriptionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update subscription', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription: data });

  } catch (err: any) {
    console.error('PUT /api/ms-subscription error:', err);
    return NextResponse.json(
      { error: 'Internal error', details: err?.message },
      { status: 500 }
    );
  }
}
