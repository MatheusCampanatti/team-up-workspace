
-- Enable realtime for item_values table
ALTER TABLE public.item_values REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_values;
