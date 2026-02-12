import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/getUser";
import { suggestWorkBlock } from "@/lib/schedule/suggestWorkBlock";

export async function GET() {
  const user = await getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) pull active suggested blocks (undecided)
  const { data: blocks, error: blocksErr } = await supabase
    .from("suggested_work_blocks")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "suggested")
    .order("created_at", { ascending: false })
    .limit(10);

  if (blocksErr) {
    console.error(blocksErr);
    return NextResponse.json({ blocks: [] });
  }

  if (!blocks || blocks.length === 0) {
    return NextResponse.json({ blocks: [] });
  }

  const sourceIds = blocks
  .map((b) => b.source_id)
  .filter(Boolean);

const { data: sourceEmails } = await supabase
  .from("email_records")
  .select('id, "Subject", "Summary"')
  .in("id", sourceIds);

const sourceMap = new Map(
  (sourceEmails ?? []).map((e) => [
    e.id,
    {
      title: e.Subject,
      summary: e.Summary,
    },
  ])
);

  // 2) get today's snapshot (timeline + deep work windows)
  const now = new Date();
const yyyyMmDd = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate()
).toISOString().slice(0, 10);

  const { data: snap } = await supabase
    .from("calendar_snapshots")
    .select("day_timeline, deep_work_windows")
    .eq("user_id", user.id)
    .eq("date", yyyyMmDd)
    .maybeSingle();

  const dayTimeline = (snap?.day_timeline ?? []) as any[];
  const deepWorkWindows = (snap?.deep_work_windows ?? []) as any[];

  // 3) compute a concrete slot for each block (if not already computed)
  const enriched = [];

  for (const b of blocks) {
    let suggestedStart = b.suggested_start;
    let suggestedEnd = b.suggested_end;
    let suggestedReason = b.suggested_reason;

    if (!suggestedStart || !suggestedEnd) {
      const proposed = suggestWorkBlock({
        estimatedMinutes: Number(b.estimated_minutes ?? 30),
        deepWorkWindows,
        dayTimeline,
        deadline: b.deadline ?? undefined,
      });

      if (proposed) {
        suggestedStart = proposed.start;
        suggestedEnd = proposed.end;
        suggestedReason = proposed.reason;

        // persist suggestion so it doesn't move around
        await supabase
          .from("suggested_work_blocks")
          .update({
            suggested_start: suggestedStart,
            suggested_end: suggestedEnd,
            suggested_reason: suggestedReason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", b.id);
      }
    }

    const source = sourceMap.get(b.source_id);

enriched.push({
  id: b.id,
  source_id: b.source_id,
  source_title: source?.title ?? "Follow-up work",
  source_summary: source?.summary ?? null,
  minutes: Number(b.estimated_minutes ?? 30),
  deadline: b.deadline,
  reason: b.reason,
  suggested_start: suggestedStart,
  suggested_end: suggestedEnd,
  suggested_reason: suggestedReason,
});
  }

  return NextResponse.json({ blocks: enriched });
}
