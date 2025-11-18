import { NextResponse } from 'next/server'

// API route that proxies requests to user‑specific n8n webhooks.  The
// route name (`action`) determines which automation to trigger.
export async function POST(
  request: Request,
  { params }: { params: { action: string } }
) {
  const { action } = params
  const body = await request.json()
  const { emailId, webhookId } = body
  const baseUrl = process.env.NEXT_PUBLIC_N8N_BASE_URL

  // Validate input
  if (!emailId || !webhookId) {
    return NextResponse.json(
      { error: 'Missing emailId or webhookId' },
      { status: 400 }
    )
  }

  // Determine the subpath for the action
  let subPath = ''
  switch (action) {
    case 'generate-draft':
      subPath = 'generate-draft'
      break
    case 'mark-resolved':
      subPath = 'mark-resolved'
      break
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  try {
    const url = `${baseUrl}/webhook/${webhookId}/${subPath}`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId }),
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to trigger automation' },
      { status: 500 }
    )
  }
}