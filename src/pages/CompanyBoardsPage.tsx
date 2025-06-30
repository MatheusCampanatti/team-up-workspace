
import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, ChevronDown } from 'lucide-react';

const CompanyBoardsPage = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { user, companies } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newBoardName, setNewBoardName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Find current company
  const currentCompany = companies.find(c => c.id === companyId);

  // Redirect if company not found or user not authenticated
  if (!user || !currentCompany) {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch boards for the company
  const { data: boards, isLoading } = useQuery({
    queryKey: ['boards', companyId],
    queryFn: async () => {
      console.log('Fetching boards for company:', companyId);
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching boards:', error);
        throw error;
      }

      console.log('Boards data:', data);
      return data || [];
    },
  });

  // Create board mutation
  const createBoardMutation = useMutation({
    mutationFn: async (boardName: string) => {
      console.log('Creating board:', { name: boardName, company_id: companyId });
      const { data, error } = await supabase
        .from('boards')
        .insert({
          name: boardName,
          company_id: companyId!,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating board:', error);
        throw error;
      }

      console.log('Created board:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', companyId] });
      setNewBoardName('');
      setShowCreateForm(false);
      toast({
        title: 'Success',
        description: 'Board created successfully!',
      });
    },
    onError: (error: any) => {
      console.error('Failed to create board:', error);
      toast({
        title: 'Error',
        description: 'Failed to create board. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardName.trim()) {
      createBoardMutation.mutate(newBoardName.trim());
    }
  };

  const handleCompanySwitch = (newCompanyId: string) => {
    window.location.href = `/company/${newCompanyId}/boards`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {currentCompany.name} - Boards
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Company Switcher Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <span>Switch Company</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white">
                  {companies.map((company) => (
                    <DropdownMenuItem
                      key={company.id}
                      onClick={() => handleCompanySwitch(company.id)}
                      className={company.id === companyId ? 'bg-gray-100' : ''}
                    >
                      {company.name}
                      {company.id === companyId && ' (Current)'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Board</span>
              </Button>
            </div>
          </div>

          {/* Create Board Form */}
          {showCreateForm && (
            <div className="pb-4">
              <form onSubmit={handleCreateBoard} className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Enter board name..."
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={!newBoardName.trim() || createBoardMutation.isPending}
                >
                  {createBoardMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewBoardName('');
                  }}
                >
                  Cancel
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Loading boards...</div>
          </div>
        ) : boards && boards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Card key={board.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{board.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(board.created_at!).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No boards found for this company.</div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create Your First Board</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyBoardsPage;
