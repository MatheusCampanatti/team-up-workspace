
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import BoardHeader from '@/components/BoardHeader';
import EnhancedBoardTableView from '@/components/EnhancedBoardTableView';

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
  const [searchTerm, setSearchTerm] = useState('');

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
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-32 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
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
      <BoardHeader 
        boardName={board.name}
        companyId={board.company_id}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
      />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <EnhancedBoardTableView 
          boardId={board.id} 
          searchTerm={searchTerm}
        />
      </div>
    </div>
  );
};

export default BoardPage;
