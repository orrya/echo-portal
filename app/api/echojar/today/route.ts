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
    return NextResponse.json({ entry: null }, { status: 200 });
  }

  // Today’s date as YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('echojar_daily')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  // If not found, return null (NOT an error)
  if (error && error.code !== 'PGRST116') {
    console.error('EchoJar /today error:', error);
  }

  return NextResponse.json({ entry: data ?? null });
}
