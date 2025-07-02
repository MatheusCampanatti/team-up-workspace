
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import CellEditor from './CellEditor';

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
  date_value: string | null;
  number_value: number | null;
  updated_at: string;
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
    
    return () => {
      supabase.removeAllChannels();
    };
  }, [boardId]);

  const setupRealtimeSubscription = () => {
    // Subscribe to item_values changes for real-time updates
    const itemValuesChannel = supabase
      .channel('item_values_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_values'
        },
        (payload) => {
          console.log('Real-time item_values change:', payload);
          if (payload.eventType === 'INSERT') {
            setItemValues(prev => [...prev, payload.new as ItemValue]);
          } else if (payload.eventType === 'UPDATE') {
            setItemValues(prev => 
              prev.map(val => 
                val.id === payload.new.id ? payload.new as ItemValue : val
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setItemValues(prev => 
              prev.filter(val => val.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Subscribe to board_items changes
    const itemsChannel = supabase
      .channel('board_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_items',
          filter: `board_id=eq.${boardId}`
        },
        (payload) => {
          console.log('Real-time board_items change:', payload);
          if (payload.eventType === 'INSERT') {
            setItems(prev => [...prev, payload.new as Item]);
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev => 
              prev.map(item => 
                item.id === payload.new.id ? payload.new as Item : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => 
              prev.filter(item => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Subscribe to board_columns changes
    const columnsChannel = supabase
      .channel('board_columns_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_columns',
          filter: `board_id=eq.${boardId}`
        },
        (payload) => {
          console.log('Real-time board_columns change:', payload);
          if (payload.eventType === 'INSERT') {
            const newColumn = { ...payload.new, options: Array.isArray(payload.new.options) ? payload.new.options as string[] : null } as Column;
            setColumns(prev => [...prev, newColumn]);
          } else if (payload.eventType === 'UPDATE') {
            setColumns(prev => 
              prev.map(col => 
                col.id === payload.new.id 
                  ? { ...payload.new, options: Array.isArray(payload.new.options) ? payload.new.options as string[] : null } as Column 
                  : col
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setColumns(prev => 
              prev.filter(col => col.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
  };

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

      // Fetch all item values for this board's items
      const itemIds = (itemsData || []).map(item => item.id);
      let valuesData: ItemValue[] = [];
      
      if (itemIds.length > 0) {
        const { data: fetchedValues, error: valuesError } = await supabase
          .from('item_values')
          .select('*')
          .in('item_id', itemIds);

        if (valuesError) {
          console.error('Error fetching item values:', valuesError);
          return;
        }
        
        valuesData = fetchedValues || [];
      }

      console.log('Fetched data:', { columnsData, itemsData, valuesData });
      
      // Transform columns data
      const transformedColumns: Column[] = (columnsData || []).map(col => ({
        ...col,
        options: Array.isArray(col.options) ? col.options as string[] : null
      }));
      
      setColumns(transformedColumns);
      setItems(itemsData || []);
      setItemValues(valuesData);
    } catch (error) {
      console.error('Unexpected error fetching board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemValue = (itemId: string, columnId: string, column: Column): any => {
    const itemValue = itemValues.find(
      (value) => value.item_id === itemId && value.column_id === columnId
    );
    
    if (!itemValue) return getDefaultValue(column);
    
    // Return appropriate value based on column type
    switch (column.type) {
      case 'date':
      case 'timestamp':
        return itemValue.date_value || '';
      case 'number':
        return itemValue.number_value !== null ? itemValue.number_value : '';
      default:
        return itemValue.value || '';
    }
  };

  const getDefaultValue = (column: Column): any => {
    switch (column.type) {
      case 'number':
        return '';
      case 'date':
      case 'timestamp':
        return '';
      default:
        return '';
    }
  };

  const renderCellValue = (value: any, column: Column) => {
    if (!value && value !== 0) return <span className="text-gray-400">-</span>;

    switch (column.type) {
      case 'status':
        return (
          <Badge 
            variant={
              value === 'Done' ? 'default' :
              value === 'Working on it' ? 'secondary' :
              value === 'Stuck' ? 'outline' : 'secondary'
            }
            className={
              value === 'Done' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
              value === 'Working on it' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
              value === 'Stuck' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
              ''
            }
          >
            {value}
          </Badge>
        );
      
      case 'date':
      case 'timestamp':
        if (!value) return <span className="text-gray-400">-</span>;
        try {
          const date = new Date(value);
          return <span className="text-sm">{date.toLocaleDateString()}</span>;
        } catch {
          return <span className="text-sm">{value}</span>;
        }
      
      case 'number':
        return <span className="text-sm font-mono">{value}</span>;
      
      case 'file':
        if (value) {
          return (
            <span className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
              📎 {value}
            </span>
          );
        }
        return <span className="text-gray-400">No file</span>;
      
      default:
        return <span className="text-sm">{value || '-'}</span>;
    }
  };

  const updateItemValue = async (itemId: string, columnId: string, value: any, column: Column) => {
    console.log('Updating item value:', { itemId, columnId, value, columnType: column.type });

    try {
      // Prepare upsert data based on column type
      let upsertData: any = {
        item_id: itemId,
        column_id: columnId,
        updated_at: new Date().toISOString(),
        value: null,
        date_value: null,
        number_value: null
      };
      
      // Set the appropriate value field based on column type
      switch (column.type) {
        case 'date':
        case 'timestamp':
          upsertData.date_value = value || null;
          break;
        case 'number':
          upsertData.number_value = value !== '' && value !== null ? parseFloat(value) : null;
          break;
        default:
          upsertData.value = value !== null ? String(value) : null;
          break;
      }

      console.log('Upserting data:', upsertData);

      // Use upsert with conflict resolution
      const { data, error } = await supabase
        .from('item_values')
        .upsert(upsertData, { onConflict: 'item_id,column_id' })
        .select();

      if (error) {
        console.error('Error updating item value:', error);
        return;
      }

      console.log('Successfully updated item value:', data);
    } catch (error) {
      console.error('Unexpected error updating item value:', error);
    }
  };

  const createDefaultItemValues = async (itemId: string) => {
    const valuesToCreate = columns.map(column => {
      let insertData: any = {
        item_id: itemId,
        column_id: column.id,
        value: null,
        date_value: null,
        number_value: null
      };

      // Set appropriate default values based on column type
      switch (column.type) {
        case 'timestamp':
          insertData.date_value = new Date().toISOString().split('T')[0];
          break;
        case 'date':
          insertData.date_value = null;
          break;
        case 'number':
          insertData.number_value = null;
          break;
        default:
          insertData.value = '';
          break;
      }

      return insertData;
    });

    if (valuesToCreate.length > 0) {
      const { data, error } = await supabase
        .from('item_values')
        .insert(valuesToCreate)
        .select();

      if (error) {
        console.error('Error creating default item values:', error);
        return;
      }

      console.log('Created default item values:', data);
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

      if (data && data[0]) {
        setNewItemName('');
        
        // Create default values for all columns
        await createDefaultItemValues(data[0].id);
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

      let options = null;
      if (newColumnType === 'status') {
        options = ["Not started", "Working on it", "Stuck", "Done"];
      }

      const { data, error } = await supabase
        .from('board_columns')
        .insert([{ 
          name: newColumnName, 
          type: newColumnType, 
          board_id: boardId,
          order: nextOrder,
          options: options
        }])
        .select();

      if (error) {
        console.error('Error adding column:', error);
        return;
      }

      if (data) {
        setNewColumnName('');
        setNewColumnType('text');
      }
    } catch (error) {
      console.error('Unexpected error adding column:', error);
    }
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
                <option value="status">Status</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="file">File</option>
                <option value="timestamp">Timestamp</option>
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
                  {columns.map((column) => {
                    const cellKey = `${item.id}-${column.id}`;
                    const currentValue = getItemValue(item.id, column.id, column);
                    const isReadonly = column.is_readonly || column.type === 'timestamp';
                    
                    return (
                      <TableCell key={cellKey} className="p-2">
                        {editingCell === cellKey && !isReadonly ? (
                          <CellEditor
                            column={column}
                            value={currentValue}
                            onValueChange={(value) => {
                              updateItemValue(item.id, column.id, value, column);
                              setEditingCell(null);
                            }}
                            onBlur={() => setEditingCell(null)}
                            isEditing={true}
                            onClick={() => {}}
                          />
                        ) : (
                          <div 
                            onClick={() => !isReadonly && setEditingCell(cellKey)} 
                            className={`cursor-pointer p-2 rounded hover:bg-gray-50 min-h-[32px] flex items-center ${
                              isReadonly ? 'cursor-default' : ''
                            }`}
                          >
                            {renderCellValue(currentValue, column)}
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={columns.length}>
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
            <p>No columns or items yet. Create your first column and item to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BoardTableView;
