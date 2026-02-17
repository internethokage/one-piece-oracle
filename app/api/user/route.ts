import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/user — Get current user profile and tier
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ user: null, tier: 'free', isPro: false });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tier, subscription_status')
      .eq('id', user.id)
      .single();

    const tier =
      profile?.tier === 'pro' &&
      ['active', 'trialing'].includes(profile?.subscription_status ?? '')
        ? 'pro'
        : 'free';

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      tier,
      isPro: tier === 'pro',
    });
  } catch (error) {
    console.error('[user] Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
