// app/api/echojar/all/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ entries: [] }, { status: 200 });
  }

  // Fetch all EchoJar entries for the user
  const { data, error } = await supabase
    .from('echojar_daily')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30);

  if (error) {
    console.error('EchoJar /all error:', error);
    return NextResponse.json({ entries: [] }, { status: 200 });
  }

  return NextResponse.json({ entries: data ?? [] });
}
