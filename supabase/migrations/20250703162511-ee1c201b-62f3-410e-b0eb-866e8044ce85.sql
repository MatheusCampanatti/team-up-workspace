
-- Add new columns to the companies table
ALTER TABLE public.companies 
ADD COLUMN member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN member_role TEXT CHECK (member_role IN ('Admin', 'Member', 'Viewer')) DEFAULT 'Member';

-- Add index for better performance on member lookups
CREATE INDEX IF NOT EXISTS idx_companies_member_user_id ON public.companies(member_user_id);

-- Update RLS policies to account for the new columns
DROP POLICY IF EXISTS "Users can view their companies" ON public.companies;

CREATE POLICY "Users can view their companies" 
  ON public.companies 
  FOR SELECT 
  USING (
    (id IN ( SELECT user_company_roles.company_id
     FROM user_company_roles
    WHERE (user_company_roles.user_id = auth.uid()))) 
    OR (created_by = auth.uid())
    OR (member_user_id = auth.uid())
  );
