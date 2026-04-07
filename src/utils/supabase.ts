import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Supabase environment variables are missing!\n' +
    'VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗ MISSING',
    '\nVITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗ MISSING',
    '\n\nIf deploying to Vercel: add these in Project Settings → Environment Variables, then Redeploy.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://ytwygebwskydagwnzstw.supabase.co',
  supabaseKey || 'sb_publishable_FqhPFYoFxxwxbJ_yfNCXOg_VlYXXwFs'
);

