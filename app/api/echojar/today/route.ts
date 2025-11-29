import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

function getLocalDateString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    return NextResponse.json({ entry: null });
  }

  const today = getLocalDateString();

  // Fetch today's entry
  const { data, error } = await supabase
    .from('echojar_daily')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  if (error) {
    console.error('[today] Error fetching entry:', error);
    return NextResponse.json({ entry: null });
  }

  return NextResponse.json({ entry: data });
}
