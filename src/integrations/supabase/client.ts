// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://loukhlwksyslqswxwjyj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdWtobHdrc3lzbHFzd3h3anlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzM5ODcsImV4cCI6MjA2NjYwOTk4N30.BPJ3DlYPQ97IcxvNoJiguvvFYmLgpiXSY3WtNAAbnCs";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);