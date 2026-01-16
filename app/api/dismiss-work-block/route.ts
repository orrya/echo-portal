import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/getUser";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { source_id } = await req.json();
  if (!source_id)
    return Response.json({ error: "missing source_id" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from("suggested_work_blocks")
    .update({
      status: "dismissed",
      dismissed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("source_id", source_id)
    .eq("status", "suggested");

  return Response.json({ ok: true });
}
