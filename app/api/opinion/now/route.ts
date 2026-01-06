import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id" },
        { status: 400 }
      );
    }

    /* -------------------------------------------------
       1. LOAD CURRENT STATE (CHEAP QUERIES)
    ------------------------------------------------- */

    // Unresolved action emails
    const { data: actionEmails } = await supabase
      .from("email_records")
      .select("id, Subject, Summary, urgency, importance, Date Received")
      .eq("user_id", user_id)
      .ilike("Category", "%action%")
      .or(`"Email Status".is.null,"Email Status".neq.Resolved`)
      .order("Date Received", { ascending: false })
      .limit(10);

    // Today’s calendar load (if you have calendar_events)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: todaysMeetings } = await supabase
      .from("calendar_events")
      .select("subject, start_time, end_time")
      .eq("user_id", user_id)
      .gte("start_time", startOfDay.toISOString())
      .lte("start_time", endOfDay.toISOString());

    /* -------------------------------------------------
       2. PREPARE CONTEXT FOR ECHO
    ------------------------------------------------- */

    const emailContext = (actionEmails ?? []).map((e: any) => ({
  subject: e.Subject ?? "",
  summary: e["Summary"] ?? null,
  urgency: e.urgency ?? null,
  importance: e.importance ?? null,
}));

    const meetingCount = todaysMeetings?.length ?? 0;

    /* -------------------------------------------------
       3. ASK FOR AN OPINION (ONE CALL)
    ------------------------------------------------- */

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are Echo — a cognitive twin whose job is to reduce the user's decision load.

You must form ONE clear opinion about what the user should focus on next.

Rules:
- Be decisive, not exhaustive.
- If the day is heavy, narrow the scope.
- Explicitly state what should be ignored.
- Do not give productivity advice — give judgement.
- If confidence is low, say so.

Return JSON only.
          `.trim(),
        },
        {
          role: "user",
          content: `
Today’s context:

Unresolved action emails:
${JSON.stringify(emailContext, null, 2)}

Meetings today: ${meetingCount}

Return JSON in this exact shape:
{
  "primary_focus": string,
  "reason": string,
  "explicit_do_not": string[],
  "suggested_window": string | null,
  "confidence": number
}
          `.trim(),
        },
      ],
      response_format: { type: "json_object" },
    });

    const opinion = JSON.parse(
      completion.choices[0].message.content || "{}"
    );

    return NextResponse.json(opinion);
  } catch (err) {
    console.error("opinion/now error:", err);
    return NextResponse.json(
      { error: "Failed to form opinion" },
      { status: 500 }
    );
  }
}
