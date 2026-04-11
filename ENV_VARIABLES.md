# WorkflowAI Workspace - Environment Variables Configuration

## Netlify Environment Variables
Set these in: Netlify Dashboard → Site Settings → Environment Variables

### Required for All Deployments

```bash
# ================================
# SUPABASE CONFIGURATION
# ================================
# Get these from: Supabase Dashboard → Project Settings → API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Public anon key (safe for client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Service role key (KEEP SECRET - server only)

# Used for Next.js Server Components
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...


# ================================
# ANTHROPIC AI CONFIGURATION
# ================================
# Get from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-api03-...  # KEEP SECRET - server only


# ================================
# STRIPE CONFIGURATION
# ================================
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_...  # Use sk_test_ for testing
STRIPE_PUBLISHABLE_KEY=pk_live_...  # Use pk_test_ for testing
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe Webhook settings

# For client-side Stripe.js
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...


# ================================
# RESEND EMAIL CONFIGURATION
# ================================
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_...  # KEEP SECRET - server only


# ================================
# APPLICATION URLS
# ================================
# Your production domain
APP_URL=https://app.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com

# Client portal subdomain (path-based routing)
CLIENT_PORTAL_URL=https://client.yourdomain.com
NEXT_PUBLIC_CLIENT_PORTAL_URL=https://client.yourdomain.com

# Main website (if separate)
WEBSITE_URL=https://yourdomain.com


# ================================
# EMAIL CONFIGURATION
# ================================
# Your verified sender email in Resend
EMAIL_FROM=hello@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com


# ================================
# OPTIONAL: FEATURE FLAGS
# ================================
ENABLE_AI_FEATURES=true
ENABLE_TIME_TRACKING=true
ENABLE_STRIPE_PAYMENTS=true
MAX_AI_RETRIES=3


# ================================
# OPTIONAL: RATE LIMITING
# ================================
AI_RATE_LIMIT_PER_USER_PER_HOUR=50
EMAIL_RATE_LIMIT_PER_USER_PER_DAY=100
```

## Environment-Specific Settings

### Development (.env.local)
```bash
# Use test keys for development
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Local URLs
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
CLIENT_PORTAL_URL=http://localhost:3000
NEXT_PUBLIC_CLIENT_PORTAL_URL=http://localhost:3000

# Optional: Use Anthropic playground for testing
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional: Verbose logging
NODE_ENV=development
DEBUG=true
```

### Production (Netlify)
```bash
# Use live keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Production URLs
APP_URL=https://app.yourdomain.com
CLIENT_PORTAL_URL=https://client.yourdomain.com

NODE_ENV=production
```

## Netlify-Specific Configuration

### Build Settings (netlify.toml)
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Client portal subdomain routing
[[redirects]]
  from = "https://client.yourdomain.com/*"
  to = "https://app.yourdomain.com/client/:splat"
  status = 200
  force = true

[functions]
  node_bundler = "esbuild"
  included_files = ["netlify/functions/**"]
```

## Required External Services Setup

### 1. Supabase Setup
- Create project at https://supabase.com
- Run migration: `supabase/migrations/0001_init.sql`
- Create Storage Buckets:
  - `documents-pdf` (public read, authenticated write)
  - `user-avatars` (public read, authenticated write)
  - `client-files` (private, RLS)
- Enable Row Level Security on all tables
- Configure Auth providers (Email, Google, etc.)

### 2. Stripe Setup
- Create account at https://stripe.com
- Set up Webhook endpoint: `https://app.yourdomain.com/.netlify/functions/stripe-webhook`
- Subscribe to events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.succeeded`
  - `invoice.paid`
  - `invoice.payment_failed`

### 3. Resend Setup
- Create account at https://resend.com
- Verify domain: `yourdomain.com`
- Add DNS records (SPF, DKIM, DMARC)
- Create API key with send permissions

### 4. Anthropic Setup
- Create account at https://console.anthropic.com
- Generate API key
- Set up billing (pay-as-you-go)
- Monitor usage in dashboard

### 5. Domain Configuration
DNS Records needed:
```
# Main app
A     app.yourdomain.com     → Netlify IP (or CNAME to Netlify)

# Client portal
A     client.yourdomain.com  → Netlify IP (or CNAME to Netlify)

# Email (for Resend)
TXT   yourdomain.com         → "v=spf1 include:_spf.resend.com ~all"
TXT   resend._domainkey      → [DKIM key from Resend]
TXT   _dmarc                 → "v=DMARC1; p=none; rua=mailto:hello@yourdomain.com"
```

## Security Checklist

- [ ] Never commit `.env` files to Git
- [ ] Use different API keys for dev/staging/production
- [ ] Rotate secrets every 90 days
- [ ] Enable Supabase RLS on ALL tables
- [ ] Set up Stripe webhook signature verification
- [ ] Enable HTTPS only (Netlify handles this)
- [ ] Configure CORS for Netlify Functions
- [ ] Set up Netlify IP allowlist (optional)
- [ ] Enable 2FA on all service accounts
- [ ] Monitor Anthropic API usage for anomalies

## Deployment Checklist

- [ ] All environment variables set in Netlify
- [ ] Supabase migration run successfully
- [ ] Stripe webhook endpoint configured
- [ ] Resend domain verified
- [ ] DNS records propagated
- [ ] SSL certificates active (auto via Netlify)
- [ ] Test invoice creation end-to-end
- [ ] Test client portal access via token
- [ ] Test Stripe payment flow
- [ ] Test email sending via Resend
- [ ] Monitor Netlify Function logs
- [ ] Set up error tracking (Sentry, etc.)

## Common Issues

### Build Fails
- Check Node version (use v18+)
- Verify all `NEXT_PUBLIC_*` vars are set
- Clear Netlify build cache

### Function Timeouts
- Netlify Functions timeout at 10s (Free) or 26s (Pro)
- Use background functions for long-running tasks
- Optimize AI prompts for faster responses

### RLS Policy Errors
- Verify user authentication in Netlify Functions
- Check `auth.uid()` matches `user_id` in queries
- Test policies in Supabase SQL Editor

### Stripe Webhook Failures
- Verify webhook secret matches Stripe dashboard
- Check Netlify Function logs for errors
- Test locally with Stripe CLI: `stripe listen --forward-to localhost:3000/.netlify/functions/stripe-webhook`

## Monitoring

### Recommended Tools
- **Error Tracking**: Sentry
- **Logging**: Netlify Function Logs + Supabase Logs
- **Uptime**: Pingdom or UptimeRobot
- **Analytics**: PostHog or Plausible
- **AI Usage**: Anthropic Console Dashboard

### Key Metrics to Monitor
- AI API usage and costs
- Stripe payment success rate
- Email delivery rate (Resend)
- Function execution time
- Database query performance
- Client portal access frequency

## Support Contacts
- Netlify Support: support@netlify.com
- Supabase Support: support@supabase.com
- Stripe Support: support@stripe.com
- Anthropic Support: support@anthropic.com
- Resend Support: support@resend.com
