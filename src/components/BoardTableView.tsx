
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, File } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Column {
  id: string;
  name: string;
  type: string;
  board_id: string;
  order: number | null;
  options: string[] | null;
  is_readonly: boolean | null;
  created_at: string;
}

interface Item {
  id: string;
  name: string;
  board_id: string;
  order: number | null;
  created_at: string;
}

interface ItemValue {
  id: string;
  item_id: string;
  column_id: string;
  value: string | null;
  number_value: number | null;
  date_value: string | null;
  boolean_value: boolean | null;
  updated_at: string | null;
}

interface BoardTableViewProps {
  boardId: string;
}

const BoardTableView: React.FC<BoardTableViewProps> = ({ boardId }) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemValues, setItemValues] = useState<ItemValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');

  useEffect(() => {
    fetchBoardData();
    setupRealtimeSubscription();
  }, [boardId]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('board-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_values'
        },
        () => {
          console.log('Item values changed, refetching data');
          fetchItemValues();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_items'
        },
        () => {
          console.log('Board items changed, refetching data');
          fetchItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_columns'
        },
        () => {
          console.log('Board columns changed, refetching data');
          fetchColumns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchBoardData = async () => {
    setLoading(true);
    console.log('Fetching board data for boardId:', boardId);

    try {
      await Promise.all([
        fetchColumns(),
        fetchItems(),
        fetchItemValues()
      ]);
    } catch (error) {
      console.error('Error fetching board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchColumns = async () => {
    const { data, error } = await supabase
      .from('board_columns')
      .select('*')
      .eq('board_id', boardId)
      .order('order', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching columns:', error);
      return;
    }

    console.log('Fetched columns:', data);
    setColumns(data || []);
  };

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('board_items')
      .select('*')
      .eq('board_id', boardId)
      .order('order', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching items:', error);
      return;
    }

    console.log('Fetched items:', data);
    setItems(data || []);
  };

  const fetchItemValues = async () => {
    const { data, error } = await supabase
      .from('item_values')
      .select('*');

    if (error) {
      console.error('Error fetching item values:', error);
      return;
    }

    console.log('Fetched item values:', data);
    setItemValues(data || []);
  };

  const getItemValue = (itemId: string, columnId: string): ItemValue | null => {
    return itemValues.find(
      (value) => value.item_id === itemId && value.column_id === columnId
    ) || null;
  };

  const updateItemValue = async (itemId: string, columnId: string, value: any, columnType: string) => {
    console.log('Updating item value:', { itemId, columnId, value, columnType });

    try {
      const existingValue = getItemValue(itemId, columnId);
      
      // Prepare the data based on column type
      let valueData: any = {
        item_id: itemId,
        column_id: columnId,
        updated_at: new Date().toISOString(),
        value: null,
        number_value: null,
        date_value: null,
        boolean_value: null
      };

      // Set the appropriate field based on column type
      switch (columnType) {
        case 'number':
          valueData.number_value = value ? parseFloat(value) : null;
          valueData.value = value ? String(value) : null;
          break;
        case 'date':
          valueData.date_value = value || null;
          valueData.value = value || null;
          break;
        case 'checkbox':
          valueData.boolean_value = value === 'true' || value === true;
          valueData.value = valueData.boolean_value ? 'true' : 'false';
          break;
        default:
          valueData.value = value || null;
      }

      console.log('Prepared value data:', valueData);

      if (existingValue) {
        // Update existing value
        const { data, error } = await supabase
          .from('item_values')
          .update(valueData)
          .eq('id', existingValue.id)
          .select();

        if (error) {
          console.error('Error updating item value:', error);
          return;
        }

        console.log('Updated item value:', data);
        
        // Update local state
        setItemValues(prev => prev.map(val => 
          val.id === existingValue.id 
            ? { ...val, ...valueData }
            : val
        ));
      } else {
        // Insert new value
        const { data, error } = await supabase
          .from('item_values')
          .insert([valueData])
          .select();

        if (error) {
          console.error('Error inserting item value:', error);
          return;
        }

        console.log('Inserted new item value:', data);
        
        // Update local state
        if (data && data.length > 0) {
          setItemValues(prev => [...prev, ...data]);
        }
      }
    } catch (error) {
      console.error('Unexpected error updating item value:', error);
    }
  };

  const addNewItem = async () => {
    if (!newItemName.trim()) return;

    console.log('Adding new item:', newItemName);

    try {
      const nextOrder = items.length > 0 ? Math.max(...items.map(item => item.order || 0)) + 1 : 1;

      const { data, error } = await supabase
        .from('board_items')
        .insert([{ 
          name: newItemName, 
          board_id: boardId,
          order: nextOrder
        }])
        .select();

      if (error) {
        console.error('Error adding item:', error);
        return;
      }

      console.log('Added new item:', data);
      setNewItemName('');
      
      if (data && data.length > 0) {
        setItems(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error('Unexpected error adding item:', error);
    }
  };

  const addNewColumn = async () => {
    if (!newColumnName.trim()) return;

    console.log('Adding new column:', { name: newColumnName, type: newColumnType });

    try {
      const nextOrder = columns.length > 0 ? Math.max(...columns.map(col => col.order || 0)) + 1 : 1;

      const { data, error } = await supabase
        .from('board_columns')
        .insert([{ 
          name: newColumnName, 
          type: newColumnType, 
          board_id: boardId,
          order: nextOrder
        }])
        .select();

      if (error) {
        console.error('Error adding column:', error);
        return;
      }

      console.log('Added new column:', data);
      setNewColumnName('');
      setNewColumnType('text');
      
      if (data && data.length > 0) {
        setColumns(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error('Unexpected error adding column:', error);
    }
  };

  const renderCellValue = (item: Item, column: Column) => {
    const itemValue = getItemValue(item.id, column.id);
    const cellKey = `${item.id}-${column.id}`;
    const isEditing = editingCell === cellKey;

    if (column.is_readonly) {
      // Handle readonly columns like timestamp
      if (column.type === 'timestamp') {
        return (
          <div className="text-sm text-gray-600">
            {itemValue?.updated_at ? format(new Date(itemValue.updated_at), 'PPp') : '-'}
          </div>
        );
      }
    }

    const displayValue = () => {
      if (!itemValue) return null;

      switch (column.type) {
        case 'status':
          if (!itemValue.value) return null;
          const statusColors: Record<string, string> = {
            'Done': 'bg-green-100 text-green-800',
            'Working on it': 'bg-blue-100 text-blue-800',
            'Stuck': 'bg-red-100 text-red-800',
            'Not started': 'bg-gray-100 text-gray-800',
            'High': 'bg-red-100 text-red-800',
            'Medium': 'bg-yellow-100 text-yellow-800',
            'Low': 'bg-green-100 text-green-800'
          };
          return (
            <Badge variant="secondary" className={statusColors[itemValue.value] || 'bg-gray-100 text-gray-800'}>
              {itemValue.value}
            </Badge>
          );

        case 'date':
          if (!itemValue.date_value && !itemValue.value) return null;
          const dateValue = itemValue.date_value || itemValue.value;
          try {
            return format(new Date(dateValue), 'PP');
          } catch {
            return dateValue;
          }

        case 'number':
          return itemValue.number_value?.toString() || itemValue.value || null;

        case 'checkbox':
          return itemValue.boolean_value ? '✓' : '○';

        case 'file':
          return itemValue.value ? (
            <div className="flex items-center gap-1">
              <File className="w-4 h-4" />
              <span className="text-sm">{itemValue.value}</span>
            </div>
          ) : null;

        default:
          return itemValue.value || null;
      }
    };

    if (!isEditing) {
      return (
        <div
          className="min-h-[2rem] p-2 cursor-pointer hover:bg-gray-50 rounded border-transparent border w-full"
          onClick={() => !column.is_readonly && setEditingCell(cellKey)}
        >
          {displayValue() || <span className="text-gray-400 text-sm">Click to edit</span>}
        </div>
      );
    }

    // Render editing interface
    const currentValue = itemValue?.value || '';

    if (column.type === 'status' && column.options) {
      return (
        <select
          value={currentValue}
          onChange={(e) => {
            updateItemValue(item.id, column.id, e.target.value, column.type);
            setEditingCell(null);
          }}
          onBlur={() => setEditingCell(null)}
          className="w-full p-2 border rounded"
          autoFocus
        >
          <option value="">Select...</option>
          {column.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (column.type === 'date') {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !currentValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentValue ? format(new Date(currentValue), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentValue ? new Date(currentValue) : undefined}
              onSelect={(date) => {
                if (date) {
                  updateItemValue(item.id, column.id, date.toISOString().split('T')[0], column.type);
                }
                setEditingCell(null);
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      );
    }

    if (column.type === 'textarea') {
      return (
        <Textarea
          value={currentValue}
          onChange={(e) => updateItemValue(item.id, column.id, e.target.value, column.type)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              setEditingCell(null);
            }
          }}
          className="min-h-[2rem]"
          autoFocus
        />
      );
    }

    if (column.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={currentValue === 'true'}
          onChange={(e) => {
            updateItemValue(item.id, column.id, e.target.checked, column.type);
            setEditingCell(null);
          }}
          className="w-4 h-4"
          autoFocus
        />
      );
    }

    return (
      <Input
        type={column.type === 'number' ? 'number' : 'text'}
        value={currentValue}
        onChange={(e) => updateItemValue(item.id, column.id, e.target.value, column.type)}
        onBlur={() => setEditingCell(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setEditingCell(null);
          }
        }}
        className="border-blue-500"
        autoFocus
      />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Board Table
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Column name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="w-32"
              />
              <select
                value={newColumnType}
                onChange={(e) => setNewColumnType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="status">Status</option>
                <option value="checkbox">Checkbox</option>
                <option value="textarea">Textarea</option>
                <option value="file">File</option>
              </select>
              <Button onClick={addNewColumn} size="sm">
                <Plus className="w-4 h-4" />
                Column
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Item Name</TableHead>
                {columns.map((column) => (
                  <TableHead key={column.id} className="font-semibold min-w-[150px]">
                    {column.name}
                    <span className="text-xs text-gray-500 ml-1">({column.type})</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  {columns.map((column) => (
                    <TableCell key={`${item.id}-${column.id}`} className="p-0">
                      {renderCellValue(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={columns.length + 1}>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="New item name"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addNewItem();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={addNewItem} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {items.length === 0 && columns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No columns or items yet. Add a column to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BoardTableView;
