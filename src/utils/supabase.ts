import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️ Supabase environment variables are missing! Using fallbacks if available.\n' +
    'VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗ MISSING',
    '\nVITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗ MISSING'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://ytwygebwskydagwnzstw.supabase.co',
  supabaseKey || 'sb_publishable_FqhPFYoFxxwxbJ_yfNCXOg_VlYXXwFs'
);

