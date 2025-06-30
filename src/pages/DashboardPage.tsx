
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
import { Building2, Plus, LogOut, User } from 'lucide-react';

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
    
    // First, let's get all companies the user has roles in
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

    // Extract company IDs
    const companyIds = roleData.map(role => role.company_id);
    
    // Now fetch the company details
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
      
      // Combine company data with role information
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
      // Create the company
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

      // Add user as Admin to the company
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
      fetchCompanies(); // Refresh the list
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Company Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-700">
                <User className="h-4 w-4 mr-1" />
                {profile?.name || user.email}
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Companies</h2>
            <p className="text-gray-600 mt-1">Manage and create companies you belong to</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogDescription>
                  Enter a name for your new company. You'll be added as an Admin.
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
                  <Button type="submit">
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
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
            <p className="text-gray-600 mb-4">Create your first company to get started</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Company
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Company</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new company. You'll be added as an Admin.
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
                    <Button type="submit">
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
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {company.name}
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {company.role}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(company.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    You are an {company.role} of this company.
                  </p>
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
