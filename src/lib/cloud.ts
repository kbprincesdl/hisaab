import { Session } from '@supabase/supabase-js';
import { ShopData } from '../types/ledger';
import { normalizeStoredData } from '../utils/ledger';
import { supabase } from './supabase';

export interface CloudShop {
  id: string;
  name: string;
  upi_id: string;
  credit_days: number;
}

export interface CloudSnapshot {
  data: ShopData;
  version: number;
  updatedAt: string;
}

function message(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const value = (err as { message?: unknown }).message;
    if (typeof value === 'string') return value;
  }
  return 'Cloud request failed.';
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithMagicLink(
  email: string,
  redirectTo: string
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Cloud sync is not configured.' };
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: true };
  const { error } = await supabase.auth.signOut();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function ensureShop(
  userId: string,
  fallback: ShopData
): Promise<{ shop: CloudShop | null; error?: string }> {
  if (!supabase) return { shop: null, error: 'Cloud sync is not configured.' };

  const selectShop = async () => {
    const { data, error } = await supabase!
      .from('shops')
      .select('id,name,upi_id,credit_days')
      .eq('owner_id', userId)
      .maybeSingle();
    if (error) return { shop: null, error: error.message };
    return { shop: data as CloudShop | null };
  };

  const existing = await selectShop();
  if (existing.shop || existing.error) return existing;
  if (!existing.shop) {
    const { error } = await supabase.from('shops').insert({
      owner_id: userId,
      name: fallback.shop.slice(0, 80) || 'My Kirana Store',
      upi_id: fallback.upiId.slice(0, 120) || 'kirana@upi',
      credit_days: fallback.creditDays,
    });
    if (error && error.code !== '23505') {
      return { shop: null, error: error.message };
    }
    return selectShop();
  }
  return existing;
}

export async function fetchSnapshot(
  shopId: string
): Promise<{ snapshot: CloudSnapshot | null; error?: string }> {
  if (!supabase) return { snapshot: null, error: 'Cloud sync is not configured.' };
  const { data, error } = await supabase
    .from('ledger_snapshots')
    .select('data,version,updated_at')
    .eq('shop_id', shopId)
    .maybeSingle();
  if (error) return { snapshot: null, error: error.message };
  if (!data) return { snapshot: null };
  return {
    snapshot: {
      data: normalizeStoredData(data.data),
      version: Number(data.version) || 1,
      updatedAt: typeof data.updated_at === 'string' ? data.updated_at : new Date().toISOString(),
    },
  };
}

export async function saveSnapshot(
  shopId: string,
  data: ShopData,
  expectedVersion: number | null
): Promise<{
  ok: boolean;
  version?: number;
  conflict?: boolean;
  current?: CloudSnapshot;
  error?: string;
}> {
  if (!supabase) return { ok: false, error: 'Cloud sync is not configured.' };

  const { data: rows, error } = await supabase.rpc('save_ledger_snapshot', {
    p_shop_id: shopId,
    p_data: data,
    p_expected_version: expectedVersion,
  });

  if (error) return { ok: false, error: error.message };

  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) return { ok: false, error: 'The cloud returned no save result.' };

  if (row.conflict) {
    const latest = await fetchSnapshot(shopId);
    return {
      ok: false,
      conflict: true,
      current: latest.snapshot ?? undefined,
      error: latest.error,
    };
  }

  return { ok: true, version: Number(row.version) || undefined };
}

export async function saveShopSettings(shopId: string, data: ShopData): Promise<{ error?: string }> {
  if (!supabase) return {};
  const { error } = await supabase
    .from('shops')
    .update({
      name: data.shop.slice(0, 80),
      upi_id: data.upiId.slice(0, 120),
      credit_days: data.creditDays,
    })
    .eq('id', shopId);
  return error ? { error: error.message } : {};
}

export async function createServerBackup(
  shopId: string,
  data: ShopData,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Cloud sync is not configured.' };
  const { error } = await supabase.from('ledger_backups').insert({
    shop_id: shopId,
    data,
    reason: reason.slice(0, 80) || 'manual',
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export function friendlyCloudError(err: unknown): string {
  return message(err);
}

export function isCloudSetupError(value: string | null | undefined): boolean {
  return Boolean(
    value &&
      /PGRST205|Could not find the table|schema cache|does not exist/i.test(value)
  );
}
