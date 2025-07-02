
-- 1. Remove the insecure policy and replace with a restrictive one
DROP POLICY IF EXISTS "Anyone can view their own invitation by token" 
  ON public.company_invitations;

CREATE POLICY "Block direct select"
  ON public.company_invitations
  FOR SELECT
  USING (false);

-- 2. Create function to generate secure tokens automatically
CREATE OR REPLACE FUNCTION public.gen_invite_token()
RETURNS trigger AS $$
BEGIN
  IF NEW.token IS NULL THEN
    NEW.token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate tokens
CREATE TRIGGER trg_generate_token
  BEFORE INSERT ON public.company_invitations
  FOR EACH ROW EXECUTE FUNCTION public.gen_invite_token();

-- 3. Add composite index for performance on pending invites
CREATE INDEX idx_invitations_company_status
  ON public.company_invitations(company_id, status);
