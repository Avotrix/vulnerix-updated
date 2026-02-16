-- Add email_list column to tech_stack for storing comma-separated notification emails
ALTER TABLE public.tech_stack ADD COLUMN IF NOT EXISTS email_list text;