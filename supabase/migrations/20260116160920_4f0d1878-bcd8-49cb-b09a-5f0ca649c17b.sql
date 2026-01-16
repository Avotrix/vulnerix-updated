-- Table 1: userAccess - Authentication
CREATE TABLE public.user_access (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email_id TEXT UNIQUE NOT NULL,
  pass TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 2: userSettings - Notification preferences
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_access(user_id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  email_id TEXT NOT NULL,
  notification_level TEXT DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(org_name, email_id)
);

-- Table 3: techStack - User-uploaded technology inventory
CREATE TABLE public.tech_stack (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor TEXT NOT NULL,
  product_name TEXT NOT NULL,
  version TEXT,
  org_name TEXT NOT NULL,
  email_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table 4: techStackResults - Correlated vulnerability intelligence
CREATE TABLE public.tech_stack_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor TEXT NOT NULL,
  product_name TEXT NOT NULL,
  version TEXT,
  org_name TEXT NOT NULL,
  email_id TEXT NOT NULL,
  cve_match TEXT,
  severity_cve TEXT,
  cert_in TEXT,
  severity_cert_in TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_stack_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_access (users can only access their own record)
CREATE POLICY "Users can view own access record"
  ON public.user_access FOR SELECT
  USING (auth.uid()::text = user_id::text OR auth.jwt() ->> 'email' = user_email_id);

CREATE POLICY "Users can update own access record"
  ON public.user_access FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- RLS Policies for user_settings (org-based isolation)
CREATE POLICY "Users can view own org settings"
  ON public.user_settings FOR SELECT
  USING (auth.jwt() ->> 'email' = email_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = email_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.jwt() ->> 'email' = email_id);

-- RLS Policies for tech_stack (org-based isolation, no cross-org access)
CREATE POLICY "Users can view own org tech stack"
  ON public.tech_stack FOR SELECT
  USING (auth.jwt() ->> 'email' = email_id);

CREATE POLICY "Users can insert own org tech stack"
  ON public.tech_stack FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = email_id);

CREATE POLICY "Users can update own org tech stack"
  ON public.tech_stack FOR UPDATE
  USING (auth.jwt() ->> 'email' = email_id);

CREATE POLICY "Users can delete own org tech stack"
  ON public.tech_stack FOR DELETE
  USING (auth.jwt() ->> 'email' = email_id);

-- RLS Policies for tech_stack_results (org-based isolation)
CREATE POLICY "Users can view own org results"
  ON public.tech_stack_results FOR SELECT
  USING (auth.jwt() ->> 'email' = email_id);

CREATE POLICY "Users can insert own org results"
  ON public.tech_stack_results FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = email_id);

CREATE POLICY "Users can update own org results"
  ON public.tech_stack_results FOR UPDATE
  USING (auth.jwt() ->> 'email' = email_id);

-- Create indexes for common query patterns
CREATE INDEX idx_tech_stack_org ON public.tech_stack(org_name, email_id);
CREATE INDEX idx_tech_stack_results_org ON public.tech_stack_results(org_name, email_id);
CREATE INDEX idx_tech_stack_results_severity ON public.tech_stack_results(severity_cve, severity_cert_in);