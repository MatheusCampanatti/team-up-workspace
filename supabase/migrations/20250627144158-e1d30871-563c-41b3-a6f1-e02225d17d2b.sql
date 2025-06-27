
-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_company_roles table for many-to-many relationship
CREATE TABLE public.user_company_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Create profiles table to store user metadata
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- RLS Policies for companies table
CREATE POLICY "Users can view companies they belong to" 
  ON public.companies 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_roles 
      WHERE user_company_roles.company_id = companies.id 
      AND user_company_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create companies" 
  ON public.companies 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update their companies" 
  ON public.companies 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_company_roles 
      WHERE user_company_roles.company_id = companies.id 
      AND user_company_roles.user_id = auth.uid()
      AND user_company_roles.role = 'Admin'
    )
  );

-- RLS Policies for user_company_roles table
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
    EXISTS (
      SELECT 1 FROM public.user_company_roles existing_roles
      WHERE existing_roles.company_id = user_company_roles.company_id 
      AND existing_roles.user_id = auth.uid()
      AND existing_roles.role = 'Admin'
    )
  );

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'name', ''),
    new.email
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
