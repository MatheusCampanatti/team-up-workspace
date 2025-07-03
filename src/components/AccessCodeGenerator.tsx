
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [userEmail, setUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [foundUser, setFoundUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate secure random 8-character hexadecimal access code
  const generateSecureAccessCode = (): string => {
    const array = new Uint8Array(4); // 4 bytes = 8 hex characters
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0').toUpperCase()).join('');
  };

  const generateAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim()) return;

    setLoading(true);
    const emailToSearch = userEmail.trim().toLowerCase();
    console.log('Searching for user with email:', emailToSearch);
    
    try {
      // Query the profiles table - check if email exists (case insensitive)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .ilike('email', emailToSearch)
        .maybeSingle();

      console.log('Profile query result:', { profiles, profileError });

      if (profileError) {
        console.error('Database error:', profileError);
        toast({
          title: 'Database error',
          description: 'There was an error checking the user email. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      if (!profiles) {
        console.log('No user found with email:', emailToSearch);
        toast({
          title: 'Email not registered',
          description: 'Please ensure the email is correct and the user has registered on the platform.',
          variant: 'destructive'
        });
        return;
      }

      console.log('Found user:', profiles);
      setFoundUser(profiles);

      // Check if user already belongs to this company
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_company_roles')
        .select('role')
        .eq('user_id', profiles.id)
        .eq('company_id', companyId)
        .maybeSingle();

      console.log('Existing role check:', { existingRole, roleCheckError });

      if (existingRole) {
        toast({
          title: 'User already in company',
          description: `This user is already a ${existingRole.role} in your company.`,
          variant: 'destructive'
        });
        return;
      }

      // Check if there's already a pending access code for this user
      const { data: existingInvitation, error: invitationCheckError } = await supabase
        .from('company_invitations')
        .select('access_code')
        .eq('user_id', profiles.id)
        .eq('company_id', companyId)
        .eq('validated', false)
        .maybeSingle();

      console.log('Existing invitation check:', { existingInvitation, invitationCheckError });

      if (existingInvitation) {
        toast({
          title: 'Code already exists',
          description: `There's already a pending access code for this user: ${existingInvitation.access_code}`,
          variant: 'destructive'
        });
        return;
      }

      // Generate secure random access code
      const accessCode = generateSecureAccessCode();
      console.log('Generated access code:', accessCode);

      // Insert the invitation with all required columns
      const { error: insertError } = await supabase
        .from('company_invitations')
        .insert([{
          company_id: companyId,
          user_id: profiles.id,
          email: profiles.email,
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
        description: `Access code created for ${profiles.name || profiles.email}.`
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
    setUserEmail('');
    setSelectedRole('Member');
    setGeneratedCode(null);
    setFoundUser(null);
    setCopied(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Access Code</CardTitle>
        <CardDescription>
          Create a unique access code for a specific user to join your company
        </CardDescription>
      </CardHeader>
      <CardContent>
        {generatedCode ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Access Code Generated!</h3>
              {foundUser && (
                <div className="mb-3 text-sm text-green-800">
                  <p><strong>User:</strong> {foundUser.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {foundUser.email}</p>
                  <p><strong>Role:</strong> {selectedRole}</p>
                </div>
              )}
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
                Share this code with the user so they can join your company.
              </p>
            </div>
            <Button onClick={resetForm} variant="outline" className="w-full">
              Generate Another Code
            </Button>
          </div>
        ) : (
          <form onSubmit={generateAccessCode} className="space-y-4">
            <div>
              <Label htmlFor="user-email">User Email</Label>
              <Input
                id="user-email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Enter user's email address"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
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

            <Button type="submit" disabled={loading || !userEmail.trim()} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                'Generate Access Code'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessCodeGenerator;
