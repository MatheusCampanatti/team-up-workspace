
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import BoardTableView from '@/components/BoardTableView';

interface Board {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
  created_by: string | null;
}

const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) {
      setError('Board ID is required');
      setLoading(false);
      return;
    }

    fetchBoard();
  }, [boardId]);

  const fetchBoard = async () => {
    if (!boardId) return;

    setLoading(true);
    setError(null);
    console.log('Fetching board with ID:', boardId);

    try {
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id, name, company_id, created_at, created_by')
        .eq('id', boardId)
        .maybeSingle();

      if (boardError) {
        console.error('Error fetching board:', boardError);
        setError('Failed to load board');
        return;
      }

      if (!boardData) {
        console.log('Board not found');
        setError('Board not found');
        return;
      }

      console.log('Board data loaded:', boardData);
      setBoard(boardData);
    } catch (error) {
      console.error('Unexpected error fetching board:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error === 'Board not found' ? 'Board Not Found' : 'Error Loading Board'}
            </h2>
            <p className="text-gray-600 text-center">
              {error === 'Board not found' 
                ? 'The board you are looking for does not exist or has been removed.'
                : 'There was an error loading the board. Please try again later.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{board.name}</h1>
          <p className="text-gray-600 mt-2">
            Created on {new Date(board.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          <BoardTableView boardId={board.id} />
          
          <Card>
            <CardHeader>
              <CardTitle>Board Details</CardTitle>
              <CardDescription>
                Information about this board
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Board Name</label>
                  <p className="text-gray-900 mt-1">{board.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Board ID</label>
                  <p className="text-gray-500 text-sm mt-1 font-mono">{board.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Company ID</label>
                  <p className="text-gray-500 text-sm mt-1 font-mono">{board.company_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(board.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BoardPage;
