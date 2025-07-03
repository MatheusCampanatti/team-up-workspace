
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MoreHorizontal, Calendar, User, Tag } from 'lucide-react';
import { useRealtimeItemValues } from '@/hooks/useRealtimeItemValues';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import BoardStats from './BoardStats';

interface Column {
  id: string;
  name: string;
  type: string;
  board_id: string;
  order: number | null;
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
  value: string;
  updated_at: string;
}

interface EnhancedBoardTableViewProps {
  boardId: string;
  searchTerm?: string;
}

const EnhancedBoardTableView: React.FC<EnhancedBoardTableViewProps> = ({ 
  boardId, 
  searchTerm = '' 
}) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemValues, setItemValues] = useState<ItemValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    itemValues.some(value => 
      value.item_id === item.id && 
      value.value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Calculate stats
  const stats = {
    totalItems: filteredItems.length,
    completedItems: filteredItems.filter(item => {
      const statusValue = itemValues.find(v => 
        v.item_id === item.id && 
        columns.find(c => c.id === v.column_id)?.name.toLowerCase().includes('status')
      );
      return statusValue?.value.toLowerCase() === 'done';
    }).length,
    inProgressItems: filteredItems.filter(item => {
      const statusValue = itemValues.find(v => 
        v.item_id === item.id && 
        columns.find(c => c.id === v.column_id)?.name.toLowerCase().includes('status')
      );
      return statusValue?.value.toLowerCase() === 'working on it';
    }).length,
    stuckItems: filteredItems.filter(item => {
      const statusValue = itemValues.find(v => 
        v.item_id === item.id && 
        columns.find(c => c.id === v.column_id)?.name.toLowerCase().includes('status')
      );
      return statusValue?.value.toLowerCase() === 'stuck';
    }).length
  };

  useEffect(() => {
    fetchBoardData();
  }, [boardId]);

  const fetchBoardData = async () => {
    setLoading(true);
    console.log('Fetching board data for boardId:', boardId);

    try {
      // Fetch columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('board_columns')
        .select('*')
        .eq('board_id', boardId)
        .order('order', { ascending: true, nullsFirst: false });

      if (columnsError) {
        console.error('Error fetching columns:', columnsError);
        return;
      }

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('board_items')
        .select('*')
        .eq('board_id', boardId)
        .order('order', { ascending: true, nullsFirst: false });

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
        return;
      }

      // Fetch item values
      const { data: valuesData, error: valuesError } = await supabase
        .from('item_values')
        .select('*');

      if (valuesError) {
        console.error('Error fetching item values:', valuesError);
        return;
      }

      console.log('Fetched data:', { columnsData, itemsData, valuesData });
      setColumns(columnsData || []);
      setItems(itemsData || []);
      setItemValues(valuesData || []);
    } catch (error) {
      console.error('Unexpected error fetching board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const itemValue = newRecord || oldRecord;
    if (!itemValue) return;
    
    const belongsToBoard = items.some(item => item.id === itemValue.item_id);
    if (!belongsToBoard) return;

    console.log('Processing realtime change for our board:', { eventType, itemValue });

    setItemValues(prevValues => {
      switch (eventType) {
        case 'INSERT':
          if (!prevValues.find(v => v.id === newRecord.id)) {
            return [...prevValues, newRecord];
          }
          return prevValues;
        case 'UPDATE':
          return prevValues.map(value =>
            value.id === newRecord.id ? { ...value, ...newRecord } : value
          );
        case 'DELETE':
          return prevValues.filter(value => value.id !== oldRecord.id);
        default:
          return prevValues;
      }
    });
  }, [items]);

  useRealtimeItemValues({
    boardId,
    onItemValueChange: handleRealtimeChange
  });

  const getItemValue = (itemId: string, columnId: string): string => {
    const itemValue = itemValues.find(
      (value) => value.item_id === itemId && value.column_id === columnId
    );
    return itemValue?.value || '';
  };

  const updateItemValue = async (itemId: string, columnId: string, value: string) => {
    console.log('Updating item value:', { itemId, columnId, value });

    setItemValues(prev => {
      const existingValue = prev.find(val => val.item_id === itemId && val.column_id === columnId);
      
      if (existingValue) {
        return prev.map(val =>
          val.item_id === itemId && val.column_id === columnId
            ? { ...val, value, updated_at: new Date().toISOString() }
            : val
        );
      } else {
        const tempValue: ItemValue = {
          id: `temp-${Date.now()}`,
          item_id: itemId,
          column_id: columnId,
          value,
          updated_at: new Date().toISOString()
        };
        return [...prev, tempValue];
      }
    });

    try {
      const existingValue = itemValues.find(
        (val) => val.item_id === itemId && val.column_id === columnId
      );

      if (existingValue) {
        const { error } = await supabase
          .from('item_values')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('id', existingValue.id);

        if (error) {
          console.error('Error updating item value:', error);
          setItemValues(prev => 
            prev.map(val =>
              val.item_id === itemId && val.column_id === columnId
                ? { ...val, value: existingValue.value }
                : val
            )
          );
          return;
        }
      } else {
        const { data, error } = await supabase
          .from('item_values')
          .insert([{ item_id: itemId, column_id: columnId, value }])
          .select();

        if (error) {
          console.error('Error creating item value:', error);
          setItemValues(prev => 
            prev.filter(val => !(val.item_id === itemId && val.column_id === columnId && val.id.startsWith('temp-')))
          );
          return;
        }

        if (data && data.length > 0) {
          setItemValues(prev => 
            prev.map(val => 
              val.item_id === itemId && val.column_id === columnId && val.id.startsWith('temp-')
                ? data[0]
                : val
            )
          );
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

      if (data && data.length > 0) {
        const newItem = data[0];
        setItems(prev => [...prev, newItem]);
        setNewItemName('');
      }
    } catch (error) {
      console.error('Unexpected error adding item:', error);
    }
  };

  const renderCellContent = (item: Item, column: Column) => {
    const cellKey = `${item.id}-${column.id}`;
    const currentValue = getItemValue(item.id, column.id);
    const isEditing = editingCell === cellKey;

    if (!isEditing) {
      return (
        <div
          className="min-h-[40px] p-3 cursor-pointer hover:bg-gray-50 rounded border-transparent border flex items-center"
          onClick={() => setEditingCell(cellKey)}
        >
          {column.type === 'checkbox' ? (
            <Checkbox
              checked={currentValue === 'true'}
              onCheckedChange={(checked) => {
                updateItemValue(item.id, column.id, checked ? 'true' : 'false');
              }}
            />
          ) : column.type === 'status' && column.name.toLowerCase().includes('status') ? (
            <StatusBadge status={currentValue || 'Not started'} size="sm" />
          ) : column.type === 'status' && column.name.toLowerCase().includes('priority') ? (
            <PriorityBadge priority={currentValue || 'Medium'} size="sm" />
          ) : column.type === 'date' ? (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              {currentValue ? new Date(currentValue).toLocaleDateString() : 'No date'}
            </div>
          ) : column.type === 'timestamp' ? (
            <span className="text-sm text-gray-500">
              {currentValue ? new Date(currentValue).toLocaleString() : 'Never'}
            </span>
          ) : (
            <span className="text-sm text-gray-900">{currentValue || 'Click to edit'}</span>
          )}
        </div>
      );
    }

    if (column.type === 'status') {
      const options = column.name.toLowerCase().includes('priority') 
        ? ['Low', 'Medium', 'High']
        : ['Not started', 'Working on it', 'Stuck', 'Done'];
      
      return (
        <select
          value={currentValue}
          onChange={(e) => {
            updateItemValue(item.id, column.id, e.target.value);
            setEditingCell(null);
          }}
          onBlur={() => setEditingCell(null)}
          className="w-full px-3 py-2 border rounded-md"
          autoFocus
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (column.type === 'textarea') {
      return (
        <Textarea
          value={currentValue}
          onChange={(e) => updateItemValue(item.id, column.id, e.target.value)}
          onBlur={() => setEditingCell(null)}
          className="min-h-[80px]"
          autoFocus
        />
      );
    }

    return (
      <Input
        type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
        value={currentValue}
        onChange={(e) => updateItemValue(item.id, column.id, e.target.value)}
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
    <div className="w-full space-y-6">
      <BoardStats {...stats} />

      <Card className="w-full shadow-sm">
        <CardContent className="p-0">
          <div className="bg-white rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900 w-64 px-6 py-4">
                    Item
                  </TableHead>
                  {columns.map((column) => (
                    <TableHead key={column.id} className="font-semibold text-gray-900 min-w-[180px] px-4 py-4">
                      <div className="flex items-center space-x-2">
                        {column.type === 'status' && <Tag className="h-4 w-4" />}
                        {column.type === 'date' && <Calendar className="h-4 w-4" />}
                        {column.type === 'textarea' && <User className="h-4 w-4" />}
                        <span>{column.name}</span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow 
                    key={item.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <TableCell className="font-medium px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-900">{item.name}</span>
                      </div>
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={`${item.id}-${column.id}`} className="p-0">
                        {renderCellContent(item, column)}
                      </TableCell>
                    ))}
                    <TableCell className="p-4">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-0">
                  <TableCell colSpan={columns.length + 2} className="p-4">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                      <Input
                        placeholder="Enter item name and press Enter"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addNewItem();
                          }
                        }}
                        className="flex-1 max-w-md border-dashed"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBoardTableView;
