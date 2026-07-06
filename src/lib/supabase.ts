import { createClient } from '@supabase/supabase-js';

const defaultUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const defaultKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = defaultUrl && defaultKey ? createClient(defaultUrl, defaultKey) : null;

export function createDynamicSupabaseClient(url: string, key: string) {
  if (!url || !key) return null;
  try {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    return createClient(cleanUrl, key.trim());
  } catch (error) {
    console.error('Lỗi khởi tạo Supabase client:', error);
    return null;
  }
}
