
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

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
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const isReadonly = column.is_readonly || column.type === 'timestamp';

  if (!isEditing || isReadonly) {
    return (
      <div onClick={onClick} className="cursor-pointer px-2 py-1 hover:bg-gray-100 rounded">
        {value || 'Click to edit'}
      </div>
    );
  }

  if (column.type === 'status' && column.options) {
    return (
      <Select onValueChange={(val) => {
        onValueChange(val);
        onBlur();
      }} value={draft}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {column.options.map((option, idx) => (
            <SelectItem key={idx} value={option}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (column.type === 'date') {
    const dateValue = draft ? new Date(draft) : undefined;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, 'PPP') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              const formatted = date?.toISOString().split('T')[0] || '';
              setDraft(formatted);
              onValueChange(formatted);
              onBlur();
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  if (column.type === 'number') {
    return (
      <Input
        type="number"
        value={draft || ''}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onValueChange(draft);
          onBlur();
        }}
        autoFocus
      />
    );
  }

  return (
    <Input
      value={draft || ''}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        onValueChange(draft);
        onBlur();
      }}
      autoFocus
    />
  );
};

export default CellEditor;
