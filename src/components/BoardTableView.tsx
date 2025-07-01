
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  value: string;
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
  }, [boardId]);

  const fetchBoardData = async () => {
    setLoading(true);
    console.log('Fetching board data for boardId:', boardId);

    try {
      // Fetch columns from board_columns table
      const { data: columnsData, error: columnsError } = await supabase
        .from('board_columns')
        .select('*')
        .eq('board_id', boardId)
        .order('order', { ascending: true, nullsFirst: false });

      if (columnsError) {
        console.error('Error fetching columns:', columnsError);
        return;
      }

      // Fetch items from board_items table
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
      
      // Transform columns data to match our interface
      const transformedColumns: Column[] = (columnsData || []).map(col => ({
        ...col,
        options: Array.isArray(col.options) ? col.options as string[] : null
      }));
      
      setColumns(transformedColumns);
      setItems(itemsData || []);
      setItemValues(valuesData || []);
    } catch (error) {
      console.error('Unexpected error fetching board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemValue = (itemId: string, columnId: string): string => {
    const itemValue = itemValues.find(
      (value) => value.item_id === itemId && value.column_id === columnId
    );
    return itemValue?.value || '';
  };

  const updateItemValue = async (itemId: string, columnId: string, value: string) => {
    console.log('Updating item value:', { itemId, columnId, value });

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
          return;
        }

        setItemValues(prev =>
          prev.map(val =>
            val.id === existingValue.id
              ? { ...val, value, updated_at: new Date().toISOString() }
              : val
          )
        );
      } else {
        const { data, error } = await supabase
          .from('item_values')
          .insert([{ item_id: itemId, column_id: columnId, value }])
          .select();

        if (error) {
          console.error('Error creating item value:', error);
          return;
        }

        if (data) {
          setItemValues(prev => [...prev, ...data]);
        }
      }
    } catch (error) {
      console.error('Unexpected error updating item value:', error);
    }
  };

  const createDefaultItemValues = async (itemId: string) => {
    const valuesToCreate = columns.map(column => ({
      item_id: itemId,
      column_id: column.id,
      value: column.type === 'timestamp' ? new Date().toISOString() : '',
    }));

    if (valuesToCreate.length > 0) {
      const { data, error } = await supabase
        .from('item_values')
        .insert(valuesToCreate)
        .select();

      if (error) {
        console.error('Error creating default item values:', error);
        return;
      }

      if (data) {
        setItemValues(prev => [...prev, ...data]);
      }
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
        setItems(prev => [...prev, ...data]);
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

      if (data) {
        // Transform the new column data to match our interface
        const transformedNewColumns: Column[] = data.map(col => ({
          ...col,
          options: Array.isArray(col.options) ? col.options as string[] : null
        }));
        
        setColumns(prev => [...prev, ...transformedNewColumns]);
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
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="status">Status</option>
                <option value="textarea">Textarea</option>
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
                    const currentValue = getItemValue(item.id, column.id);
                    
                    return (
                      <TableCell key={cellKey} className="p-0">
                        <CellEditor
                          column={column}
                          value={currentValue}
                          onValueChange={(value) => updateItemValue(item.id, column.id, value)}
                          onBlur={() => setEditingCell(null)}
                          isEditing={editingCell === cellKey}
                          onClick={() => setEditingCell(cellKey)}
                        />
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
            <p>No columns or items yet. Create a new board to see the default columns!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BoardTableView;
