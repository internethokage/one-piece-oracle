/**
 * Environment variable validation.
 * Call this in API routes that require specific env vars
 * to get clear error messages instead of cryptic failures.
 */

type EnvRequirement = {
  key: string;
  description: string;
  required: boolean;
};

const ENV_VARS: EnvRequirement[] = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    required: true,
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anon key (public)',
    required: true,
  },
  {
    key: 'SUPABASE_SERVICE_KEY',
    description: 'Supabase service role key (server-only)',
    required: true,
  },
  {
    key: 'OPENAI_API_KEY',
    description: 'OpenAI API key (embeddings + LLM)',
    required: false, // Optional — falls back to fulltext search
  },
  {
    key: 'STRIPE_SECRET_KEY',
    description: 'Stripe secret key',
    required: false, // Optional — required only for payments
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    description: 'Stripe webhook signing secret',
    required: false,
  },
  {
    key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    description: 'Stripe publishable key (public)',
    required: false,
  },
];

export interface EnvCheckResult {
  ok: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Check required environment variables.
 * Returns { ok, missing, warnings } instead of throwing.
 */
export function checkEnv(requiredKeys?: string[]): EnvCheckResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  const toCheck = requiredKeys
    ? ENV_VARS.filter(v => requiredKeys.includes(v.key))
    : ENV_VARS;

  for (const envVar of toCheck) {
    const value = process.env[envVar.key];
    if (!value || value.trim() === '') {
      if (envVar.required) {
        missing.push(`${envVar.key} (${envVar.description})`);
      } else {
        warnings.push(`${envVar.key} not set — ${envVar.description} unavailable`);
      }
    }
  }

  return {
    ok: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Check specific required vars and throw if any are missing.
 * Use at the top of API handlers.
 */
export function requireEnv(keys: string[]): void {
  const result = checkEnv(keys);
  if (!result.ok) {
    throw new Error(
      `Missing required environment variables:\n${result.missing.map(m => `  - ${m}`).join('\n')}\n\nSee SETUP.md for configuration instructions.`
    );
  }
}

/**
 * Log env status to console (dev-friendly startup check).
 * Safe to call from anywhere — logs to console only.
 */
export function logEnvStatus(): void {
  if (process.env.NODE_ENV === 'production') return; // Skip in production

  const result = checkEnv();
  if (result.ok && result.warnings.length === 0) {
    console.log('✅ One Piece Oracle: All environment variables configured');
  } else {
    if (result.missing.length > 0) {
      console.error('❌ One Piece Oracle: Missing required env vars:');
      result.missing.forEach(m => console.error(`   - ${m}`));
    }
    if (result.warnings.length > 0) {
      console.warn('⚠️  One Piece Oracle: Optional env vars not set:');
      result.warnings.forEach(w => console.warn(`   - ${w}`));
    }
    console.info('📖 See SETUP.md for configuration instructions');
  }
}
