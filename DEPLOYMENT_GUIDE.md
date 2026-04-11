# WorkflowAI Workspace - Complete Deployment Guide

## 🚀 Quick Start (30 Minutes to Production)

This guide will take you from zero to deployed in under 30 minutes.

---

## Prerequisites Checklist

Before starting, ensure you have accounts for:
- [ ] GitHub (for code hosting)
- [ ] Netlify (for hosting + functions)
- [ ] Supabase (for database + auth)
- [ ] Stripe (for payments)
- [ ] Resend (for emails)
- [ ] Anthropic (for AI)

---

## Step 1: Supabase Setup (5 minutes)

### 1.1 Create Project
1. Go to https://supabase.com
2. Click "New Project"
3. Name: `workflowai-workspace`
4. Database Password: Generate strong password (save it!)
5. Region: Choose closest to your users
6. Click "Create new project"

### 1.2 Run Migration
1. Wait for project to finish provisioning
2. Go to SQL Editor
3. Click "New Query"
4. Copy entire contents of `supabase/migrations/0001_init.sql`
5. Paste and click "Run"
6. Verify: Go to Table Editor, you should see 9 tables

### 1.3 Create Storage Buckets
1. Go to Storage
2. Create bucket: `documents-pdf`
   - Public: Yes
   - File size limit: 50MB
   - Allowed MIME types: `application/pdf`
3. Create bucket: `user-avatars`
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/*`
4. Create bucket: `client-files`
   - Public: No
   - File size limit: 50MB

### 1.4 Configure Auth
1. Go to Authentication → Providers
2. Enable Email provider (default)
3. Optional: Enable Google/GitHub OAuth
4. Go to Authentication → URL Configuration
5. Site URL: `https://app.yourdomain.com`
6. Redirect URLs: 
   - `https://app.yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for dev)

### 1.5 Get API Keys
1. Go to Settings → API
2. Copy and save:
   - Project URL (e.g., `https://xyz.supabase.co`)
   - `anon` `public` key (starts with `eyJ...`)
   - `service_role` `secret` key (starts with `eyJ...`)

⚠️ **CRITICAL**: Never commit `service_role` key to Git!

---

## Step 2: Stripe Setup (5 minutes)

### 2.1 Create Account
1. Go to https://stripe.com
2. Sign up
3. Complete business verification (can do later)

### 2.2 Get API Keys
1. Go to Developers → API Keys
2. Toggle "Test mode" ON (for now)
3. Copy and save:
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)

### 2.3 Create Webhook
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://app.yourdomain.com/.netlify/functions/stripe-webhook`
   (Replace with your actual domain, or use Netlify preview URL for now)
4. Events to send:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `charge.refunded`
5. Click "Add endpoint"
6. Copy Signing secret (starts with `whsec_...`)

### 2.4 Test Mode Notes
- Use test credit card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC
- When ready for production, get live keys from Dashboard

---

## Step 3: Resend Setup (3 minutes)

### 3.1 Create Account
1. Go to https://resend.com
2. Sign up with email
3. Verify email address

### 3.2 Verify Domain
1. Go to Domains → Add Domain
2. Enter: `yourdomain.com`
3. Copy DNS records provided:
   - TXT record for verification
   - TXT record for DKIM
   - CNAME for email routing
4. Add these to your DNS provider (Cloudflare, Namecheap, etc.)
5. Wait 5-15 minutes for propagation
6. Click "Verify" in Resend dashboard

### 3.3 Get API Key
1. Go to API Keys
2. Click "Create API Key"
3. Name: `WorkflowAI Production`
4. Permission: Full Access
5. Copy key (starts with `re_...`)

### 3.4 Set From Address
Default sending address will be: `hello@yourdomain.com`
Make sure this is in your Resend verified domains list.

---

## Step 4: Anthropic Setup (2 minutes)

### 4.1 Create Account
1. Go to https://console.anthropic.com
2. Sign up
3. Add payment method (required for API access)

### 4.2 Get API Key
1. Go to Settings → API Keys
2. Click "Create Key"
3. Name: `WorkflowAI Production`
4. Copy key (starts with `sk-ant-api03-...`)

### 4.3 Set Budget Alert (Optional but Recommended)
1. Go to Settings → Billing
2. Set monthly budget alert (e.g., $100)
3. Add email for notifications

---

## Step 5: GitHub Repository (2 minutes)

### 5.1 Create Repo
1. Go to https://github.com/new
2. Name: `workflowai-workspace`
3. Description: "AI-powered workspace for freelancers"
4. Private: Yes (recommended)
5. Don't initialize with README (we have code already)
6. Click "Create repository"

### 5.2 Push Code
```bash
cd /path/to/workflowai-workspace

# Initialize git
git init
git add .
git commit -m "Initial commit: Complete WorkflowAI Workspace"

# Add remote (replace with your URL)
git remote add origin https://github.com/yourusername/workflowai-workspace.git

# Push to main
git branch -M main
git push -u origin main
```

### 5.3 Create .gitignore
Create `.gitignore` in root:
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Local env files
.env
.env.local
.env.*.local

# Next.js
.next/
out/
build/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Supabase
.supabase/
```

Commit and push:
```bash
git add .gitignore
git commit -m "Add .gitignore"
git push
```

---

## Step 6: Netlify Deployment (8 minutes)

### 6.1 Connect Repository
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub"
4. Authorize Netlify to access your repos
5. Select `workflowai-workspace` repository
6. Branch: `main`
7. Build command: `npm run build`
8. Publish directory: `.next`
9. Click "Deploy site"

### 6.2 Configure Domain
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter: `app.yourdomain.com`
4. Follow DNS instructions (add CNAME or A record)
5. Enable HTTPS (automatic with Let's Encrypt)
6. Repeat for client portal:
   - Add domain: `client.yourdomain.com`
   - Point to same Netlify site

### 6.3 Set Environment Variables
1. Go to Site settings → Environment variables
2. Click "Add a variable"
3. Add each variable from `ENV_VARIABLES.md`:

**Supabase:**
```
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Anthropic:**
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Stripe:**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Resend:**
```
RESEND_API_KEY=re_...
```

**App URLs:**
```
APP_URL=https://app.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
CLIENT_PORTAL_URL=https://client.yourdomain.com
NEXT_PUBLIC_CLIENT_PORTAL_URL=https://client.yourdomain.com
```

**Email:**
```
EMAIL_FROM=hello@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
```

### 6.4 Redeploy
1. Go to Deploys
2. Click "Trigger deploy"
3. Wait for build to complete (~3-5 minutes)
4. Click on deploy URL to verify site is live

---

## Step 7: Stripe Webhook Update (1 minute)

Now that you have your Netlify URL:

1. Go back to Stripe Dashboard → Webhooks
2. Click on the webhook you created
3. Update Endpoint URL to: `https://app.yourdomain.com/.netlify/functions/stripe-webhook`
4. Click "Update endpoint"
5. Test webhook: Click "Send test webhook" → Select `payment_intent.succeeded`

---

## Step 8: Supabase Cron Setup (3 minutes)

### 8.1 Schedule Payment Reminders
1. Go to Supabase Dashboard → Database → Cron Jobs
2. Click "Create a new cron job"
3. Name: `payment-reminders`
4. Schedule: `0 9 * * *` (daily at 9am UTC)
5. SQL Command:
```sql
SELECT net.http_post(
  url := 'https://app.yourdomain.com/.netlify/functions/payment-reminders',
  headers := '{"Content-Type": "application/json"}'::jsonb
);
```
6. Click "Create"

### 8.2 Verify Cron
The cron will run next at 9am UTC. To test immediately:
1. Go to SQL Editor
2. Run:
```sql
SELECT net.http_post(
  url := 'https://app.yourdomain.com/.netlify/functions/payment-reminders',
  headers := '{"Content-Type": "application/json"}'::jsonb
);
```
3. Check Netlify Functions logs for execution

---

## Step 9: First User Test (5 minutes)

### 9.1 Create Test Account
1. Go to `https://app.yourdomain.com/signup`
2. Sign up with test email
3. Verify email (check inbox)
4. Complete onboarding

### 9.2 Create Test Client
1. Go to Clients → Add Client
2. Name: "Test Client Co."
3. Email: your-test-email@gmail.com
4. Save

### 9.3 Create Test Project
1. Go to Projects → New Project
2. Name: "Website Redesign"
3. Client: Select "Test Client Co."
4. Budget: $5000
5. Billing Type: Fixed
6. Save

### 9.4 Test InvoiceAI
1. Open project "Website Redesign"
2. Click "Create Invoice"
3. Wait for AI generation
4. Verify invoice appears
5. Copy Stripe payment link
6. Open in incognito window
7. Use test card: `4242 4242 4242 4242`
8. Complete payment
9. Verify invoice status updates to "Paid"

### 9.5 Test Client Portal
1. Go to Clients → "Test Client Co."
2. Copy Portal Token
3. Visit: `https://client.yourdomain.com/[token]`
4. Verify you see the invoice
5. Verify "Pay Now" button works

---

## Step 10: Production Checklist

Before going live with real clients:

### Security
- [ ] All env vars set in Netlify (no defaults)
- [ ] Supabase RLS policies tested
- [ ] Stripe webhook signature verified
- [ ] HTTPS enabled on all domains
- [ ] No API keys in client-side code

### Stripe
- [ ] Switch from Test mode to Live mode
- [ ] Get live API keys (pk_live_, sk_live_)
- [ ] Update Netlify env vars
- [ ] Recreate webhook for production
- [ ] Update webhook URL to production domain

### Monitoring
- [ ] Set up error tracking (Sentry recommended)
- [ ] Enable Netlify Analytics
- [ ] Set Anthropic budget alert
- [ ] Monitor Supabase usage dashboard
- [ ] Set up uptime monitoring (Pingdom/UptimeRobot)

### Legal
- [ ] Add Terms of Service
- [ ] Add Privacy Policy
- [ ] Add contract disclaimer (already in ContractAI)
- [ ] Verify GDPR compliance if EU users

### Email
- [ ] Test email deliverability
- [ ] Configure SPF/DKIM/DMARC
- [ ] Add unsubscribe links
- [ ] Set up email templates in Resend

### Backup
- [ ] Enable Supabase daily backups
- [ ] Export environment variables to secure location
- [ ] Document deployment process (you're reading it!)

---

## Troubleshooting Common Issues

### Build Fails on Netlify
**Error**: `Module not found: Can't resolve '@supabase/supabase-js'`
**Fix**: Clear cache and redeploy
```bash
# In Netlify Dashboard
Site settings → Build & deploy → Clear cache and retry deploy
```

### Stripe Webhook 401 Error
**Error**: `Webhook signature verification failed`
**Fix**: 
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
2. Check webhook endpoint URL is exactly: `/.netlify/functions/stripe-webhook`
3. Test locally with Stripe CLI:
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

### Invoice Generation Timeout
**Error**: `Function execution timed out`
**Fix**: 
1. Increase Netlify Function timeout (Pro plan required for >10s)
2. Or optimize prompt to reduce AI response time
3. Or implement background job processing

### Client Portal 404
**Error**: `404 Not Found` on `client.yourdomain.com/[token]`
**Fix**:
1. Check DNS CNAME points to Netlify
2. Verify redirect in `netlify.toml`
3. Ensure `app/client/[token]/page.tsx` exists
4. Check build logs for Next.js errors

### RLS Policy Errors
**Error**: `new row violates row-level security policy`
**Fix**:
1. Verify user is authenticated (check `auth.uid()`)
2. Check policy `USING` and `WITH CHECK` clauses
3. Test policies in Supabase SQL Editor:
```sql
-- Test as specific user
SET request.jwt.claims TO '{"sub": "user-uuid-here"}';
SELECT * FROM invoices; -- Should only see own invoices
```

---

## Maintenance Tasks

### Weekly
- [ ] Check Netlify function logs for errors
- [ ] Monitor Anthropic API usage/costs
- [ ] Review Stripe payment success rate

### Monthly
- [ ] Rotate API keys (Anthropic, Resend)
- [ ] Review Supabase database size
- [ ] Check for Next.js/dependency updates
- [ ] Backup database (Supabase auto-backups, but verify)

### Quarterly
- [ ] Security audit (dependency vulnerabilities)
- [ ] Performance optimization review
- [ ] User feedback analysis
- [ ] Scale planning (if growth demands)

---

## Scaling Considerations

### At 100 Users
- Upgrade Netlify to Pro ($19/mo) for longer function timeouts
- Consider Supabase Pro ($25/mo) for better performance
- Implement Redis caching for AI responses

### At 1000 Users
- Move to dedicated Anthropic contract for volume pricing
- Consider Cloudflare Workers for edge functions
- Implement CDN for static assets
- Add database read replicas

### At 10,000 Users
- Migrate to self-hosted infrastructure (AWS/GCP)
- Implement horizontal scaling for functions
- Add background job queue (BullMQ)
- Consider microservices architecture

---

## Support & Resources

- **Netlify Docs**: https://docs.netlify.com
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Anthropic Docs**: https://docs.anthropic.com
- **Next.js Docs**: https://nextjs.org/docs

**Emergency Rollback**:
If deployment breaks production:
1. Go to Netlify → Deploys
2. Find last working deploy
3. Click "⋯" → "Publish deploy"
4. Site will revert in ~30 seconds

---

## You're Live! 🎉

Your WorkflowAI Workspace is now deployed and ready for real users.

**Next Steps**:
1. Create your first real project
2. Send proposal to actual client
3. Generate invoice and get paid
4. Iterate based on user feedback

**Share Your Success**:
If you found this helpful, consider:
- Starring the repo on GitHub
- Sharing on Twitter/LinkedIn
- Writing a blog post about your experience

Good luck building your business with WorkflowAI! 🚀
