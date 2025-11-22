// app/api/ms-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getValidMsAccessToken } from "@/lib/msTokens";

/**
 * Simple internal API for N8N:
 * GET /api/ms-token?user_id=<uuid>
 * Header: x-internal-key: <INTERNAL_N8N_API_KEY>
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  const internalKey = req.headers.get("x-internal-key");

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  if (!process.env.INTERNAL_N8N_API_KEY) {
    console.error("INTERNAL_N8N_API_KEY not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (internalKey !== process.env.INTERNAL_N8N_API_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const accessToken = await getValidMsAccessToken(userId);
    return NextResponse.json({ access_token: accessToken });
  } catch (err: any) {
    console.error("ms-token error:", err);
    return NextResponse.json(
      { error: "Unable to get token", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
