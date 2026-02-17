import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Fallback values prevent build-time errors when env vars aren't set.
  // In production, NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  // must be set in your deployment environment.
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

  return createBrowserClient(url, key);
}
