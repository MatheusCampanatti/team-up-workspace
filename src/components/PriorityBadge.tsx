
import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface PriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md';
  className?: string;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md', className }) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return {
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: ArrowUp,
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: Minus,
        };
      case 'low':
        return {
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: ArrowDown,
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: Minus,
        };
    }
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.color,
        sizeClasses,
        className
      )}
    >
      <Icon className={cn(iconSize, 'mr-1')} />
      {priority}
    </span>
  );
};

export default PriorityBadge;
