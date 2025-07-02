
-- Drop existing tables and their dependencies in reverse order
DROP TABLE IF EXISTS public.item_values CASCADE;
DROP TABLE IF EXISTS public.board_items CASCADE;
DROP TABLE IF EXISTS public.board_columns CASCADE;
DROP TABLE IF EXISTS public.boards CASCADE;

-- Drop any existing triggers and functions
DROP TRIGGER IF EXISTS auto_create_board_columns ON public.boards;
DROP FUNCTION IF EXISTS public.trigger_create_default_columns();
DROP FUNCTION IF EXISTS public.create_default_board_columns(uuid);

-- Create boards table
CREATE TABLE public.boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT boards_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create board_columns table
CREATE TABLE public.board_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  board_id UUID NOT NULL,
  "order" INTEGER DEFAULT 0,
  options JSONB DEFAULT NULL,
  is_readonly BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT board_columns_board_id_fkey 
    FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE
);

-- Create board_items table
CREATE TABLE public.board_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  board_id UUID NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT board_items_board_id_fkey 
    FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE
);

-- Create item_values table
CREATE TABLE public.item_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  column_id UUID NOT NULL,
  value TEXT DEFAULT NULL,
  number_value NUMERIC DEFAULT NULL,
  date_value DATE DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT item_values_item_id_fkey 
    FOREIGN KEY (item_id) REFERENCES public.board_items(id) ON DELETE CASCADE,
  CONSTRAINT item_values_column_id_fkey 
    FOREIGN KEY (column_id) REFERENCES public.board_columns(id) ON DELETE CASCADE,
  CONSTRAINT item_values_item_column_unique 
    UNIQUE (item_id, column_id)
);

-- Enable RLS on all tables
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_values ENABLE ROW LEVEL SECURITY;

-- RLS policies for boards
CREATE POLICY "Users can view boards for their companies" 
  ON public.boards 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_company_roles ucr 
    WHERE ucr.company_id = boards.company_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert boards for their companies" 
  ON public.boards 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_company_roles ucr 
    WHERE ucr.company_id = boards.company_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Admins can update boards in their companies" 
  ON public.boards 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.user_company_roles ucr 
    WHERE ucr.company_id = boards.company_id 
      AND ucr.user_id = auth.uid() 
      AND ucr.role = 'Admin'
  ));

CREATE POLICY "Admins can delete boards in their companies" 
  ON public.boards 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.user_company_roles ucr 
    WHERE ucr.company_id = boards.company_id 
      AND ucr.user_id = auth.uid() 
      AND ucr.role = 'Admin'
  ));

-- RLS policies for board_columns
CREATE POLICY "Users can view board_columns for their company boards" 
  ON public.board_columns 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.boards b 
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_columns.board_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert board_columns for their company boards" 
  ON public.board_columns 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.boards b 
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_columns.board_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Admins can update board_columns for their company boards" 
  ON public.board_columns 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.boards b 
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_columns.board_id 
      AND ucr.user_id = auth.uid() 
      AND ucr.role = 'Admin'
  ));

CREATE POLICY "Admins can delete board_columns for their company boards" 
  ON public.board_columns 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.boards b 
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_columns.board_id 
      AND ucr.user_id = auth.uid() 
      AND ucr.role = 'Admin'
  ));

-- RLS policies for board_items
CREATE POLICY "Users can view board_items for their company boards" 
  ON public.board_items 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.boards b 
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_items.board_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert board_items for their company boards" 
  ON public.board_items 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.boards b 
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_items.board_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can update board_items for their company boards" 
  ON public.board_items 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.boards b 
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_items.board_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Admins can delete board_items for their company boards" 
  ON public.board_items 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.boards b 
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_items.board_id 
      AND ucr.user_id = auth.uid() 
      AND ucr.role = 'Admin'
  ));

-- RLS policies for item_values
CREATE POLICY "Users can view item_values for their company boards" 
  ON public.item_values 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.board_items bi
    JOIN public.boards b ON bi.board_id = b.id
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE bi.id = item_values.item_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert item_values for their company boards" 
  ON public.item_values 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.board_items bi
    JOIN public.boards b ON bi.board_id = b.id
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE bi.id = item_values.item_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can update item_values for their company boards" 
  ON public.item_values 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.board_items bi
    JOIN public.boards b ON bi.board_id = b.id
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE bi.id = item_values.item_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Admins can delete item_values for their company boards" 
  ON public.item_values 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.board_items bi
    JOIN public.boards b ON bi.board_id = b.id
    JOIN public.user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE bi.id = item_values.item_id 
      AND ucr.user_id = auth.uid() 
      AND ucr.role = 'Admin'
  ));

-- Create function to auto-create default columns for new boards
CREATE OR REPLACE FUNCTION public.create_default_board_columns(board_id_param UUID)
RETURNS VOID AS $$
BEGIN
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

-- Create trigger function to automatically create default columns
CREATE OR REPLACE FUNCTION public.trigger_create_default_columns()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_default_board_columns(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on boards table
CREATE TRIGGER auto_create_board_columns
  AFTER INSERT ON public.boards
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_create_default_columns();

-- Add indexes for better performance
CREATE INDEX idx_boards_company_id ON public.boards(company_id);
CREATE INDEX idx_board_columns_board_id ON public.board_columns(board_id);
CREATE INDEX idx_board_items_board_id ON public.board_items(board_id);
CREATE INDEX idx_item_values_item_id ON public.item_values(item_id);
CREATE INDEX idx_item_values_column_id ON public.item_values(column_id);
CREATE INDEX idx_item_values_item_column ON public.item_values(item_id, column_id);

-- Add updated_at trigger for boards table
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
