
-- Add support for column options and enhance the board_columns table
ALTER TABLE public.board_columns 
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_readonly BOOLEAN DEFAULT FALSE;

-- Update the type column to support the new types
ALTER TABLE public.board_columns 
ALTER COLUMN type SET DEFAULT 'text';

-- Add a comment to document the supported types
COMMENT ON COLUMN public.board_columns.type IS 'Supported types: text, status, date, number, file, date-range, timestamp';
COMMENT ON COLUMN public.board_columns.options IS 'JSON array of options for status columns, e.g. ["Working on it", "Done", "Stuck", "Not started"]';

-- Create a function to auto-create default columns for new boards
CREATE OR REPLACE FUNCTION create_default_board_columns(board_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert predefined columns for the new board
  INSERT INTO public.board_columns (name, type, board_id, "order", options, is_readonly) VALUES
    ('Item Name', 'text', board_id_param, 1, NULL, FALSE),
    ('Status', 'status', board_id_param, 2, '["Not started", "Working on it", "Stuck", "Done"]'::jsonb, FALSE),
    ('Due Date', 'date', board_id_param, 3, NULL, FALSE),
    ('Priority', 'status', board_id_param, 4, '["Low", "Medium", "High"]'::jsonb, FALSE),
    ('Notes', 'text', board_id_param, 5, NULL, FALSE),
    ('Budget', 'number', board_id_param, 6, NULL, FALSE),
    ('Files', 'file', board_id_param, 7, NULL, FALSE),
    ('Timeline Start', 'date', board_id_param, 8, NULL, FALSE),
    ('Timeline End', 'date', board_id_param, 9, NULL, FALSE),
    ('Last Updated', 'timestamp', board_id_param, 10, NULL, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to automatically create default columns
CREATE OR REPLACE FUNCTION trigger_create_default_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the function to create default columns for the new board
  PERFORM create_default_board_columns(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the boards table
DROP TRIGGER IF EXISTS auto_create_board_columns ON public.boards;
CREATE TRIGGER auto_create_board_columns
  AFTER INSERT ON public.boards
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_columns();

-- Enhance item_values table to better support different data types
ALTER TABLE public.item_values 
ADD COLUMN IF NOT EXISTS date_value DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS number_value NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS boolean_value BOOLEAN DEFAULT NULL;

-- Add RLS policies for item_values table
ALTER TABLE public.item_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view item_values for their company boards" 
  ON public.item_values 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM board_items bi
    JOIN boards b ON bi.board_id = b.id
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE bi.id = item_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert item_values for their company boards" 
  ON public.item_values 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM board_items bi
    JOIN boards b ON bi.board_id = b.id
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE bi.id = item_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can update item_values for their company boards" 
  ON public.item_values 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM board_items bi
    JOIN boards b ON bi.board_id = b.id
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE bi.id = item_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete item_values for their company boards" 
  ON public.item_values 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM board_items bi
    JOIN boards b ON bi.board_id = b.id
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE bi.id = item_id AND ucr.user_id = auth.uid()
  ));
