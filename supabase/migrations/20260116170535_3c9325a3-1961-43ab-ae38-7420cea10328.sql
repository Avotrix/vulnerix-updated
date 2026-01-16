-- Remove password column from user_access (authentication handled by built-in auth)
ALTER TABLE public.user_access DROP COLUMN IF EXISTS pass;

-- Update RLS policies to use auth.uid() for user_access
DROP POLICY IF EXISTS "Users can view own access record" ON public.user_access;
DROP POLICY IF EXISTS "Users can update own access record" ON public.user_access;

-- Allow users to view their own access record (by auth.uid() or email from JWT)
CREATE POLICY "Users can view own access record"
ON public.user_access
FOR SELECT
USING (
  auth.uid()::text = user_id::text 
  OR (auth.jwt() ->> 'email') = user_email_id
);

-- Allow authenticated users to insert their own access record
CREATE POLICY "Users can insert own access record"
ON public.user_access
FOR INSERT
WITH CHECK (
  auth.uid()::text = user_id::text 
  AND (auth.jwt() ->> 'email') = user_email_id
);

-- Allow users to update their own access record
CREATE POLICY "Users can update own access record"
ON public.user_access
FOR UPDATE
USING (auth.uid()::text = user_id::text);