import { getUserFromSession } from "@/lib/getUserFromSession";
import { createClient } from "@supabase/supabase-js";

export default async function SummaryPage() {
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

  const { data: summaries } = await supabase
    .from("summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("summary_date", { ascending: false })
    .order("time_of_day", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-purple mb-4">
        Daily summary archive
      </h1>

      {/* Render your SummaryCard component */}
    </div>
  );
}
