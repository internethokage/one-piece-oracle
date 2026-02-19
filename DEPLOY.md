# One Piece Oracle — Vercel Deployment Guide

Step-by-step guide to deploying from zero to live on Vercel.

---

## Prerequisites

Make sure you've already completed:
- ✅ **SETUP.md** — Supabase project, schema, Stripe product, local `.env.local`
- ✅ `npm run seed` — test data loaded (or full data pipeline run)
- ✅ `npm run build` — local build passes cleanly

---

## Step 1: Create Vercel Project

### Option A: Via Vercel CLI (preferred)

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Option B: Via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import GitHub repo: `internethokage/one-piece-oracle`
3. Framework: Next.js (auto-detected)
4. Root directory: `.` (default)
5. Click **Deploy**

> The first deploy will fail — environment variables aren't set yet. That's expected.

---

## Step 2: Configure Environment Variables

In Vercel Dashboard → Project → Settings → **Environment Variables**

Add all of these:

| Variable | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | All |
| `SUPABASE_SERVICE_KEY` | Your service key | Production, Preview |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Preview |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Preview |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production, Preview |
| `OPENAI_API_KEY` | `sk-...` | All |
| `LLM_MODEL` | `gpt-4-turbo-preview` | All |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://your-preview-url.vercel.app` | Preview |

> ⚠️ Never commit `.env.local` to git. It's in `.gitignore`.

---

## Step 3: Configure Stripe Webhook (Production)

After first successful deploy, you'll have your production URL.

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** → add as `STRIPE_WEBHOOK_SECRET` in Vercel

### For Preview Deployments

Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward to your local machine during development:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Step 4: Configure Supabase Auth (Production)

In Supabase Dashboard → Authentication → URL Configuration:

1. **Site URL:** `https://your-domain.com`
2. **Redirect URLs** (add all):
   ```
   https://your-domain.com/auth/callback
   https://your-preview-url.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

For Google OAuth (if enabled):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Add authorized redirect URIs:
   - `https://xxxx.supabase.co/auth/v1/callback`

---

## Step 5: Redeploy

After setting all environment variables:

```bash
vercel --prod
# OR in the Vercel Dashboard: Deployments → ... → Redeploy
```

---

## Step 6: Post-Deploy Verification

Run through this checklist after deployment:

### Core Functionality
- [ ] Home page loads (dark theme, search bar visible)
- [ ] Full-text search returns results
- [ ] Sign up with email works (check email for confirmation)
- [ ] Sign in works
- [ ] Google OAuth works (if configured)
- [ ] Semantic search is gated behind Pro

### Payments
- [ ] Click "Upgrade to Pro" → Stripe Checkout opens
- [ ] Use test card `4242 4242 4242 4242` → Complete checkout
- [ ] Redirected back to site with success message
- [ ] User profile shows "PRO" badge
- [ ] AI answers now accessible

### SEO
- [ ] Visit `/sitemap.xml` → returns XML
- [ ] Visit `/robots.txt` → returns proper rules
- [ ] OG preview works (use [opengraph.xyz](https://www.opengraph.xyz/))

### Monitoring
- [ ] Check Vercel Function logs for errors
- [ ] Check Supabase logs for DB errors
- [ ] Check Stripe webhook delivery (Dashboard → Webhooks → Recent events)

---

## Custom Domain

1. Vercel Dashboard → Project → Settings → **Domains**
2. Add your domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` env var
5. Update Supabase auth redirect URLs
6. Update Stripe webhook URL
7. Redeploy

---

## Performance Notes

| Route | Max Duration | Notes |
|---|---|---|
| `/api/ask` | 60s | LLM calls can take 10-30s |
| `/api/search` | 30s | Vector search + optional embeddings |
| `/api/webhooks/stripe` | 30s | Stripe event processing |
| All others | 10s (default) | Auth, user, checkout |

**Regions:** Deployed to `iad1` (Washington DC) by default. Change in `vercel.json` if needed.

**Caching:** 
- Static assets: 1 year (immutable)
- API routes: No cache (always fresh)
- Pages: Static where possible, dynamic when auth-dependent

---

## Scaling Checklist (When You Hit Limits)

| Issue | Solution |
|---|---|
| Rate limit errors | Replace in-memory limiter → Upstash Redis |
| Slow AI responses | Add streaming (`stream: true` on OpenAI calls) |
| High embedding costs | Cache embeddings for common queries |
| DB connection limits | Enable Supabase connection pooling |
| Cold starts | Vercel Fluid compute (automatic) |

---

## Rollback

If a deploy breaks prod:

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

Or via Dashboard: Deployments → find the last good one → "Promote to Production"

---

## Summary

```
Total deploy time: ~5 minutes
Cost: Free (Vercel Hobby) → $20/mo (Vercel Pro if needed)
```

**TL;DR:** Set env vars → add Stripe webhook → update Supabase redirect URLs → redeploy → verify.

🏴‍☠️ **The Oracle is live. Let the treasure hunters come.**
