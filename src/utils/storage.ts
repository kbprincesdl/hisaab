import { get, set } from 'idb-keyval';
import { BackupRecord, Language, ShopData } from '../types/ledger';
import {
  LANG_STORAGE_KEY,
  STORAGE_KEY as LEGACY_STORAGE_KEY,
  createDefaultShopData,
  createReminderId,
  normalizeStoredData,
} from './ledger';

export const LEDGER_KEY = 'hisaab_ledger_v2';
export const BACKUPS_KEY = 'hisaab_backups_v1';
export const MODE_KEY = 'hisaab_mode_v1';
export const LANGUAGE_KEY = LANG_STORAGE_KEY;
export const LAST_SAVED_KEY = 'hisaab_last_saved_v1';
export const MAX_BACKUPS = 5;

export type StorageMode = 'local' | 'cloud';

export interface LoadResult {
  data: ShopData;
  source: 'indexeddb' | 'localstorage' | 'default';
  error?: string;
}

function canUseDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function readLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocalStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function loadLedger(): Promise<LoadResult> {
  if (!canUseDom()) {
    return { data: createDefaultShopData(), source: 'default' };
  }

  try {
    const stored = await get<unknown>(LEDGER_KEY);
    if (stored) {
      return { data: normalizeStoredData(stored), source: 'indexeddb' };
    }
  } catch (err) {
    return {
      data: createDefaultShopData(),
      source: 'default',
      error: err instanceof Error ? err.message : 'IndexedDB is unavailable.',
    };
  }

  // One-time migration from the original localStorage build.
  const legacy = readLocalStorage(LEGACY_STORAGE_KEY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      const data = normalizeStoredData(parsed);
      try {
        await set(LEDGER_KEY, data);
      } catch {
        // Keep working from localStorage if IndexedDB is unavailable.
      }
      return { data, source: 'localstorage' };
    } catch {
      // Ignore a corrupt legacy value and start clean.
    }
  }

  return { data: createDefaultShopData(), source: 'default' };
}

export async function saveLedger(data: ShopData): Promise<{ ok: boolean; error?: string }> {
  if (!canUseDom()) return { ok: false, error: 'Storage is unavailable.' };
  try {
    await set(LEDGER_KEY, data);
    writeLocalStorage(LAST_SAVED_KEY, String(Date.now()));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save to this device.',
    };
  }
}

export async function loadBackups(): Promise<BackupRecord[]> {
  if (!canUseDom()) return [];
  try {
    const stored = await get<unknown>(BACKUPS_KEY);
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is BackupRecord => {
      if (!item || typeof item !== 'object') return false;
      const rec = item as Partial<BackupRecord>;
      return typeof rec.id === 'string' && typeof rec.savedAt === 'number' && !!rec.data;
    });
  } catch {
    return [];
  }
}

export async function saveBackup(data: ShopData, reason: string): Promise<BackupRecord | null> {
  if (!canUseDom()) return null;
  const record: BackupRecord = {
    id: createReminderId(),
    savedAt: Date.now(),
    reason: reason.slice(0, 80) || 'manual',
    data,
  };
  try {
    const existing = await loadBackups();
    await set(BACKUPS_KEY, [record, ...existing].slice(0, MAX_BACKUPS));
    return record;
  } catch {
    return null;
  }
}

export async function deleteBackup(id: string): Promise<boolean> {
  if (!canUseDom()) return false;
  try {
    const existing = await loadBackups();
    await set(BACKUPS_KEY, existing.filter((item) => item.id !== id));
    return true;
  } catch {
    return false;
  }
}

export function loadLanguage(): Language {
  if (!canUseDom()) return 'en';
  const saved = readLocalStorage(LANGUAGE_KEY);
  return saved === 'hi' ? 'hi' : 'en';
}

export function saveLanguage(lang: Language): void {
  writeLocalStorage(LANGUAGE_KEY, lang);
}

export function loadMode(): StorageMode | null {
  if (!canUseDom()) return null;
  const value = readLocalStorage(MODE_KEY);
  return value === 'cloud' || value === 'local' ? value : null;
}

export function saveMode(mode: StorageMode): void {
  writeLocalStorage(MODE_KEY, mode);
}

export function loadLastSavedAt(): number | null {
  const raw = readLocalStorage(LAST_SAVED_KEY);
  const value = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!canUseDom() || !navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!canUseDom() || !navigator.storage?.estimate) return null;
  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
    };
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function createBackupFile(data: ShopData): string {
  return JSON.stringify(
    {
      format: 'hisaab-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2
  );
}
