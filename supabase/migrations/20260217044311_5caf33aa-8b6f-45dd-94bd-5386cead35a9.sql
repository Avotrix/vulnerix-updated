-- 1. Update INSERT policy to prevent self-role assignment
DROP POLICY "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles (no self)"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (is_admin() AND user_id != auth.uid());

-- 2. Update UPDATE policy to prevent self-role modification
DROP POLICY "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles (no self)"
  ON public.user_roles
  FOR UPDATE
  USING (is_admin() AND user_id != auth.uid());

-- 3. Update DELETE policy to prevent self-role removal
DROP POLICY "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles (no self)"
  ON public.user_roles
  FOR DELETE
  USING (is_admin() AND user_id != auth.uid());

-- 4. Add trigger to prevent removing the last admin
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'admin' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER check_last_admin
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_removal();
