
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Invitation } from '@/types/invitations';

interface PendingInvitationsProps {
  companyId: string;
  refreshTrigger?: number;
}

const PendingInvitations: React.FC<PendingInvitationsProps> = ({ companyId, refreshTrigger }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInvitations = async () => {
    setLoading(true);
    console.log('Fetching invitations for company:', companyId);

    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        return;
      }

      console.log('Fetched invitations:', data);
      setInvitations(data || []);
    } catch (error) {
      console.error('Unexpected error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [companyId, refreshTrigger]);

  const handleCancelInvitation = async (invitationId: string) => {
    setDeletingId(invitationId);

    try {
      const { error } = await supabase
        .from('company_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error cancelling invitation:', error);
        toast({
          title: 'Error',
          description: 'Failed to cancel invitation',
          variant: 'destructive',
        });
        return;
      }

      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled successfully',
      });
    } catch (error) {
      console.error('Unexpected error cancelling invitation:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Manage pending team invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>
          Manage pending team invitations ({invitations.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No pending invitations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{invitation.email}</span>
                    <Badge variant="secondary">{invitation.role}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Invited {new Date(invitation.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelInvitation(invitation.id)}
                  disabled={deletingId === invitation.id}
                >
                  {deletingId === invitation.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingInvitations;
