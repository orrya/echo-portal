import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Get logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("USER from API:", user);   // <-- IMPORTANT DEBUG LOG

  if (userError || !user) {
    console.log("No user found. Returning empty.");
    return NextResponse.json({ entries: [] }, { status: 200 });
  }

  // 2. Fetch entries
  const { data, error } = await supabase
    .from('echojar_daily')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30);

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ entries: [] }, { status: 200 });
  }

  return NextResponse.json({ entries: data ?? [] });
}
