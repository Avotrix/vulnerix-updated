-- Fix PUBLIC_DATA_EXPOSURE: Restrict admin_settings to authenticated users only
-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read admin settings" ON public.admin_settings;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can read settings"
ON public.admin_settings
FOR SELECT
USING (auth.role() = 'authenticated');