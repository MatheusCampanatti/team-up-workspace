
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Trash2, Clock } from 'lucide-react';

interface PendingAccessCodesProps {
  companyId: string;
}

interface AccessCodeInvitation {
  id: string;
  access_code: string;
  email: string;
  role: string;
  validated: boolean;
  created_at: string;
  user_id: string;
}

const PendingAccessCodes: React.FC<PendingAccessCodesProps> = ({ companyId }) => {
  const [invitations, setInvitations] = useState<AccessCodeInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccessCodes();
  }, [companyId]);

  const fetchAccessCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('id, access_code, email, role, validated, created_at, user_id')
        .eq('company_id', companyId)
        .not('access_code', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error fetching access codes:', error);
      toast({
        title: 'Error loading access codes',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: 'Copied!',
      description: 'Access code copied to clipboard'
    });
  };

  const deleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('company_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Access code deleted',
        description: 'The access code has been removed'
      });

      fetchAccessCodes();
    } catch (error: any) {
      console.error('Error deleting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete access code',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Access Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Access Codes</CardTitle>
        <CardDescription>
          Manage access codes generated for users
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending access codes</h3>
            <p className="text-gray-600">
              Generate access codes for users to join your company
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-medium">{invitation.email}</span>
                    <Badge variant={invitation.validated ? "default" : "secondary"}>
                      {invitation.role}
                    </Badge>
                    <Badge variant={invitation.validated ? "default" : "outline"}>
                      {invitation.validated ? "Used" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {invitation.access_code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(invitation.access_code)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedCode === invitation.access_code ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {new Date(invitation.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteInvitation(invitation.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingAccessCodes;
