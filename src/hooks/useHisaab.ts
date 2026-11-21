import { useCallback, useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { ShopData } from '../types/ledger';
import {
  createDefaultShopData,
  mergeShopData,
} from '../utils/ledger';
import {
  getStorageEstimate,
  loadLastSavedAt,
  loadLedger,
  loadMode,
  requestPersistentStorage,
  saveBackup,
  saveLanguage,
  saveLedger,
  saveMode,
  StorageMode,
} from '../utils/storage';
import {
  createServerBackup,
  ensureShop,
  fetchSnapshot,
  friendlyCloudError,
  getSession,
  saveSnapshot,
  saveShopSettings,
  signInWithMagicLink,
  signOut as signOutCloud,
} from '../lib/cloud';
import { getAuthRedirectUrl, isCloudConfigured, supabase } from '../lib/supabase';

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error' | 'conflict';

export interface HisaabStore {
  data: ShopData;
  loaded: boolean;
  mode: StorageMode | null;
  session: Session | null;
  shopId: string | null;
  syncState: SyncState;
  lastSavedAt: number | null;
  storageError: string | null;
  cloudError: string | null;
  authError: string | null;
  authBusy: boolean;
  magicLinkSentTo: string | null;
  cloudConfigured: boolean;
  showAuth: boolean;
  storageEstimate: { usage: number; quota: number } | null;
  setShowAuth: (show: boolean) => void;
  commit: (updater: (prev: ShopData) => ShopData) => Promise<boolean>;
  signIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  useOffline: () => void;
  syncNow: () => Promise<void>;
  backupNow: (reason: string) => Promise<boolean>;
  refreshStorageEstimate: () => Promise<void>;
}

export function useHisaab(): HisaabStore {
  const [data, setData] = useState<ShopData>(() => createDefaultShopData());
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<StorageMode | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(() => loadLastSavedAt());
  const [storageError, setStorageError] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [magicLinkSentTo, setMagicLinkSentTo] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number } | null>(null);

  const dataRef = useRef(data);
  const modeRef = useRef<StorageMode | null>(mode);
  const sessionRef = useRef<Session | null>(session);
  const shopIdRef = useRef<string | null>(shopId);
  const remoteVersionRef = useRef<number | null>(null);
  const connectedUserIdRef = useRef<string | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const syncNowRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    shopIdRef.current = shopId;
  }, [shopId]);

  const refreshStorageEstimate = useCallback(async () => {
    const estimate = await getStorageEstimate();
    setStorageEstimate(estimate);
  }, []);

  const connectCloud = useCallback(async (userId: string, localData: ShopData) => {
    const ensured = await ensureShop(userId, localData);
    if (!ensured.shop) {
      setCloudError(ensured.error ?? 'Could not open your cloud shop.');
      setSyncState('error');
      return;
    }

    connectedUserIdRef.current = userId;
    shopIdRef.current = ensured.shop.id;
    setShopId(ensured.shop.id);

    const remote = await fetchSnapshot(ensured.shop.id);
    if (remote.error) {
      setCloudError(remote.error);
      setSyncState('error');
      return;
    }

    const localEmpty =
      localData.customers.length === 0 && localData.entries.length === 0;
    const remoteEmpty = remote.snapshot
      ? remote.snapshot.data.customers.length === 0 && remote.snapshot.data.entries.length === 0
      : true;

    let next = localData;
    let expected = remote.snapshot?.version ?? null;

    if (remote.snapshot) {
      if (localEmpty) {
        next = remote.snapshot.data;
      } else if (remoteEmpty) {
        next = localData;
      } else {
        next = mergeShopData(localData, remote.snapshot.data);
      }
      remoteVersionRef.current = remote.snapshot.version;
    }

    if (remote.snapshot && localEmpty) {
      setData(next);
      dataRef.current = next;
      await saveLedger(next);
      setSyncState('saved');
      setCloudError(null);
      void refreshStorageEstimate();
      return;
    }

    const saved = await saveSnapshot(ensured.shop.id, next, expected);
    if (saved.ok) {
      remoteVersionRef.current = saved.version ?? expected ?? 1;
      setSyncState('saved');
      setCloudError(null);
      const settings = await saveShopSettings(ensured.shop.id, next);
      if (settings.error) setCloudError(settings.error);
    } else if (saved.conflict && saved.current) {
      const merged = mergeShopData(next, saved.current.data);
      next = merged;
      remoteVersionRef.current = saved.current.version;
      const retry = await saveSnapshot(ensured.shop.id, merged, saved.current.version);
      if (retry.ok) {
        remoteVersionRef.current = retry.version ?? saved.current.version;
        setSyncState('saved');
        setCloudError(null);
      } else {
        setSyncState('error');
        setCloudError(
          retry.error ??
            saved.error ??
            'Another device saved first and the retry failed. Your ledger is still on this phone.'
        );
      }
    } else {
      setSyncState('error');
      setCloudError(saved.error ?? 'Cloud save failed.');
    }

    setData(next);
    dataRef.current = next;
    await saveLedger(next);
    void refreshStorageEstimate();
  }, [refreshStorageEstimate]);

  const syncNow = useCallback(async () => {
    const current = dataRef.current;
    if (!supabase || !sessionRef.current || modeRef.current !== 'cloud') {
      setSyncState('idle');
      return;
    }
    if (!shopIdRef.current) {
      setSyncState('saving');
      await connectCloud(sessionRef.current.user.id, current);
      return;
    }

    const activeShopId = shopIdRef.current;
    setSyncState('saving');
    let result = await saveSnapshot(activeShopId, current, remoteVersionRef.current);

    if (result.ok) {
      remoteVersionRef.current = result.version ?? remoteVersionRef.current;
      setSyncState('saved');
      setCloudError(null);
      setStorageError(null);
      setLastSavedAt(Date.now());
      return;
    }

    if (result.conflict && result.current) {
      const merged = mergeShopData(current, result.current.data);
      dataRef.current = merged;
      setData(merged);
      await saveLedger(merged);
      remoteVersionRef.current = result.current.version;
      result = await saveSnapshot(activeShopId, merged, result.current.version);
      if (result.ok) {
        remoteVersionRef.current = result.version ?? remoteVersionRef.current;
        setSyncState('saved');
        setCloudError(null);
        setStorageError(null);
        setLastSavedAt(Date.now());
        return;
      }
      setSyncState('error');
      setCloudError(
        result.error ??
          'Another device saved first and the retry failed. Your ledger is still on this phone.'
      );
      return;
    }

    setSyncState(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error');
    setCloudError(result.error ?? 'Could not sync to the cloud.');
  }, [connectCloud]);

  useEffect(() => {
    syncNowRef.current = syncNow;
  }, [syncNow]);

  const scheduleSync = useCallback((next: ShopData) => {
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      syncTimerRef.current = null;
      void syncNowRef.current();
    }, 900);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const local = await loadLedger();
      if (!alive) return;

      setData(local.data);
      dataRef.current = local.data;
      setLastSavedAt(loadLastSavedAt());
      if (local.error) setStorageError(local.error);

      const storedMode = loadMode();
      const resolvedMode: StorageMode | null =
        storedMode ??
        (local.data.customers.length > 0 || local.data.entries.length > 0 ? 'local' : null);
      setMode(resolvedMode);
      modeRef.current = resolvedMode;

      if (supabase) {
        try {
          const initialSession = await getSession();
          if (!alive) return;
          setSession(initialSession);
          sessionRef.current = initialSession;
          if (initialSession) {
            setMode('cloud');
            modeRef.current = 'cloud';
            saveMode('cloud');
            await connectCloud(initialSession.user.id, local.data);
          }
        } catch (err) {
          if (alive) setCloudError(friendlyCloudError(err));
        }
      }

      if (alive) {
        setLoaded(true);
        void requestPersistentStorage();
        void refreshStorageEstimate();
      }
    })();

    return () => {
      alive = false;
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [connectCloud, refreshStorageEstimate]);

  useEffect(() => {
    if (!supabase) return;
    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      sessionRef.current = nextSession;

      if (nextSession) {
        setMode('cloud');
        modeRef.current = 'cloud';
        saveMode('cloud');
        setShowAuth(false);
        setAuthError(null);
        if (connectedUserIdRef.current !== nextSession.user.id) {
          void connectCloud(nextSession.user.id, dataRef.current);
        }
      } else if (event === 'SIGNED_OUT') {
        connectedUserIdRef.current = null;
        setShopId(null);
        shopIdRef.current = null;
        remoteVersionRef.current = null;
        setSyncState('idle');
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [connectCloud]);

  useEffect(() => {
    const onOnline = () => {
      void syncNowRef.current();
      void refreshStorageEstimate();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void syncNowRef.current();
      }
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshStorageEstimate]);

  const commit = useCallback(async (updater: (prev: ShopData) => ShopData) => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    setData(next);
    const saved = await saveLedger(next);
    if (saved.ok) {
      setStorageError(null);
      setLastSavedAt(Date.now());
    } else {
      setStorageError(saved.error ?? 'Could not save to this device.');
    }
    scheduleSync(next);
    void refreshStorageEstimate();
    return saved.ok;
  }, [refreshStorageEstimate, scheduleSync]);

  const signIn = useCallback(async (email: string) => {
    setAuthBusy(true);
    setAuthError(null);
    if (!isCloudConfigured) {
      setAuthBusy(false);
      const error = 'Cloud sync is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
      setAuthError(error);
      return { ok: false, error };
    }
    const result = await signInWithMagicLink(email, getAuthRedirectUrl());
    setAuthBusy(false);
    if (!result.ok) {
      setAuthError(result.error ?? 'Could not send the sign-in link.');
      return result;
    }
    setMagicLinkSentTo(email.trim());
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    await signOutCloud();
    setSession(null);
    sessionRef.current = null;
    connectedUserIdRef.current = null;
    setShopId(null);
    shopIdRef.current = null;
    remoteVersionRef.current = null;
    setMode('local');
    modeRef.current = 'local';
    saveMode('local');
    setSyncState('idle');
    setCloudError(null);
    setMagicLinkSentTo(null);
    setShowAuth(false);
  }, []);

  const useOffline = useCallback(() => {
    if (sessionRef.current) {
      void signOutCloud();
      setSession(null);
      sessionRef.current = null;
      connectedUserIdRef.current = null;
      setShopId(null);
      shopIdRef.current = null;
      remoteVersionRef.current = null;
    }
    setMode('local');
    modeRef.current = 'local';
    saveMode('local');
    setShowAuth(false);
    setSyncState('idle');
    setCloudError(null);
  }, []);

  const backupNow = useCallback(async (reason: string) => {
    const record = await saveBackup(dataRef.current, reason);
    if (sessionRef.current && shopIdRef.current) {
      await createServerBackup(shopIdRef.current, dataRef.current, reason);
    }
    if (record) {
      void refreshStorageEstimate();
      return true;
    }
    return false;
  }, [refreshStorageEstimate]);

  return {
    data,
    loaded,
    mode,
    session,
    shopId,
    syncState,
    lastSavedAt,
    storageError,
    cloudError,
    authError,
    authBusy,
    magicLinkSentTo,
    cloudConfigured: isCloudConfigured,
    showAuth,
    storageEstimate,
    setShowAuth,
    commit,
    signIn,
    signOut,
    useOffline,
    syncNow,
    backupNow,
    refreshStorageEstimate,
  };
}

export function persistLanguage(lang: 'en' | 'hi'): void {
  saveLanguage(lang);
}
