
-- Drop the problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage roles in their companies" ON public.user_company_roles;
DROP POLICY IF EXISTS "Users can create company roles for themselves" ON public.user_company_roles;
DROP POLICY IF EXISTS "Users can view their own company roles" ON public.user_company_roles;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.user_is_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_company_roles 
    WHERE user_id = _user_id 
    AND company_id = _company_id 
    AND role = 'Admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_company_roles 
    WHERE user_id = _user_id 
    AND company_id = _company_id
  );
$$;

-- Recreate RLS policies using security definer functions
CREATE POLICY "Users can view their own company roles" 
  ON public.user_company_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create company roles for themselves" 
  ON public.user_company_roles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles in their companies" 
  ON public.user_company_roles 
  FOR ALL 
  USING (
    auth.uid() = user_id OR 
    public.user_is_company_admin(auth.uid(), company_id)
  );

-- Also update the companies table policy to use the security definer function
DROP POLICY IF EXISTS "Admins can update their companies" ON public.companies;

CREATE POLICY "Admins can update their companies" 
  ON public.companies 
  FOR UPDATE 
  USING (public.user_is_company_admin(auth.uid(), id));
