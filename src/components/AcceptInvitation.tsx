
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Key } from 'lucide-react';

const AcceptInvitation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token.trim()) return;

    setIsLoading(true);
    console.log('Accepting invitation with token:', token);

    try {
      const { data, error } = await supabase.rpc('accept_company_invitation', {
        invitation_token: token.trim()
      });

      if (error) {
        console.error('Error accepting invitation:', error);
        throw error;
      }

      console.log('Accept invitation response:', data);

      if (data && data.success) {
        toast({
          title: 'Invitation accepted!',
          description: 'You have successfully joined the company.'
        });
        
        // Redirect to the company's boards page
        navigate(`/company/${data.company_id}/boards`);
      } else {
        throw new Error(data?.error || 'Failed to accept invitation');
      }
    } catch (error: any) {
      console.error('Error in handleAcceptInvitation:', error);
      toast({
        title: 'Error accepting invitation',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>
            You need to sign in to accept an invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/auth')} className="w-full">
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserCheck className="h-5 w-5 mr-2" />
          Accept Invitation
        </CardTitle>
        <CardDescription>
          Enter your invitation token to join a company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAcceptInvitation} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Invitation Token</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="token"
                type="text"
                placeholder="Enter invitation token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AcceptInvitation;
