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

    // 1. Get the thread_id for this email
    const { data: email, error: emailError } = await supabase
      .from("email_records")
      .select("thread_id")
      .eq("id", emailId)
      .eq("user_id", user.id)
      .single();

    if (emailError || !email?.thread_id) {
      return NextResponse.json({
        messages: [],
        unsupported: true,
      });
    }

    // 2. Fetch all emails in the same thread
    const { data: messages } = await supabase
      .from("email_records")
      .select(
        `
        id,
        From,
        Subject,
        Summary,
        "Action Notes",
        "Date Received",
        "Email Status"
      `
      )
      .eq("user_id", user.id)
      .eq("thread_id", email.thread_id)
      .order("Date Received", { ascending: true });

    return NextResponse.json({
      messages: (messages ?? []).map((m) => ({
        id: m.id,
        from: m.From,
        subject: m.Subject,
        body:
          m["Action Notes"] ||
          m.Summary ||
          "No content captured by Echo.",
        date: m["Date Received"],
        isInbound: true, // Echo view — all are read-only
      })),
    });
  } catch (err) {
    console.error(err);
    return new NextResponse("Server error", { status: 500 });
  }
}
