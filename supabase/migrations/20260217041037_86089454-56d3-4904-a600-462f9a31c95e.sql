-- Fix: Restrict admin_settings SELECT to admins only
DROP POLICY "Authenticated users can read settings" ON public.admin_settings;
CREATE POLICY "Only admins can read settings"
  ON public.admin_settings
  FOR SELECT
  USING (is_admin());

-- Fix: Add explicit DELETE policy restricted to admins
CREATE POLICY "Only admins can delete settings"
  ON public.admin_settings
  FOR DELETE
  USING (is_admin());
