
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { sendInviteEmail } from '@/libs/email';

interface CompanyInviteFormProps {
  companyId: string;
  onInvitationSent?: () => void;
}

const CompanyInviteForm: React.FC<CompanyInviteFormProps> = ({ companyId, onInvitationSent }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = uuidv4();

      const { error } = await supabase
        .from('company_invitations')
        .insert([{ email, company_id: companyId, role, status: 'pending', token }]);

      if (error) throw error;

      const sent = await sendInviteEmail(email, token);
      if (!sent) {
        toast({ 
          title: 'Warning', 
          description: 'Invitation saved but email not sent', 
          variant: 'destructive' 
        });
        return;
      }

      toast({ 
        title: 'Invitation sent!', 
        description: `Invitation sent to ${email}` 
      });
      
      setEmail('');
      setRole('Member');
      
      if (onInvitationSent) {
        onInvitationSent();
      }
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: 'Error', 
        description: 'Failed to send invitation', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
        <CardDescription>
          Send an invitation to join your company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              'Send Invitation'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompanyInviteForm;
