
-- Update the validate_access_code function to work with codes not tied to specific users
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
    
    -- Find the invitation record (not tied to specific user anymore)
    SELECT * INTO invitation_record
    FROM public.company_invitations
    WHERE access_code = code 
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
