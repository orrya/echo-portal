import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { emailId } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("email_records")
      .update({
        "Email Status": "Resolved",
        "Finish Time": new Date().toISOString(),
      })
      .eq("id", emailId);

    if (error) {
      return new NextResponse(error.message, { status: 500 });
    }

    return new NextResponse("ok", { status: 200 });
  } catch (err: any) {
    return new NextResponse(err.message || "Error", { status: 500 });
  }
}
