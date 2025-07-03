
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, Users } from 'lucide-react';

interface BoardStatsProps {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  stuckItems: number;
}

const BoardStats: React.FC<BoardStatsProps> = ({
  totalItems,
  completedItems,
  inProgressItems,
  stuckItems
}) => {
  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Completed',
      value: completedItems,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'In Progress',
      value: inProgressItems,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Stuck',
      value: stuckItems,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor} mr-3`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BoardStats;
