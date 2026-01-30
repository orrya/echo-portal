// app/api/llm/classify-email/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Server-side Supabase (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const {
      user_id,
      email_record_id,
      subject,
      from,
      to,
      cc,
      body,
      date_received,
    } = await req.json();

    if (!user_id || !email_record_id) {
      return NextResponse.json(
        { error: "Missing user_id or email_record_id" },
        { status: 400 }
      );
    }

    /* -------------------------------------------------
       0. DEDUPE — DO WE ALREADY HAVE A PREPARED DRAFT?
    ------------------------------------------------- */

    const { data: existingDraft } = await supabase
      .from("prepared_email_drafts")
      .select("id, subject, rationale")
      .eq("user_id", user_id)
      .eq("email_record_id", email_record_id)
      .eq("active", true)
      .maybeSingle();

    if (existingDraft) {
      return NextResponse.json({
        decision: {
          should_prepare: true,
          reason: existingDraft.rationale,
          confidence: 1,
          draft_intent: null,
        },
        prepared: {
          id: existingDraft.id,
          subject: existingDraft.subject,
          rationale: existingDraft.rationale,
        },
      });
    }

    /* -------------------------------------------------
       1. COGNITIVE DECISION — SHOULD WE PREPARE?
    ------------------------------------------------- */

    const decisionRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: `
You are Echo, a cognitive twin acting on behalf of a single user.

Your job is NOT to write emails.
Your job is to decide whether preparing a reply would meaningfully reduce
the user’s future cognitive load.

Rules:
- Silence is preferred unless preparation clearly saves effort.
- Do NOT prepare drafts for purely informational emails.
- Preparation is justified if it avoids re-reading, context switching,
  emotional load, or urgency later.
- Never prepare more than one draft per email.
- Never assume the user wants to act immediately.

Return JSON only.
          `.trim(),
        },
        {
          role: "user",
          content: `
Email details:

Subject: ${subject}
From: ${from}
To: ${to}
CC: ${cc || "None"}
Received at: ${date_received}

Email body:
${body}

Return JSON:
{
  "should_prepare": boolean,
  "reason": string,
  "confidence": number,
  "draft_intent": string | null
}
          `.trim(),
        },
      ],
      response_format: { type: "json_object" },
    });

    const decision = JSON.parse(
      decisionRes.choices[0].message.content || "{}"
    );

    /* -------------------------------------------------
       2. LOG COGNITION (ALWAYS)
    ------------------------------------------------- */

    await supabase.from("cognition_traces").insert({
      user_id,
      source: "email",
      source_id: email_record_id,
      decision,
    });

    /* -------------------------------------------------
       3. IF NO PREPARATION → EXIT QUIETLY
    ------------------------------------------------- */

    if (!decision.should_prepare) {
      return NextResponse.json({ decision, prepared: null });
    }

    /* -------------------------------------------------
       4. WRITE THE ACTUAL DRAFT (READY TO SEND)
    ------------------------------------------------- */

    const draftRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.45,
      messages: [
        {
          role: "system",
          content: `
You are Echo Compose, writing on behalf of the user in their own voice.

Tone:
- British English
- Calm, friendly, concise
- Plain text only
- Short paragraphs
- Human, not robotic

Rules:
- Respond appropriately based on intent.
- If user is CC’d only, acknowledge but do not commit.
- If informational, thank and note.
- If unclear, infer likely intent without asking questions.

Always sign off with:
"Thanks," or "Many thanks,"

Return JSON only:
{ "body": "email reply text" }
          `.trim(),
        },
        {
          role: "user",
          content: `
Subject: ${subject}
From: ${from}
To: ${to}
CC: ${cc || "None"}

Email body:
${body}

Intent hint from Echo cognition:
${decision.draft_intent || "None provided"}
          `.trim(),
        },
      ],
      response_format: { type: "json_object" },
    });

    const draftJson = JSON.parse(
      draftRes.choices[0].message.content || "{}"
    );

    /* -------------------------------------------------
   4.5 IMPLIED WORK DETECTION (OPTIONAL PLANNING)
------------------------------------------------- */

let impliedWork: {
  implies_work: boolean;
  estimated_minutes: number | null;
  deadline: string | null;
  reason: string;
} | null = null;

try {
  const workRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `
You are Echo Planning.

Your task is to decide whether the drafted email reply implies
that the user has committed to doing future work.

Rules:
- Only return true if the reply commits to an action, delivery, review, or follow-up.
- Do NOT flag acknowledgements, thanks, or FYIs.
- Estimate realistic focus time, not calendar time.
- If no deadline is explicit, infer a soft deadline only if clearly implied.

Return JSON only:
{
  "implies_work": boolean,
  "estimated_minutes": number | null,
  "deadline": string | null,
  "reason": string
}
        `.trim(),
      },
      {
        role: "user",
        content: `
Drafted reply:
${draftJson.body}

Email subject:
${subject}

Received at:
${date_received}
        `.trim(),
      },
    ],
    response_format: { type: "json_object" },
  });

  impliedWork = JSON.parse(
    workRes.choices[0].message.content || "{}"
  );
} catch (err) {
  console.error("implied work detection failed:", err);
}


    /* -------------------------------------------------
       5. STORE PREPARED DRAFT (NOT SENT)
    ------------------------------------------------- */

    const { data: preparedDraft } = await supabase
      .from("prepared_email_drafts")
      .insert({
        user_id,
        email_record_id,
        subject,
        body: draftJson.body,
        rationale: decision.reason,
        surface: "email",
        day_part: "any",
        active: true,
      })
      .select()
      .single();
/* -------------------------------------------------
   5.1 DELIVER TO OUTLOOK VIA N8N (AUTO)
------------------------------------------------- */

try {
  // Fetch reply link (same as button route)
  const { data: email } = await supabase
    .from("email_records")
    .select('"Reply Link"')
    .eq("id", email_record_id)
    .eq("user_id", user_id)
    .single();

  if (email?.["Reply Link"]) {
    await fetch("https://orrya.app.n8n.cloud/webhook/echo-prepared-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        replyDraft: draftJson.body,
        replyLink: email["Reply Link"],
      }),
    });

    // Optional but strongly recommended: mark as delivered
    await supabase
      .from("prepared_email_drafts")
      .update({ delivered_to_outlook: true })
      .eq("id", preparedDraft.id);
  }
} catch (err) {
  // IMPORTANT: swallow errors — preparation succeeded even if delivery fails
  console.error("Auto-delivery to Outlook failed:", err);
}


      /* -------------------------------------------------
   5.5 STORE SUGGESTED WORK BLOCK (IF ANY)
------------------------------------------------- */

if (impliedWork?.implies_work) {
  await supabase.from("suggested_work_blocks").insert({
    user_id,
    source: "prepared_draft",
    source_id: email_record_id,
    estimated_minutes: impliedWork.estimated_minutes,
    deadline: impliedWork.deadline,
    reason: impliedWork.reason,
    status: "suggested",
  });
}


    /* -------------------------------------------------
       6. RETURN CLEAN RESPONSE
    ------------------------------------------------- */

    return NextResponse.json({
      decision,
      prepared: {
        id: preparedDraft.id,
        subject: preparedDraft.subject,
        rationale: preparedDraft.rationale,
      },
    });
  } catch (error) {
    console.error("classify-email error:", error);
    return NextResponse.json(
      { error: "Failed to classify email" },
      { status: 500 }
    );
  }
}
