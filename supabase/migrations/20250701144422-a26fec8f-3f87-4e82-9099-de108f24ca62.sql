
-- Check if we need to create the correct table structure
-- Create board_columns table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.board_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  board_id UUID NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create board_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.board_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  board_id UUID NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for board_columns
CREATE POLICY "Users can view board_columns for their company boards" 
  ON public.board_columns 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM boards b 
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert board_columns for their company boards" 
  ON public.board_columns 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM boards b 
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can update board_columns for their company boards" 
  ON public.board_columns 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM boards b 
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete board_columns for their company boards" 
  ON public.board_columns 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM boards b 
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_id AND ucr.user_id = auth.uid()
  ));

-- Create RLS policies for board_items
CREATE POLICY "Users can view board_items for their company boards" 
  ON public.board_items 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM boards b 
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert board_items for their company boards" 
  ON public.board_items 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM boards b 
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can update board_items for their company boards" 
  ON public.board_items 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM boards b 
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_id AND ucr.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete board_items for their company boards" 
  ON public.board_items 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM boards b 
    JOIN user_company_roles ucr ON b.company_id = ucr.company_id 
    WHERE b.id = board_id AND ucr.user_id = auth.uid()
  ));
