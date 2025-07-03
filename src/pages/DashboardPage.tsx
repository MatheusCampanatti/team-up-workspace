
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, LogOut, User, Users, Calendar, TrendingUp } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  created_at: string;
  role: string;
}

interface Profile {
  name: string;
  email: string;
}

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchProfile();
    fetchCompanies();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
    console.log('Fetching profile for user:', user.id);
    const { data, error } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      console.log('Profile data:', data);
      setProfile(data);
    }
  };

  const fetchCompanies = async () => {
    if (!user) return;
    
    setLoading(true);
    console.log('Fetching companies for user:', user.id);
    
    const { data: roleData, error: roleError } = await supabase
      .from('user_company_roles')
      .select('company_id, role')
      .eq('user_id', user.id);
    
    if (roleError) {
      console.error('Error fetching user roles:', roleError);
      toast({
        title: 'Error loading user roles',
        description: roleError.message,
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }

    console.log('User roles data:', roleData);

    if (!roleData || roleData.length === 0) {
      console.log('No roles found for user');
      setCompanies([]);
      setLoading(false);
      return;
    }

    const companyIds = roleData.map(role => role.company_id);
    
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, created_at')
      .in('id', companyIds);
    
    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      toast({
        title: 'Error loading companies',
        description: companiesError.message,
        variant: 'destructive'
      });
    } else {
      console.log('Companies data:', companiesData);
      
      const formattedCompanies = companiesData?.map(company => {
        const userRole = roleData.find(role => role.company_id === company.id);
        return {
          id: company.id,
          name: company.name,
          created_at: company.created_at,
          role: userRole?.role || 'Unknown'
        };
      }) || [];
      
      console.log('Formatted companies:', formattedCompanies);
      setCompanies(formattedCompanies);
    }
    setLoading(false);
  };

  const createCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCompanyName.trim()) return;

    console.log('Creating company:', newCompanyName);

    try {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{ name: newCompanyName.trim() }])
        .select()
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        throw companyError;
      }

      console.log('Company created:', companyData);

      const { error: roleError } = await supabase
        .from('user_company_roles')
        .insert([{
          user_id: user.id,
          company_id: companyData.id,
          role: 'Admin'
        }]);

      if (roleError) {
        console.error('Error creating user role:', roleError);
        throw roleError;
      }

      console.log('User role created successfully');

      toast({
        title: 'Company created!',
        description: `${newCompanyName} has been created successfully.`
      });

      setNewCompanyName('');
      setIsDialogOpen(false);
      fetchCompanies();
    } catch (error: any) {
      console.error('Error in createCompany:', error);
      toast({
        title: 'Error creating company',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const viewCompanyBoards = (companyId: string) => {
    navigate(`/company/${companyId}/boards`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">WorkBoard</h1>
                <p className="text-sm text-gray-500">Project Management Made Simple</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">{profile?.name || user.email}</span>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="text-gray-700 hover:text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.name?.split(' ')[0] || 'there'}! 👋
          </h2>
          <p className="text-gray-600">
            Manage your projects and collaborate with your team across all your companies.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-200 mr-4">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">{companies.length}</p>
                  <p className="text-sm text-blue-700">Companies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-200 mr-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900">
                    {companies.filter(c => c.role === 'Admin').length}
                  </p>
                  <p className="text-sm text-green-700">Admin Roles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-200 mr-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-900">Active</p>
                  <p className="text-sm text-purple-700">Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Your Companies</h3>
            <p className="text-gray-600 mt-1">Access and manage all your company workspaces</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogDescription>
                  Enter a name for your new company workspace. You'll be added as an Admin automatically.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Enter company name"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Create Company
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Create your first company workspace to get started with project management.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Company
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Company</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new company workspace. You'll be added as an Admin automatically.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={createCompany} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      placeholder="Enter company name"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Create Company
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="text-gray-900">{company.name}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      company.role === 'Admin' 
                        ? 'bg-blue-100 text-blue-700' 
                        : company.role === 'Member'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {company.role}
                    </span>
                  </CardTitle>
                  <CardDescription className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    Created {new Date(company.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-4">
                    You have {company.role.toLowerCase()} access to this company workspace.
                  </p>
                  <Button 
                    onClick={() => viewCompanyBoards(company.id)}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Open Workspace
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
