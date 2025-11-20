import { getUserFromSession } from "@/lib/getUserFromSession";
import { createClient } from "@supabase/supabase-js";

export default async function EmailPage() {
  const user = await getUserFromSession();

  if (!user) {
    return (
      <div className="text-center py-10">
        Please{" "}
        <a className="text-purple underline" href="/auth/sign-in">
          sign in
        </a>
        .
      </div>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: emails } = await supabase
    .from("emails")
    .select("*")
    .eq("user_id", user.id)
    .order("received_at", { ascending: false });

  const actionEmails = emails?.filter((e) => e.category === "action") ?? [];
  const followUpEmails = emails?.filter((e) => e.category === "follow_up") ?? [];
  const noiseEmails = emails?.filter((e) => e.category === "noise") ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-purple">Email viewer</h1>

      {/* Render lists */}
    </div>
  );
}
