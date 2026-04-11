# WorkflowAI Workspace - Architecture & Design Decisions

## Executive Summary

WorkflowAI Workspace is built as a **unified SaaS platform**, not a collection of disconnected tools. Every architectural decision prioritizes **data continuity** and **zero manual re-entry** across the lead-to-payment workflow.

## Core Design Principles

### 1. **Workspace-First, Not Tool-First**
- **Problem**: Most freelancer tools are siloed (separate proposal app, separate invoice app)
- **Solution**: Single database schema where data flows automatically between modules
- **Implementation**: Foreign keys + context-passing helper functions

### 2. **Server-First AI Architecture**
- **Problem**: API keys exposed in client code, no retry logic, inconsistent responses
- **Solution**: All AI calls happen in Netlify Functions with 3x auto-retry and error context
- **Why**: Security, cost control, rate limiting, unified logging

### 3. **Public Portal via UUID Tokens**
- **Problem**: Client portals often require login (friction) or embed tracking pixels
- **Solution**: Shareable UUID links (e.g., `client.domain.com/a3f7b2...`) with RLS
- **Why**: Zero-friction client access, no password resets, secure multi-tenancy

---

## Database Schema Design Choices

### Users Table
```sql
contract_disclaimer_accepted_at TIMESTAMPTZ
```
**Why**: Legal compliance for ContractAI. Must show disclaimer + checkbox before first contract generation. Stored timestamp proves user consent.

```sql
default_payment_terms INTEGER DEFAULT 30
default_late_fee_percentage DECIMAL(5,2) DEFAULT 0
```
**Why**: User-level defaults avoid repetitive input. Payment terms auto-populate in invoices. Late fee stored but not auto-applied (PM decision: reminders only).

### Clients Table
```sql
portal_token UUID UNIQUE DEFAULT uuid_generate_v4()
portal_enabled BOOLEAN DEFAULT true
```
**Why**: Path-based portal routing (`client.domain.com/[token]`) avoids wildcard SSL complexity. `portal_enabled` allows temporarily revoking access without deleting client.

**RLS Strategy**: Two-tier access:
1. User owns data: `auth.uid() = user_id`
2. Public read: `portal_enabled = true` (for client portal SSR)

### Projects Table
```sql
status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'proposal_sent', 'negotiating', 'active', 'completed', 'cancelled'))
```
**Why**: Project lifecycle drives UI state. Status auto-updates when documents are sent (via triggers). "Lead" → "Proposal Sent" → "Active" → "Completed" represents the core workflow.

```sql
billing_type TEXT CHECK (billing_type IN ('fixed', 'hourly', 'retainer'))
hourly_rate DECIMAL(10,2)
```
**Why**: Supports both fixed-price and time-tracked projects. When `billing_type = 'hourly'`, InvoiceAI auto-fetches unbilled time logs.

### Documents Table
```sql
type TEXT NOT NULL CHECK (type IN ('proposal', 'contract', 'invoice', 'bio', 'job_post', 'email', 'other'))
version INTEGER DEFAULT 1
parent_document_id UUID REFERENCES documents(id)
```
**Why**: Universal document store for all AI-generated content. Version tracking + parent relationship enables "Edit Contract v2 based on v1" workflows.

```sql
pdf_url TEXT
pdf_storage_path TEXT
ai_prompt TEXT
ai_model TEXT
ai_tokens_used INTEGER
```
**Why**: Full audit trail. Users can see exactly what prompt generated each document. Token tracking for billing transparency.

### Invoices Table
```sql
line_items JSONB NOT NULL DEFAULT '[]'
```
**Why**: JSONB allows flexible line item structures (hourly vs fixed, with/without tax per item). Alternative: separate `invoice_line_items` table adds complexity for minimal benefit.

```sql
stripe_payment_link_id TEXT
stripe_payment_link_url TEXT
stripe_payment_intent_id TEXT
```
**Why**: Stripe Payment Links are stateless (no server-side checkout session). URL is shareable, reusable, and works in Client Portal. `payment_intent_id` populated via webhook when paid.

```sql
status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled'))
last_reminder_sent_at TIMESTAMPTZ
reminder_count INTEGER DEFAULT 0
```
**Why**: Status-driven reminders. PaymentAI cron (daily 9am UTC) finds `status = 'overdue'` and triggers EmailAI. `last_reminder_sent_at` prevents spam (max 1 reminder/week).

**Index Strategy**:
```sql
CREATE INDEX idx_invoices_overdue ON invoices(due_date) 
WHERE status IN ('sent', 'viewed') AND paid_at IS NULL;
```
**Why**: Partial index optimized for PaymentAI cron query. Only indexes rows that need reminder checks.

### Time Logs Table
```sql
billable BOOLEAN DEFAULT true
billed BOOLEAN DEFAULT false
invoice_id UUID REFERENCES invoices(id)
```
**Why**: Enables "mark as billed" workflow. When InvoiceAI creates invoice for hourly project:
1. SELECT unbilled time logs
2. Generate line items
3. UPDATE `billed = true` + link `invoice_id`

Prevents double-billing.

### Activities Table
```sql
type TEXT NOT NULL  -- 'invoice.created', 'email.sent', 'contract.accepted'
metadata JSONB
```
**Why**: Audit log for compliance + user dashboard. JSONB `metadata` stores context-specific data (email subject, payment amount, etc.) without schema changes.

### AI Usage Table
```sql
retry_count INTEGER DEFAULT 0
estimated_cost_usd DECIMAL(10,6)
```
**Why**: Track AI spend per user for tiered billing. `retry_count` shows when auto-retry kicked in (helps debug prompt issues).

### Prompts Table
```sql
module TEXT NOT NULL CHECK (module IN ('proposal', 'contract', 'invoice', 'email', 'bio', 'job_post'))
prompt_template TEXT NOT NULL
variables JSONB
is_default BOOLEAN DEFAULT false
```
**Why**: User-customizable AI behavior. Power users can fork default prompts. `variables` JSONB defines placeholders (e.g., `{{client_name}}`, `{{project_budget}}`).

---

## Netlify Function Design

### Why Netlify Functions vs API Routes?
| Feature | Netlify Functions | Next.js API Routes |
|---------|-------------------|-------------------|
| Cold start | ~200ms | ~1s (serverless) |
| Timeout | 10s (free), 26s (pro) | 10s (Vercel free) |
| Cron jobs | Built-in (Supabase Cron) | Requires external service |
| Deployment | Auto via Git push | Requires Vercel/custom CI |

**Decision**: Netlify Functions for server logic + Supabase Cron for scheduled tasks.

### create-invoice.ts Architecture

#### 1. Authentication Strategy
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
```
**Why**: Uses Supabase Auth token from client request. Service role key used ONLY for admin operations (bypassing RLS when needed). Never expose service key to client.

#### 2. Context Fetching
```typescript
const { data: contract } = await supabase
  .from('documents')
  .select('content, title')
  .eq('project_id', project_id)
  .eq('type', 'contract')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```
**Why**: AI needs project history for accurate invoice generation. Fetches:
- Project details (name, budget, billing type)
- Client info (for personalization)
- Most recent contract (scope of work)
- Unbilled time logs (if hourly project)

This eliminates "what should I invoice for?" ambiguity.

#### 3. AI Retry Loop
```typescript
while (!invoiceData && retryCount < MAX_RETRIES) {
  try {
    // Call Claude
    // Parse JSON
    // Validate structure
  } catch (parseError) {
    retryCount++;
    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
  }
}
```
**Why**: Claude sometimes returns markdown-wrapped JSON or incomplete responses. Retry logic:
1. Attempt 1: Direct call
2. Attempt 2: Wait 1s, retry with error context
3. Attempt 3: Wait 2s, retry with stricter system prompt

Falls back to error after 3 attempts (vs infinite loop).

#### 4. JSON Validation
```typescript
if (
  !invoiceData?.invoice_number ||
  !invoiceData?.line_items ||
  !Array.isArray(invoiceData.line_items) ||
  typeof invoiceData.subtotal !== 'number'
) {
  throw new Error('Invalid invoice structure');
}
```
**Why**: Defensive programming. Claude might omit fields or use wrong types. Validation catches issues before Stripe/DB insertion.

#### 5. Stripe Payment Link Flow
```typescript
const paymentLink = await stripe.paymentLinks.create({
  line_items: stripeLineItems,
  metadata: { user_id, project_id, invoice_number },
  after_completion: {
    type: 'redirect',
    redirect: { url: `${APP_URL}/invoices/success?invoice_number=${invoice_number}` }
  }
});
```
**Why**: Payment Links vs Checkout Sessions:
- **Payment Links**: Persistent URL, shareable, works in email/portal
- **Checkout Sessions**: Expires in 24h, requires session management

For client portals, Payment Links are superior (client can revisit link anytime).

#### 6. Activity Logging
```typescript
await supabase.from('activities').insert({
  type: 'invoice.created',
  description: `Created invoice ${invoice_number} for ${client.name}`,
  metadata: { total, currency },
  project_id, client_id, invoice_id
});
```
**Why**: Creates audit trail for user dashboard + compliance. Foreign keys allow filtering ("show all activities for this project").

---

## Client Portal Design

### SSR vs CSR Decision
**Chosen**: Server-Side Rendering (Next.js App Router)

**Why**:
1. **SEO**: Portal pages indexable (useful for public project showcases)
2. **Security**: No client-side API keys, no CORS issues
3. **Performance**: Data pre-fetched on server, no loading spinners
4. **RLS Compatibility**: Supabase RLS works seamlessly with server components

### Public RLS Policy Pattern
```sql
CREATE POLICY "Public can view invoices via client portal"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = invoices.client_id 
      AND clients.portal_enabled = true
    )
  );
```
**Why**: RLS enforces security at database level. Even if someone guesses a `portal_token`, they can only see data linked to that client. No server-side permission checks needed.

### Path-Based Routing
```
client.domain.com/a3f7b2c1-... → /app/client/[token]/page.tsx
```
**Why**: Single Netlify deploy, single SSL cert. Alternative (subdomain per client) requires:
- Wildcard DNS (`*.domain.com`)
- Wildcard SSL cert ($$)
- Dynamic routing logic

Path-based is simpler + cheaper.

### Stripe Payment Button
```tsx
<a href={invoice.stripe_payment_link_url} target="_blank">
  Pay Now
</a>
```
**Why**: Direct link to Stripe Checkout. No custom payment form needed. Stripe handles PCI compliance, fraud detection, payment methods.

---

## Supabase Cron for PaymentAI

### Cron Configuration (via Supabase Dashboard)
```sql
SELECT cron.schedule(
  'payment-reminders',
  '0 9 * * *',  -- Daily at 9am UTC
  $$
    SELECT net.http_post(
      url := 'https://app.yourdomain.com/.netlify/functions/payment-reminders',
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  $$
);
```

### payment-reminders.ts Function
```typescript
export const handler: Handler = async () => {
  // 1. Find overdue invoices
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('status', 'overdue')
    .is('paid_at', null)
    .lt('last_reminder_sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));  // Last reminder >7 days ago

  // 2. For each invoice, call EmailAI + update reminder count
  for (const invoice of overdueInvoices) {
    await sendReminderEmail(invoice);
    await supabase
      .from('invoices')
      .update({
        last_reminder_sent_at: new Date(),
        reminder_count: invoice.reminder_count + 1
      })
      .eq('id', invoice.id);
  }
};
```

**Why**: Supabase Cron is native (no external services). Triggers Netlify Function which calls EmailAI + Resend. Graceful degradation: if cron fails, users can manually trigger reminders.

---

## Security Model

### Multi-Tenancy via RLS
Every table has:
```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own data"
  ON [table_name] FOR ALL
  USING (auth.uid() = user_id);
```

**Why**: Database-level isolation. Even if application code has bugs, users can't access others' data. Defense in depth.

### API Key Storage
| Key | Storage | Exposure |
|-----|---------|----------|
| `ANTHROPIC_API_KEY` | Netlify env var | Server-only (Netlify Functions) |
| `STRIPE_SECRET_KEY` | Netlify env var | Server-only |
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify env var | Server-only |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side | Public (RLS protects data) |

**Why**: `NEXT_PUBLIC_*` vars are bundled into client JS. Never put secrets in public vars.

### Portal Token Security
```sql
portal_token UUID UNIQUE DEFAULT uuid_generate_v4()
```
- **UUID v4**: 122 bits of randomness (2^122 = 5.3 × 10^36 combinations)
- **Unguessable**: Brute force would take billions of years
- **Revocable**: Set `portal_enabled = false` to disable access

**Why**: More secure than short numeric codes, no need for passwords/2FA.

---

## Performance Optimizations

### Database Indexes
```sql
CREATE INDEX idx_invoices_overdue ON invoices(due_date) 
WHERE status IN ('sent', 'viewed') AND paid_at IS NULL;
```
**Why**: Partial index only indexes rows used by PaymentAI cron. Faster queries + smaller index size.

### JSONB for Flexible Data
```sql
line_items JSONB
metadata JSONB
```
**Why**: Avoids JOIN-heavy queries. Trade-off:
- **Pro**: Fast reads (single table scan)
- **Con**: Can't query inside JSON with standard SQL (use `jsonb_path_query`)

**Decision**: JSONB for data that varies per record (line items, activity metadata). Normalized tables for data with consistent structure (clients, projects).

### Supabase Storage vs S3
**Chosen**: Supabase Storage

**Why**:
- Integrated with RLS (same auth system)
- Auto CDN via Cloudflare
- Simpler than managing S3 bucket policies
- Cheaper for small teams (<10GB)

**Trade-off**: S3 better for large files (>100MB) or high traffic (>1TB/mo).

---

## AI Prompt Engineering

### System Prompt Strategy
```typescript
system: `You MUST respond ONLY with valid JSON matching this exact structure:
{
  "invoice_number": "string",
  "line_items": [...],
  "total": number
}

Do NOT include markdown, explanations, or text outside the JSON object.`
```

**Why**: Forces structured output. Without this, Claude often adds:
```
Here's the invoice:
```json
{ ... }
```
Hope this helps!
```

Which breaks `JSON.parse()`.

### Temperature Setting
```typescript
temperature: 0.3
```
**Why**: Lower temperature (0-0.5) = more deterministic output. For invoices/contracts, consistency > creativity.

### Context Injection
```typescript
const prompt = `
PROJECT: ${project.name}
BUDGET: $${project.budget_amount}
BILLING TYPE: ${project.billing_type}
CONTRACT SCOPE: ${contract.content}
UNBILLED TIME LOGS: [...]
`;
```

**Why**: Gives Claude enough context to generate accurate invoices without user re-typing project details. Data flows from Contracts → Invoices automatically.

---

## Build Order Rationale

### Week 1: Infrastructure + InvoiceAI First
**Why**: 
- Invoices have most moving parts (DB + AI + Stripe + PDF)
- Building invoice flow validates entire architecture
- Early Stripe integration catches payment issues

### Week 2: ProposalAI + CRUD
**Why**:
- Proposals feed into Contracts (data flow validation)
- CRUD for projects/clients needed by all modules

### Week 3: ContractAI + Client Portal
**Why**:
- Contracts reference proposals (context passing)
- Portal displays contracts + invoices (integration test)

### Week 4: PaymentAI + EmailAI + Webhooks
**Why**:
- Requires working invoices (from W1)
- Cron + webhooks are complex (need time for debugging)

### Week 5-6: BioAI, JobPostAI, TimeTrackAI, Polish
**Why**:
- Lower priority features (can launch without)
- Polish requires all modules complete

---

## Alternative Approaches Considered

### 1. Microservices Architecture
**Rejected Because**:
- Overkill for single team
- Adds complexity (API gateway, service mesh)
- Harder to maintain data consistency

**Chosen**: Monolithic Next.js app with modular structure

### 2. GraphQL API
**Rejected Because**:
- Supabase provides auto-generated REST API
- GraphQL adds build step + schema duplication
- Overkill for CRUD operations

**Chosen**: Supabase PostgREST + Netlify Functions for custom logic

### 3. Separate Invoice Database
**Rejected Because**:
- Violates "no manual re-entry" principle
- JOIN complexity across databases
- Harder to maintain referential integrity

**Chosen**: Single Postgres database with foreign keys

### 4. Client Logins for Portal
**Rejected Because**:
- Friction (password resets, forgotten logins)
- Support burden (helping clients log in)
- Overkill for read-only portal

**Chosen**: UUID tokens for passwordless access

---

## Migration Path

### From Existing Tools to WorkflowAI

1. **Export client data** → CSV → Import to `clients` table
2. **Manual invoices** → Migrate to `invoices` table with `status = 'paid'`
3. **Old contracts** → Upload PDFs → Link to `documents` table
4. **Time tracking** → Import CSV → `time_logs` table with `billed = true`

### Incremental Rollout
- **Week 1-2**: Internal testing (team invoices)
- **Week 3-4**: Beta users (5-10 freelancers)
- **Week 5-6**: Public launch

---

## Future Enhancements

### Phase 2 (Post-Launch)
- **Recurring invoices**: Add `recurrence_rule` JSONB to invoices
- **Multi-currency**: Expand beyond USD (requires Stripe multi-currency setup)
- **E-signatures**: Integrate DocuSign for contract signing
- **Mobile app**: React Native wrapper for time tracking

### Phase 3 (Scale)
- **Team collaboration**: Add `team_members` table with role-based access
- **White-label**: Allow agencies to rebrand portal
- **API access**: Public REST API for integrations

---

## Monitoring & Debugging

### Key Metrics
1. **AI Usage**: Track tokens/$ per user (for tiered billing)
2. **Stripe Success Rate**: Payment link → paid conversion
3. **Email Deliverability**: Resend bounce rate
4. **Function Errors**: Netlify Function failure rate

### Debug Tools
- **Supabase Logs**: SQL query performance
- **Netlify Function Logs**: Server errors + latency
- **Anthropic Dashboard**: AI usage + rate limits
- **Stripe Dashboard**: Payment failures + disputes

---

## Conclusion

Every architectural choice prioritizes **data continuity** and **zero manual re-entry**. The database schema is the source of truth, with AI and Stripe as orchestration layers. This foundation scales from 1 freelancer to 1000-user agency without major rewrites.

**Core Philosophy**: Build a **workspace**, not a **toolbox**. Data flows automatically, AI reduces repetitive work, and clients get frictionless portals. This is the future of freelance software.
