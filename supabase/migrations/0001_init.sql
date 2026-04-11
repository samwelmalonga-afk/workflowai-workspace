-- WorkflowAI Workspace - Initial Schema Migration
-- RLS enabled on all tables for multi-tenancy
-- Portal access via UUID tokens for client-facing views

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
-- Extends Supabase auth.users with workspace-specific fields
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  
  -- Legal compliance
  contract_disclaimer_accepted_at TIMESTAMPTZ,
  terms_accepted_at TIMESTAMPTZ,
  
  -- Billing
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')),
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'pro', 'agency')),
  
  -- Settings
  default_currency TEXT DEFAULT 'USD',
  default_payment_terms INTEGER DEFAULT 30, -- days
  default_late_fee_percentage DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- CLIENTS TABLE
-- =====================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Client info
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  phone TEXT,
  address TEXT,
  
  -- Portal access
  portal_token UUID UNIQUE DEFAULT uuid_generate_v4(),
  portal_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  avatar_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT clients_user_name_unique UNIQUE(user_id, name)
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clients"
  ON clients FOR ALL
  USING (auth.uid() = user_id);

-- Public read for client portal
CREATE POLICY "Public can view via portal token"
  ON clients FOR SELECT
  USING (portal_enabled = true);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_portal_token ON clients(portal_token);

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Project details
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'proposal_sent', 'negotiating', 'active', 'completed', 'cancelled')),
  
  -- Financial
  budget_amount DECIMAL(12,2),
  budget_currency TEXT DEFAULT 'USD',
  billing_type TEXT CHECK (billing_type IN ('fixed', 'hourly', 'retainer')),
  hourly_rate DECIMAL(10,2),
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Metadata
  tags TEXT[],
  color TEXT, -- for UI categorization
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id);

-- Public read for client portal (joins with clients.portal_token)
CREATE POLICY "Public can view projects via client portal"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = projects.client_id 
      AND clients.portal_enabled = true
    )
  );

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
-- Stores proposals, contracts, and other generated documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Document metadata
  type TEXT NOT NULL CHECK (type IN ('proposal', 'contract', 'invoice', 'bio', 'job_post', 'email', 'other')),
  title TEXT NOT NULL,
  content TEXT, -- JSON or markdown content
  
  -- Version control
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- File storage
  pdf_url TEXT, -- Supabase Storage URL
  pdf_storage_path TEXT,
  
  -- AI generation metadata
  ai_prompt TEXT,
  ai_model TEXT,
  ai_tokens_used INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
  ON documents FOR ALL
  USING (auth.uid() = user_id);

-- Public read for client portal
CREATE POLICY "Public can view documents via client portal"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = documents.client_id 
      AND clients.portal_enabled = true
    )
  );

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  
  -- Invoice numbering
  invoice_number TEXT NOT NULL,
  
  -- Financial
  subtotal DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Line items (JSON array)
  line_items JSONB NOT NULL DEFAULT '[]',
  
  -- Payment
  payment_terms INTEGER DEFAULT 30, -- days
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  
  -- Stripe integration
  stripe_payment_link_id TEXT,
  stripe_payment_link_url TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  sent_at TIMESTAMPTZ,
  
  -- Reminders
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT invoices_user_number_unique UNIQUE(user_id, invoice_number)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices"
  ON invoices FOR ALL
  USING (auth.uid() = user_id);

-- Public read for client portal
CREATE POLICY "Public can view invoices via client portal"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = invoices.client_id 
      AND clients.portal_enabled = true
    )
  );

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_overdue ON invoices(due_date) WHERE status IN ('sent', 'viewed') AND paid_at IS NULL;

-- =====================================================
-- TIME_LOGS TABLE
-- =====================================================
-- For time tracking and hourly billing
CREATE TABLE time_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Time tracking
  description TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- calculated or manual
  
  -- Billing
  billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  billed BOOLEAN DEFAULT false,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Metadata
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own time logs"
  ON time_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX idx_time_logs_project_id ON time_logs(project_id);
CREATE INDEX idx_time_logs_billable ON time_logs(billable) WHERE billable = true AND billed = false;

-- =====================================================
-- ACTIVITIES TABLE
-- =====================================================
-- Audit log for all important actions
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Activity details
  type TEXT NOT NULL, -- 'invoice.created', 'email.sent', 'contract.accepted', etc.
  description TEXT NOT NULL,
  metadata JSONB,
  
  -- Related entities
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_type ON activities(type);

-- =====================================================
-- PROMPTS TABLE
-- =====================================================
-- User-customizable AI prompts for each module
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Prompt metadata
  module TEXT NOT NULL CHECK (module IN ('proposal', 'contract', 'invoice', 'email', 'bio', 'job_post')),
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  variables JSONB, -- expected variables for template
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT prompts_user_module_name_unique UNIQUE(user_id, module, name)
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own prompts"
  ON prompts FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_module ON prompts(module);

-- =====================================================
-- AI_USAGE TABLE
-- =====================================================
-- Track AI API usage for billing and analytics
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- API call metadata
  module TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  
  -- Cost tracking
  estimated_cost_usd DECIMAL(10,6),
  
  -- Request details
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Related entities
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX idx_ai_usage_module ON ai_usage(module);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_logs_updated_at BEFORE UPDATE ON time_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update invoice status based on due_date
CREATE OR REPLACE FUNCTION update_invoice_status_on_overdue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('sent', 'viewed') 
     AND NEW.paid_at IS NULL 
     AND NEW.due_date < CURRENT_DATE THEN
    NEW.status = 'overdue';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_invoice_overdue BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_invoice_status_on_overdue();

-- =====================================================
-- STORAGE BUCKETS (Run via Supabase Dashboard or JS)
-- =====================================================
-- These are created via Supabase Storage API, not SQL:
-- 1. documents-pdf (public read, authenticated write)
-- 2. user-avatars (public read, authenticated write)
-- 3. client-files (private, user-specific RLS)

COMMENT ON TABLE users IS 'Workspace users with subscription and settings';
COMMENT ON TABLE clients IS 'Client contacts with portal access tokens';
COMMENT ON TABLE projects IS 'Projects linking clients to deliverables and invoices';
COMMENT ON TABLE documents IS 'AI-generated proposals, contracts, and documents';
COMMENT ON TABLE invoices IS 'Invoices with Stripe payment links';
COMMENT ON TABLE time_logs IS 'Time tracking for hourly projects';
COMMENT ON TABLE activities IS 'Audit log for workspace actions';
COMMENT ON TABLE prompts IS 'Custom AI prompt templates per module';
COMMENT ON TABLE ai_usage IS 'AI API usage tracking for billing';
