import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Centralized Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ovmodvuelqasgsdrbptk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bW9kdnVlbHFhc2dzZHJicHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDUzNjYsImV4cCI6MjA2NjI4MTM2Nn0.OAey7qYJ23NVJycRs2fslqQ1eHcMIhY98P1NQfW9Th4';

// Create the main Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'ares-system',
    },
  },
});

// Factory function to create Supabase client with custom configuration
export const createSupabaseClient = (customConfig?: {
  url?: string;
  anonKey?: string;
  options?: any;
}): SupabaseClient => {
  const url = customConfig?.url || supabaseUrl;
  const key = customConfig?.anonKey || supabaseAnonKey;
  const options = customConfig?.options || {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'ares-system',
      },
    },
  };

  return createClient(url, key, options);
};

// Storage helper functions
export const uploadFile = async (
  file: File,
  path: string,
  bucket: string = 'ares-files'
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  return data;
};

export const getPublicUrl = (path: string, bucket: string = 'ares-files') => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};

export const downloadFile = async (path: string, bucket: string = 'ares-files') => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);

  if (error) {
    throw error;
  }

  return data;
};

export const deleteFile = async (path: string, bucket: string = 'ares-files') => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw error;
  }

  return true;
};

export const listFiles = async (path: string = '', bucket: string = 'ares-files') => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit: 100,
      offset: 0,
    });

  if (error) {
    throw error;
  }

  return data;
};