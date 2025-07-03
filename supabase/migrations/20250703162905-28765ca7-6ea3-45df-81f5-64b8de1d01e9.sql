
-- Drop the company_invitations table and related functions
DROP TABLE IF EXISTS public.company_invitations CASCADE;

-- Drop the access code validation function
DROP FUNCTION IF EXISTS public.validate_access_code(text);

-- Drop the access code generation function
DROP FUNCTION IF EXISTS public.generate_access_code();

-- Drop the invitation acceptance function
DROP FUNCTION IF EXISTS public.accept_company_invitation(text);

-- Drop any triggers related to invitations
DROP TRIGGER IF EXISTS gen_invite_token_trigger ON public.company_invitations;
DROP FUNCTION IF EXISTS public.gen_invite_token();
