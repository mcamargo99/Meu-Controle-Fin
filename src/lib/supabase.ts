import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://c--053007ea-8c81-4751-afc2-fad2b70c51c5-prod.lovable.cloud';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9IOP3t-IjuvszA0p7QXy3w_TYJwZrvT';
export const SUPABASE_PROJECT_ID = 'pivrudulazqjbzabmnfz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
