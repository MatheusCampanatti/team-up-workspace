
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check } from 'lucide-react';

interface AccessCodeGeneratorProps {
  companyId: string;
  onCodeGenerated?: () => void;
}

const AccessCodeGenerator: React.FC<AccessCodeGeneratorProps> = ({ companyId, onCodeGenerated }) => {
  const [selectedRole, setSelectedRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate secure random 8-character hexadecimal access code
  const generateSecureAccessCode = (): string => {
    const array = new Uint8Array(4); // 4 bytes = 8 hex characters
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0').toUpperCase()).join('');
  };

  const generateAccessCode = async () => {
    setLoading(true);
    console.log('Generating access code for company:', companyId);
    
    try {
      // Generate secure random access code
      const accessCode = generateSecureAccessCode();
      console.log('Generated access code:', accessCode);

      // Check if this access code already exists (very unlikely but good to check)
      const { data: existingCode, error: checkError } = await supabase
        .from('company_invitations')
        .select('access_code')
        .eq('access_code', accessCode)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing access code:', checkError);
        throw checkError;
      }

      if (existingCode) {
        // Extremely unlikely, but regenerate if code exists
        console.log('Access code already exists, regenerating...');
        generateAccessCode(); // Retry
        return;
      }

      // Insert the invitation with all required columns
      const { error: insertError } = await supabase
        .from('company_invitations')
        .insert([{
          company_id: companyId,
          user_id: null, // Not tied to a specific user
          email: '', // Not tied to a specific email
          access_code: accessCode,
          role: selectedRole,
          status: 'pending',
          token: '', // Required field for other invitation types
          validated: false,
          expiration_date: null
        }]);

      if (insertError) {
        console.error('Error inserting invitation:', insertError);
        throw insertError;
      }

      setGeneratedCode(accessCode);
      toast({
        title: 'Access code generated!',
        description: `Access code created for ${selectedRole} role.`
      });

      if (onCodeGenerated) {
        onCodeGenerated();
      }
    } catch (error: any) {
      console.error('Error generating access code:', error);
      toast({
        title: 'Error generating code',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Access code copied to clipboard'
      });
    }
  };

  const resetForm = () => {
    setSelectedRole('Member');
    setGeneratedCode(null);
    setCopied(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Access Code</CardTitle>
        <CardDescription>
          Create a unique access code that anyone can use to join your company
        </CardDescription>
      </CardHeader>
      <CardContent>
        {generatedCode ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Access Code Generated!</h3>
              <div className="mb-3 text-sm text-green-800">
                <p><strong>Role:</strong> {selectedRole}</p>
                <p><strong>Usage:</strong> Anyone can use this code to join the company</p>
              </div>
              <div className="flex items-center space-x-2">
                <code className="bg-white px-3 py-2 rounded border font-mono text-lg tracking-wider">
                  {generatedCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-green-700 mt-2">
                Share this code with anyone you want to join your company with {selectedRole} role.
              </p>
            </div>
            <Button onClick={resetForm} variant="outline" className="w-full">
              Generate Another Code
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Role for new members</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateAccessCode} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                'Generate Access Code'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessCodeGenerator;
