// app/api/ms-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
// Supabase server client
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const RENEWAL_LEAD_MINUTES = 60; // renew if expiring within the next hour

// -------------------------------------------------------
// POST → Create subscription
// -------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const resource =
      body.resource ?? "me/mailFolders('Inbox')/messages?$filter=isDraft eq false";

    const notificationSecret = crypto.randomBytes(24).toString('hex');

    const n8nUrl = process.env.N8N_BASE_URL;
    const n8nWebhookPath =
      process.env.N8N_MS_CREATE_SUBSCRIPTION_PATH ?? '/webhook/ms-create-subscription';
    const n8nAuthSecret = process.env.N8N_SHARED_SECRET;

    if (!n8nUrl) {
      return NextResponse.json(
        { error: 'N8N_BASE_URL not configured' },
        { status: 500 },
      );
    }

    const res = await fetch(
      `${n8nUrl.replace(/\/$/, '')}${n8nWebhookPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(n8nAuthSecret ? { 'x-n8n-secret': n8nAuthSecret } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          resource,
          notificationSecret,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: 'Failed to create subscription in n8n', details: text },
        { status: 500 },
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
        { status: 500 },
      );
    }

    const { data, error } = await supabase
      .from('ms_subscriptions')
      .upsert(
        {
          user_id: user.id,
          subscription_id: subscriptionId,
          resource: subResource ?? resource,
          client_state: clientState,
          notification_secret: notificationSecret,
          expires_at: expirationDateTime,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'subscription_id' },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save subscription', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ subscription: data });
  } catch (err: any) {
    console.error('POST /api/ms-subscription error', err);
    return NextResponse.json(
      { error: 'Internal error', details: err?.message },
      { status: 500 },
    );
  }
}

// -------------------------------------------------------
// GET → For renewal workflow: /api/ms-subscription?mode=due
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

    // Check n8n shared secret
    const auth = req.headers.get('x-n8n-secret');
    if (!auth || auth !== process.env.N8N_SHARED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    const now = new Date();
    const cutoff = new Date(
      now.getTime() + RENEWAL_LEAD_MINUTES * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from('ms_subscriptions')
      .select('*')
      .lte('expires_at', cutoff);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch due subscriptions', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ subscriptions: data ?? [] });
  } catch (err: any) {
    console.error('GET /api/ms-subscription error', err);
    return NextResponse.json(
      { error: 'Internal error', details: err?.message },
      { status: 500 },
    );
  }
}

// -------------------------------------------------------
// PUT → Update subscription after renewal
// Body: { subscriptionId, expiresAt }
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
        { status: 400 },
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
        { status: 500 },
      );
    }

    return NextResponse.json({ subscription: data });
  } catch (err: any) {
    console.error('PUT /api/ms-subscription error', err);
    return NextResponse.json(
      { error: 'Internal error', details: err?.message },
      { status: 500 },
    );
  }
}
