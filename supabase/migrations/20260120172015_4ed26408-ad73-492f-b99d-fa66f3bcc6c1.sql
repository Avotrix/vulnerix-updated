-- Fix MISSING_RLS: Add DELETE policy for user_access table (GDPR compliance)
-- This allows users to delete their own account records

CREATE POLICY "Users can delete own account"
ON public.user_access
FOR DELETE
USING (auth.uid()::text = user_id::text);