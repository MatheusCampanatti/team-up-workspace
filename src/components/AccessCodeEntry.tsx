
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, CheckCircle, Building2 } from 'lucide-react';
import CompanyUsers from './CompanyUsers';

interface AccessCodeEntryProps {
  onCodeValidated?: (companyId: string, role: string) => void;
}

interface ValidationResponse {
  success: boolean;
  company_id?: string;
  role?: string;
  error?: string;
}

interface CompanyInfo {
  id: string;
  name: string;
}

const AccessCodeEntry: React.FC<AccessCodeEntryProps> = ({ onCodeValidated }) => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatedCompany, setValidatedCompany] = useState<CompanyInfo | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const { toast } = useToast();

  const validateAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setLoading(true);
    try {
      console.log('Validating access code:', accessCode.trim().toUpperCase());
      
      const { data, error } = await supabase.rpc('validate_access_code', {
        code: accessCode.trim().toUpperCase()
      });

      if (error) {
        console.error('RPC call error:', error);
        throw error;
      }

      console.log('Validation response:', data);

      // Properly handle the response with type safety
      let result: ValidationResponse;
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Cast to unknown first, then to ValidationResponse for proper type conversion
        const unknownData = data as unknown;
        result = unknownData as ValidationResponse;
      } else {
        result = { success: false, error: 'Invalid response format' };
      }

      if (result.success && result.company_id && result.role) {
        // Fetch company information
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name')
          .eq('id', result.company_id)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
          throw companyError;
        }

        setValidatedCompany(companyData);
        setUserRole(result.role);
        
        toast({
          title: 'Success!',
          description: `You've joined ${companyData.name} with ${result.role} role.`
        });
        
        setAccessCode('');
        
        if (onCodeValidated) {
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

  const resetForm = () => {
    setAccessCode('');
    setValidatedCompany(null);
    setUserRole('');
  };

  // If we have a validated company, show the success state and company users
  if (validatedCompany) {
    return (
      <div className="space-y-6">
        {/* Success Card */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-900">
              <CheckCircle className="h-5 w-5 mr-2" />
              Successfully Joined Company!
            </CardTitle>
            <CardDescription className="text-green-700">
              You have been added to {validatedCompany.name} with {userRole} role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-900">{validatedCompany.name}</h3>
                  <p className="text-sm text-green-700">Your role: {userRole}</p>
                </div>
              </div>
              <Button onClick={resetForm} variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                Join Another Company
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Company Users List */}
        <CompanyUsers 
          companyId={validatedCompany.id} 
          companyName={validatedCompany.name}
        />
      </div>
    );
  }

  // Default access code entry form
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
