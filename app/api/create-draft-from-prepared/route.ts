// app/api/create-draft-from-prepared/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/getUser";

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { emailId } = await req.json();
    if (!emailId) {
      return new NextResponse("Missing emailId", { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch prepared draft body
    const { data: draft, error: draftError } = await supabase
      .from("prepared_email_drafts")
      .select("body")
      .eq("user_id", user.id)
      .eq("email_record_id", emailId)
      .eq("active", true)
      .single();

    if (draftError || !draft?.body) {
      return new NextResponse("No prepared draft found", { status: 404 });
    }

    // 2. Fetch Outlook reply link from email_records
    const { data: email, error: emailError } = await supabase
      .from("email_records")
      .select('"Reply Link"')
      .eq("id", emailId)
      .eq("user_id", user.id)
      .single();

    if (emailError || !email?.["Reply Link"]) {
      return new NextResponse("Reply link missing", { status: 400 });
    }

    // 3. Send to n8n prepared-draft webhook
    const webhookRes = await fetch(
      "https://orrya.app.n8n.cloud/webhook/echo-prepared-draft",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyDraft: draft.body,
          replyLink: email["Reply Link"],
        }),
      }
    );

    if (!webhookRes.ok) {
  const text = await webhookRes.text();
  console.error("n8n prepared-draft error:", text);
  return new NextResponse("Failed to create Outlook draft", {
    status: 500,
  });
}

/* -----------------------------------------
   4. AUTO-RESOLVE EMAIL (CLOSE LOOP)
------------------------------------------ */
await supabase
  .from("email_records")
  .update({
    "Email Status": "Resolved",
    "Finish Time": new Date().toISOString(),
  })
  .eq("id", emailId)
  .eq("user_id", user.id);

return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("create-draft-from-prepared error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
