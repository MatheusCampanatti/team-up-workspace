
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Calendar, ArrowLeft } from 'lucide-react';
import CompanyInviteForm from '@/components/CompanyInviteForm';
import PendingInvitations from '@/components/PendingInvitations';
import { Resend } from 'resend';

interface Board {
  id: string;
  name: string;
  created_at: string;
  company_id: string;
  created_by: string | null;
}

interface Company {
  id: string;
  name: string;
}

const CompanyBoardsPage = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [boards, setBoards] = useState<Board[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [newBoardName, setNewBoardName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creatingBoard, setCreatingBoard] = useState(false);

  useEffect(() => {
    if (!user || !companyId) {
      navigate('/auth');
      return;
    }
    
    fetchCompanyAndBoards();
  }, [user, companyId, navigate]);

const resend = new Resend('re_4ALaVYXg_7A8MSCe8vbEwgG7772vkM5rs');
  
  const fetchCompanyAndBoards = async () => {
    if (!companyId) return;
    
    setLoading(true);
    console.log('Fetching company and boards for company:', companyId);
    
    try {
      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();
      
      if (companyError) {
        console.error('Error fetching company:', companyError);
        toast({
          title: 'Error loading company',
          description: companyError.message,
          variant: 'destructive'
        });
        return;
      }
      
      setCompany(companyData);
      
      // Fetch boards for this company
      const { data: boardsData, error: boardsError } = await supabase
        .from('boards')
        .select('id, name, created_at, company_id, created_by')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (boardsError) {
        console.error('Error fetching boards:', boardsError);
        toast({
          title: 'Error loading boards',
          description: boardsError.message,
          variant: 'destructive'
        });
      } else {
        console.log('Boards data:', boardsData);
        setBoards(boardsData || []);
      }
    } catch (error) {
      console.error('Error in fetchCompanyAndBoards:', error);
      toast({
        title: 'Unexpected error',
        description: 'Failed to load company data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !companyId || !newBoardName.trim()) return;

    setCreatingBoard(true);
    console.log('Creating board:', newBoardName, 'for company:', companyId);

    try {
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .insert([{
          name: newBoardName.trim(),
          company_id: companyId,
          created_by: user.id
        }])
        .select()
        .single();

      if (boardError) {
        console.error('Error creating board:', boardError);
        throw boardError;
      }

      console.log('Board created successfully:', boardData);
      
      toast({
        title: 'Board created!',
        description: `${newBoardName} has been created successfully.`
      });

      setNewBoardName('');
      setIsDialogOpen(false);
      fetchCompanyAndBoards(); // Refresh the list
    } catch (error: any) {
      console.error('Error in createBoard:', error);
      toast({
        title: 'Error creating board',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleBoardClick = (boardId: string) => {
    navigate(`/board/${boardId}`);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
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
              <Button 
                variant="ghost" 
                onClick={handleBackToDashboard}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Building2 className="h-8 w-8 text-blue-600 mr-2" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {company?.name || 'Loading...'}
                </h1>
                <p className="text-sm text-gray-600">Boards</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Boards</h2>
            <p className="text-gray-600 mt-1">Manage your project boards</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
                <DialogDescription>
                  Enter a name for your new board in {company?.name}.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createBoard} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="board-name">Board Name</Label>
                  <Input
                    id="board-name"
                    placeholder="Enter board name"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={creatingBoard}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creatingBoard}>
                    {creatingBoard ? 'Creating...' : 'Create Board'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Team Management Section - Only show for Admins */}
        {companyId && company && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompanyInviteForm 
              companyId={companyId} 
              onInvitationSent={async () => {

                

            const retorno = await resend.emails.send({
              from: 'lucas.lfs2004@gmail.com
              to: ['lucas.lfs2004@gmail.com'],
              subject: 'hello world',
              html: '<p>it works!</p>',
            });

                {/* const response = await fetch('/api/emails/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer re_4ALaVYXg_7A8MSCe8vbEwgG7772vkM5rs`,
  },
  body: JSON.stringify("<p>it works</p>"),
}); */}
            console.log("Retorno do envio de email: ", retorno)
                // Refresh invitations list
                console.log('Invitation sent, refreshing...');
              }}
            />
            <PendingInvitations 
              companyId={companyId} 
            />
          </div>
        )}

        {/* Boards Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading boards...</p>
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No boards yet</h3>
            <p className="text-gray-600 mb-4">Create your first board to get started</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Board
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Board</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new board in {company?.name}.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={createBoard} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="board-name">Board Name</Label>
                    <Input
                      id="board-name"
                      placeholder="Enter board name"
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      disabled={creatingBoard}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creatingBoard}>
                      {creatingBoard ? 'Creating...' : 'Create Board'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Card 
                key={board.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleBoardClick(board.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{board.name}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    Created {new Date(board.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Click to manage this board's items and columns.
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

export default CompanyBoardsPage;
