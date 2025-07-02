
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, Clock, X } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface PendingInvitationsProps {
  companyId: string;
  companyName: string;
  onInvitationUpdated?: () => void;
}

const PendingInvitations = ({ companyId, companyName, onInvitationUpdated }: PendingInvitationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    if (!user) return;

    console.log('Fetching invitations for company:', companyId);
    
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('id, email, role, status, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        throw error;
      }

      console.log('Invitations data:', data);
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error in fetchInvitations:', error);
      toast({
        title: 'Error loading invitations',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('company_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) {
        console.error('Error cancelling invitation:', error);
        throw error;
      }

      toast({
        title: 'Invitation cancelled',
        description: `The invitation to ${email} has been cancelled.`
      });

      fetchInvitations();
      onInvitationUpdated?.();
    } catch (error: any) {
      console.error('Error in cancelInvitation:', error);
      toast({
        title: 'Error cancelling invitation',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [user, companyId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading invitations...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          Invitations sent to join {companyName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingInvitations.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Mail className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No pending invitations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{invitation.email}</span>
                    <Badge variant="secondary">{invitation.role}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Sent {new Date(invitation.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelInvitation(invitation.id, invitation.email)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
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
