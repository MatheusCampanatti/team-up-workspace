
-- Add unique constraint on item_id and column_id to support upsert operations
ALTER TABLE item_values 
ADD CONSTRAINT item_values_item_column_unique 
UNIQUE (item_id, column_id);
