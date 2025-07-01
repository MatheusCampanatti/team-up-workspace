
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Column {
  id: string;
  name: string;
  type: string;
  board_id: string;
  order: number | null;
  created_at: string;
  options?: string[] | null;
  is_readonly?: boolean | null;
}

interface CellEditorProps {
  column: Column;
  value: any;
  onValueChange: (value: any) => void;
  onBlur: () => void;
  isEditing: boolean;
  onClick: () => void;
}

const CellEditor: React.FC<CellEditorProps> = ({
  column,
  value,
  onValueChange,
  onBlur,
  isEditing,
  onClick,
}) => {
  const renderDisplayValue = () => {
    if ((column.type === 'status' || column.type === 'priority') && column.options) {
      const statusColors: { [key: string]: string } = {
        'Not started': 'bg-gray-100 text-gray-800',
        'Working on it': 'bg-yellow-100 text-yellow-800',
        'Stuck': 'bg-red-100 text-red-800',
        'Done': 'bg-green-100 text-green-800',
        'Low': 'bg-blue-100 text-blue-800',
        'Medium': 'bg-orange-100 text-orange-800',
        'High': 'bg-red-100 text-red-800',
      };
      
      return (
        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[value] || 'bg-gray-100 text-gray-800')}>
          {value || 'Select option'}
        </span>
      );
    }
    
    if (column.type === 'date') {
      return value ? format(new Date(value), 'MMM dd, yyyy') : 'Select date';
    }
    
    if (column.type === 'date-range') {
      if (value && value.start && value.end) {
        return `${format(new Date(value.start), 'MMM dd')} - ${format(new Date(value.end), 'MMM dd, yyyy')}`;
      }
      return 'Select date range';
    }
    
    if (column.type === 'number') {
      return value ? `$${parseFloat(value).toLocaleString()}` : 'Enter amount';
    }
    
    if (column.type === 'timestamp' || column.type === 'last updated') {
      return value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : format(new Date(), 'MMM dd, yyyy HH:mm');
    }
    
    if (column.type === 'file') {
      return value ? value : 'Upload file';
    }
    
    return value || 'Click to edit';
  };

  // Check if column is readonly
  const isReadonly = column.is_readonly || column.type === 'timestamp' || column.type === 'last updated';

  if (!isEditing || isReadonly) {
    return (
      <div
        className="min-h-[2rem] p-2 cursor-pointer hover:bg-gray-50 rounded border-transparent border w-full"
        onClick={isReadonly ? undefined : onClick}
      >
        {renderDisplayValue()}
      </div>
    );
  }

  // Status and Priority dropdowns
  if ((column.type === 'status' || column.type === 'priority') && column.options) {
    return (
      <Select value={value || ''} onValueChange={onValueChange} onOpenChange={(open) => !open && onBlur()}>
        <SelectTrigger className="border-blue-500">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          {column.options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Date picker
  if (column.type === 'date') {
    const dateValue = value ? new Date(value) : undefined;
    
    return (
      <Popover onOpenChange={(open) => !open && onBlur()}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal border-blue-500",
              !dateValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              onValueChange(date ? date.toISOString().split('T')[0] : '');
              onBlur();
            }}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Date range picker
  if (column.type === 'date-range') {
    const dateRange = value || { start: '', end: '' };
    
    return (
      <div className="flex gap-2 items-center">
        <Input
          type="date"
          value={dateRange.start}
          onChange={(e) => onValueChange({ ...dateRange, start: e.target.value })}
          onBlur={onBlur}
          className="border-blue-500 text-xs"
          placeholder="Start"
        />
        <span className="text-gray-400">to</span>
        <Input
          type="date"
          value={dateRange.end}
          onChange={(e) => onValueChange({ ...dateRange, end: e.target.value })}
          onBlur={onBlur}
          className="border-blue-500 text-xs"
          placeholder="End"
        />
      </div>
    );
  }

  // Notes textarea
  if (column.type === 'notes') {
    return (
      <Textarea
        value={value || ''}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onBlur();
          }
        }}
        className="min-h-[2rem] border-blue-500"
        autoFocus
      />
    );
  }

  // Number input
  if (column.type === 'number') {
    return (
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onBlur();
          }
        }}
        className="border-blue-500"
        autoFocus
        placeholder="0.00"
      />
    );
  }

  // File input
  if (column.type === 'file') {
    return (
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onBlur();
          }
        }}
        className="border-blue-500"
        autoFocus
        placeholder="File URL or name"
      />
    );
  }

  // Default text input
  return (
    <Input
      type="text"
      value={value || ''}
      onChange={(e) => onValueChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onBlur();
        }
      }}
      className="border-blue-500"
      autoFocus
    />
  );
};

export default CellEditor;
