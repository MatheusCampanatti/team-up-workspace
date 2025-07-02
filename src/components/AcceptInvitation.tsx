import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  const handleAcceptInvitation = async () => {
    if (!token) {
      setError('Invalid invitation token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.rpc(
        'accept_company_invitation',
        { invitation_token: token }
      );

      if (functionError) {
        console.error('Error accepting invitation:', functionError);
        setError('Failed to accept invitation');
        return;
      }

      if (data && typeof data === 'object' && 'success' in data) {
        if (data.success) {
          setAccepted(true);
          toast({
            title: 'Invitation accepted!',
            description: 'You have successfully joined the company.',
          });
          
          setTimeout(() => {
            navigate(`/company/${String(data.company_id)}/boards`);
          }, 2000);
        } else {
          setError(String(data.error) || 'Failed to accept invitation');
        }
      } else {
        setError('Unexpected response from server');
      }
    } catch (error) {
      console.error('Unexpected error accepting invitation:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 text-center">
            This invitation link is invalid or has expired.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (accepted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Accepted!</h2>
          <p className="text-gray-600 text-center mb-4">
            You have successfully joined the company. Redirecting to the dashboard...
          </p>
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-gray-500">Redirecting...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept Company Invitation</CardTitle>
        <CardDescription>
          You have been invited to join a company. Click the button below to accept the invitation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
          
          <Button 
            onClick={handleAcceptInvitation} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Accepting...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AcceptInvitation;
