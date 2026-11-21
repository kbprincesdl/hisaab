import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined);

const publishableKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined);

export const isCloudConfigured = Boolean(url && publishableKey);

export function getSupabaseSqlEditorUrl(): string | null {
  if (!url) return null;
  try {
    const projectRef = new URL(url).hostname.split('.')[0];
    return projectRef ? `https://supabase.com/dashboard/project/${projectRef}/sql/new` : null;
  } catch {
    return null;
  }
}

export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(url as string, publishableKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
