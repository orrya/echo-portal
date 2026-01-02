import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (token_hash && type) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
