
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
      const { data, error } = await supabase
        .from('company_invitations')
        .insert([{
          email,
          company_id: companyId,
          role,
          status: 'pending'
        }])
        .select();

      if (error) {
        console.error('Error sending invitation:', error);
        toast({
          title: 'Error',
          description: 'Failed to send invitation. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setEmail('');
      setRole('Member');
      toast({
        title: 'Invitation sent!',
        description: `Invitation has been sent to ${email}`,
      });

      if (onInvitationSent) {
        onInvitationSent();
      }
    } catch (error) {
      console.error('Unexpected error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
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
