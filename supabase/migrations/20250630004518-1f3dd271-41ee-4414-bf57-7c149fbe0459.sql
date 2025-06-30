
-- First, let's completely drop all existing policies and start fresh
DROP POLICY IF EXISTS "Users can view companies they belong to" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can update their companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company roles" ON public.user_company_roles;
DROP POLICY IF EXISTS "Users can create company roles for themselves" ON public.user_company_roles;
DROP POLICY IF EXISTS "Admins can manage roles in their companies" ON public.user_company_roles;

-- Drop existing functions to recreate them properly
DROP FUNCTION IF EXISTS public.user_is_company_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.user_belongs_to_company(uuid, uuid);

-- Create a simple, non-recursive security definer function to check admin status
CREATE OR REPLACE FUNCTION public.check_user_is_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_company_roles 
    WHERE user_id = _user_id 
    AND company_id = _company_id 
    AND role = 'Admin'
  );
END;
$$;

-- Create simple RLS policies for user_company_roles table
CREATE POLICY "Users can view their own roles" 
  ON public.user_company_roles 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own roles" 
  ON public.user_company_roles 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own roles" 
  ON public.user_company_roles 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own roles" 
  ON public.user_company_roles 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Create simple RLS policies for companies table
CREATE POLICY "Users can view their companies" 
  ON public.companies 
  FOR SELECT 
  USING (
    id IN (
      SELECT company_id FROM public.user_company_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create companies" 
  ON public.companies 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update companies" 
  ON public.companies 
  FOR UPDATE 
  USING (public.check_user_is_admin(auth.uid(), id));
