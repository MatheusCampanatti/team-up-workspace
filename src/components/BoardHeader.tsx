
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Settings, Star, Share2, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BoardHeaderProps {
  boardName: string;
  companyId: string;
  onSearch: (term: string) => void;
  searchTerm: string;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({ 
  boardName, 
  companyId, 
  onSearch, 
  searchTerm 
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/company/${companyId}/boards`)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{boardName}</h1>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-yellow-500">
              <Star className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search everything..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Invite
          </Button>
          
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BoardHeader;
