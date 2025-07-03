
import React, { useState, useEffect } from 'react';
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

interface User {
  id: string;
  email: string;
  name?: string;
}

const AccessCodeGenerator: React.FC<AccessCodeGeneratorProps> = ({ companyId, onCodeGenerated }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, name');

      if (error) throw error;

      setUsers(profiles || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error loading users',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const generateAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    try {
      // Generate access code using the database function
      const { data: codeData, error: codeError } = await supabase.rpc('generate_access_code');
      
      if (codeError) throw codeError;

      const accessCode = codeData;

      // Insert the invitation with the generated code
      const { error: insertError } = await supabase
        .from('company_invitations')
        .insert([{
          company_id: companyId,
          user_id: selectedUserId,
          access_code: accessCode,
          role: selectedRole,
          status: 'pending',
          token: '', // Required field, but not used for access codes
          email: users.find(u => u.id === selectedUserId)?.email || ''
        }]);

      if (insertError) throw insertError;

      setGeneratedCode(accessCode);
      toast({
        title: 'Access code generated!',
        description: 'The access code has been created for the selected user.'
      });

      if (onCodeGenerated) {
        onCodeGenerated();
      }
    } catch (error: any) {
      console.error('Error generating access code:', error);
      toast({
        title: 'Error generating code',
        description: error.message,
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
    setSelectedUserId('');
    setSelectedRole('Member');
    setGeneratedCode(null);
    setCopied(false);
  };

  if (loadingUsers) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading users...
          </div>
        </CardContent>
      </Card>
    );
  }

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
              <div className="flex items-center space-x-2">
                <code className="bg-white px-3 py-2 rounded border font-mono text-lg">
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
                Share this code with the selected user so they can join your company.
              </p>
            </div>
            <Button onClick={resetForm} variant="outline" className="w-full">
              Generate Another Code
            </Button>
          </div>
        ) : (
          <form onSubmit={generateAccessCode} className="space-y-4">
            <div>
              <Label htmlFor="user">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <Button type="submit" disabled={loading || !selectedUserId} className="w-full">
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
