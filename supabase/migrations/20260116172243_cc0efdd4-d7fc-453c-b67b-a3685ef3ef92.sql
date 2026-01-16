-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion in RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- RLS policies for user_roles table
-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin() OR NOT EXISTS (SELECT 1 FROM public.user_roles));

-- Only admins can update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin());

-- Only admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin());

-- Create admin_settings table for centralized admin configuration
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read admin settings (for UI config)
CREATE POLICY "Anyone can read admin settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Only admins can modify admin settings
CREATE POLICY "Admins can update settings"
ON public.admin_settings
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can insert settings"
ON public.admin_settings
FOR INSERT
WITH CHECK (public.is_admin());

-- Create admin_audit_logs table
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  page_affected TEXT NOT NULL,
  action_performed TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (public.is_admin());

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (public.is_admin());

-- Insert default admin settings row
INSERT INTO public.admin_settings (settings) VALUES ('{
  "defaultDarkMode": false,
  "primaryAccent": "#0ea5e9",
  "secondaryAccent": "#1e3a5f",
  "buttonRadius": 8,
  "fontSizeScale": 1,
  "cardShadowIntensity": 1,
  "visibleKPIs": ["totalProducts", "totalAdvisories", "criticalRisk", "overallRisk"],
  "kpiOrder": ["totalProducts", "totalAdvisories", "criticalRisk", "overallRisk"],
  "certInVisible": true,
  "nestedTilesEnabled": true,
  "announcements": [],
  "notificationSettings": {
    "companyMailId": "security@vulnerix.com",
    "templates": {
      "critical": "Critical vulnerability detected in your tech stack",
      "high": "High severity vulnerability found",
      "medium": "Medium severity advisory",
      "low": "Low severity information"
    },
    "severityWording": {
      "critical": "CRITICAL",
      "high": "HIGH",
      "medium": "MEDIUM",
      "low": "LOW"
    },
    "footerDisclaimer": "This is an automated notification from Vulnerix Security Platform."
  },
  "pageVisibility": {
    "dashboard": { "kpis": true, "charts": true, "recentAdvisories": true },
    "home": { "hero": true, "clients": true, "features": true, "testimonials": true, "cta": true },
    "advisories": { "search": true, "table": true, "filters": true },
    "techstack": { "upload": true, "manual": true, "list": true }
  },
  "homePageContent": {
    "heroText": "Protect Your Business Before Its Too Late.",
    "heroSubtext": "Real-time vulnerability monitoring and advisory intelligence for your entire technology stack.",
    "footerText": "© 2024 Vulnerix. All rights reserved."
  }
}'::jsonb);