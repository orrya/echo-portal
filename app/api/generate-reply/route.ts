// app/api/generate-reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromSession } from "@/lib/getUserFromSession";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { emailId } = await req.json();
    if (!emailId) return new NextResponse("Missing emailId", { status: 400 });

    // Service role so we can read all columns
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the row
    const { data: row, error } = await supabase
      .from("email_records")
      .select('id, "Reply Link", Subject, user_id')
      .eq("id", emailId)
      .eq("user_id", user.id)
      .single();

    if (error || !row) {
      return new NextResponse("Email not found", { status: 404 });
    }

    const replyUrl = row["Reply Link"];
    if (!replyUrl) {
      return new NextResponse("No Reply Link found", { status: 400 });
    }

    // Call the n8n webhook exactly as stored in DB
    const webhookRes = await fetch(replyUrl, { method: "GET" });

    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      console.error("n8n error:", text);
      return new NextResponse("Failed to call reply generator", { status: 502 });
    }

    // The webhook returns an array with message body etc.
    const raw = await webhookRes.json();
    const first = Array.isArray(raw) ? raw[0] : raw;

    return NextResponse.json({
      subject: first.subject ?? row.Subject ?? "Echo Reply",
      bodyPreview: first.bodyPreview ?? null,
      htmlBody: first.body?.content ?? null,
      webLink: first.webLink ?? null, // Outlook drafts link
    });
  } catch (err) {
    console.error("generate-reply error:", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
