
import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'not started':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'working on it':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'stuck':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'done':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        getStatusColor(status),
        sizeClasses,
        className
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
