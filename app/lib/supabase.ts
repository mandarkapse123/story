import { createClient } from '@supabase/supabase-js';

// Fallback to placeholders during build/prerender to prevent compiler crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase environment variables are missing! Please make sure to define ' +
    'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your env settings.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
