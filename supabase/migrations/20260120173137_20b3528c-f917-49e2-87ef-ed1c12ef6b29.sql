-- Fix Admin Role Bootstrap Vulnerability
-- Remove the insecure bootstrap condition that allows any first user to become admin

-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Create a secure policy that ONLY allows existing admins to insert roles
-- The first admin must be assigned via Supabase Dashboard or service role
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin());