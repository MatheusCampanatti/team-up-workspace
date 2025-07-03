
-- Update company_invitations table to support access codes for specific users
ALTER TABLE public.company_invitations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMP WITH TIME ZONE;

-- Update the role column to use the new role values
ALTER TABLE public.company_invitations 
ALTER COLUMN role SET DEFAULT 'Member';

-- Add check constraint for role values
ALTER TABLE public.company_invitations 
ADD CONSTRAINT check_role_values 
CHECK (role IN ('Admin', 'Member', 'Viewer'));

-- Update user_company_roles table to include the new role values
ALTER TABLE public.user_company_roles 
ADD CONSTRAINT check_user_role_values 
CHECK (role IN ('Admin', 'Member', 'Viewer'));

-- Create function to generate access codes
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    code TEXT;
BEGIN
    -- Generate a random 8-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    RETURN code;
END;
$$;

-- Create function to validate and use access code
CREATE OR REPLACE FUNCTION public.validate_access_code(code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record RECORD;
    user_id UUID;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not authenticated');
    END IF;
    
    -- Find the invitation record
    SELECT * INTO invitation_record
    FROM public.company_invitations
    WHERE access_code = code 
    AND user_id = auth.uid()
    AND validated = FALSE
    AND (expiration_date IS NULL OR expiration_date > NOW());
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or already used code');
    END IF;
    
    -- Check if user already belongs to this company
    IF EXISTS (
        SELECT 1 FROM public.user_company_roles
        WHERE user_id = auth.uid()
        AND company_id = invitation_record.company_id
    ) THEN
        RETURN json_build_object('success', false, 'error', 'You already belong to this company');
    END IF;
    
    -- Add user to company with specified role
    INSERT INTO public.user_company_roles (user_id, company_id, role)
    VALUES (auth.uid(), invitation_record.company_id, invitation_record.role);
    
    -- Mark invitation as validated
    UPDATE public.company_invitations
    SET validated = TRUE
    WHERE id = invitation_record.id;
    
    RETURN json_build_object(
        'success', true, 
        'company_id', invitation_record.company_id,
        'role', invitation_record.role
    );
END;
$$;

-- Update RLS policies for company_invitations to work with access codes
DROP POLICY IF EXISTS "Admins can view invitations for their companies" ON public.company_invitations;
DROP POLICY IF EXISTS "Admins can create invitations for their companies" ON public.company_invitations;
DROP POLICY IF EXISTS "Admins can update invitations for their companies" ON public.company_invitations;
DROP POLICY IF EXISTS "Block direct select" ON public.company_invitations;

-- New RLS policies for access code system
CREATE POLICY "Admins can view invitations for their companies" 
ON public.company_invitations 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_company_roles ucr
        WHERE ucr.company_id = company_invitations.company_id 
        AND ucr.user_id = auth.uid()
        AND ucr.role = 'Admin'
    )
);

CREATE POLICY "Admins can create invitations for their companies" 
ON public.company_invitations 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_company_roles ucr
        WHERE ucr.company_id = company_invitations.company_id 
        AND ucr.user_id = auth.uid()
        AND ucr.role = 'Admin'
    )
);

CREATE POLICY "Admins can update invitations for their companies" 
ON public.company_invitations 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_company_roles ucr
        WHERE ucr.company_id = company_invitations.company_id 
        AND ucr.user_id = auth.uid()
        AND ucr.role = 'Admin'
    )
);

CREATE POLICY "Users can view their own access codes" 
ON public.company_invitations 
FOR SELECT 
USING (user_id = auth.uid());
