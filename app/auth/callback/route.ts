import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert user profile (ensure it exists)
      await supabase.from('user_profiles').upsert(
        {
          id: data.user.id,
          email: data.user.email,
          tier: 'free',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to homepage with error
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
