import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, Crown, User, Eye } from 'lucide-react';

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface CompanyUsersProps {
  companyId: string;
  companyName?: string;
}

const CompanyUsers: React.FC<CompanyUsersProps> = ({ companyId, companyName }) => {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanyUsers();
  }, [companyId]);

  const fetchCompanyUsers = async () => {
    setLoading(true);
    console.log('Fetching users for company:', companyId);
    
    try {
      // First get all user roles for this company
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_company_roles')
        .select('user_id, role, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (rolesError) {
        console.error('Error fetching company roles:', rolesError);
        throw rolesError;
      }

      console.log('Company roles data:', rolesData);

      if (!rolesData || rolesData.length === 0) {
        setUsers([]);
        return;
      }

      // Then get profiles for all these users
      const userIds = rolesData.map(role => role.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles data:', profilesData);

      // Combine the data
      const transformedUsers: CompanyUser[] = rolesData.map((roleItem: any) => {
        const profile = profilesData?.find(p => p.id === roleItem.user_id);
        return {
          id: roleItem.user_id,
          name: profile?.name || 'Unknown User',
          email: profile?.email || 'No email',
          role: roleItem.role,
          created_at: roleItem.created_at
        };
      });

      setUsers(transformedUsers);
    } catch (error: any) {
      console.error('Error in fetchCompanyUsers:', error);
      toast({
        title: 'Error loading users',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'member':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800';
      case 'member':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Company Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Company Users
        </CardTitle>
        <CardDescription>
          {companyName ? `Users with access to ${companyName}` : 'All users with access to this company'} ({users.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">No users have access to this company yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-700">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyUsers;
