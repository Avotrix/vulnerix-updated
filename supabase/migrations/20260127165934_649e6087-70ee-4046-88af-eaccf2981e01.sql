-- RLS HARDENING: Ensure audit logs are immutable (no delete, no update)
-- Note: RLS is already enabled and policies exist, but we'll ensure DELETE and UPDATE are blocked

-- Drop existing policies if they exist and recreate for completeness
DROP POLICY IF EXISTS "no_delete_logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "no_update_logs" ON admin_audit_logs;

-- Create immutability policies for admin_audit_logs
CREATE POLICY "no_delete_logs" ON admin_audit_logs FOR DELETE USING (false);
CREATE POLICY "no_update_logs" ON admin_audit_logs FOR UPDATE USING (false);

-- RLS HARDENING: Prevent deletion of intelligence data from tech_stack_results
DROP POLICY IF EXISTS "no_delete_results" ON tech_stack_results;
CREATE POLICY "no_delete_results" ON tech_stack_results FOR DELETE USING (false);