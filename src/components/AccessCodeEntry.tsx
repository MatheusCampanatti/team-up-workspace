
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key } from 'lucide-react';

interface AccessCodeEntryProps {
  onCodeValidated?: (companyId: string, role: string) => void;
}

interface ValidationResponse {
  success: boolean;
  company_id?: string;
  role?: string;
  error?: string;
}

const AccessCodeEntry: React.FC<AccessCodeEntryProps> = ({ onCodeValidated }) => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_access_code', {
        code: accessCode.trim().toUpperCase()
      });

      if (error) throw error;

      const result = data as ValidationResponse;

      if (result.success) {
        toast({
          title: 'Success!',
          description: `You've joined the company with ${result.role} role.`
        });
        
        setAccessCode('');
        
        if (onCodeValidated && result.company_id && result.role) {
          onCodeValidated(result.company_id, result.role);
        }
      } else {
        toast({
          title: 'Invalid Code',
          description: result.error || 'Invalid or already used code',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error validating access code:', error);
      toast({
        title: 'Error',
        description: 'Failed to validate access code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="h-5 w-5 mr-2" />
          Join a Company
        </CardTitle>
        <CardDescription>
          Enter an access code to join another company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={validateAccessCode} className="space-y-4">
          <div>
            <Label htmlFor="access-code">Access Code</Label>
            <Input
              id="access-code"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              maxLength={8}
              className="font-mono text-center text-lg tracking-wider"
              required
            />
          </div>

          <Button type="submit" disabled={loading || accessCode.length !== 8} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Validating...
              </>
            ) : (
              'Join Company'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AccessCodeEntry;
