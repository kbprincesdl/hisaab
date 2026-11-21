import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Cloud,
  Copy,
  Database,
  Download,
  ExternalLink,
  HardDrive,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Upload,
  UserRound,
} from 'lucide-react';
import { BackupRecord, ShopData } from '../types/ledger';
import { Translations } from '../utils/i18n';
import {
  formatBytes,
  requestPersistentStorage,
  StorageMode,
} from '../utils/storage';
import { formatRelativeTime } from '../utils/ledger';
import { SyncState } from '../hooks/useHisaab';
import { isCloudSetupError } from '../lib/cloud';
import { getSupabaseSqlEditorUrl } from '../lib/supabase';
import { Sheet } from './Sheet';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  data: ShopData;
  commit: (updater: (prev: ShopData) => ShopData) => Promise<boolean>;
  mode: StorageMode | null;
  sessionEmail: string | null;
  syncState: SyncState;
  lastSavedAt: number | null;
  storageError: string | null;
  cloudError: string | null;
  cloudConfigured: boolean;
  storageEstimate: { usage: number; quota: number } | null;
  backups: BackupRecord[];
  onSignIn: () => void;
  onSignOut: () => void;
  onSyncNow: () => void;
  onUseOffline: () => void;
  onOpenImport: (initialText?: string) => void;
  onLoadSample: () => void;
  onExportBackup: () => void;
  onBackupNow: () => void;
  onRestoreBackup: (backup: BackupRecord) => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  open,
  onClose,
  t,
  data,
  commit,
  mode,
  sessionEmail,
  syncState,
  lastSavedAt,
  storageError,
  cloudError,
  cloudConfigured,
  storageEstimate,
  backups,
  onSignIn,
  onSignOut,
  onSyncNow,
  onUseOffline,
  onOpenImport,
  onLoadSample,
  onExportBackup,
  onBackupNow,
  onRestoreBackup,
}) => {
  const [shopName, setShopName] = useState(data.shop);
  const [upiId, setUpiId] = useState(data.upiId);
  const [creditDays, setCreditDays] = useState(String(data.creditDays));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const setupError = isCloudSetupError(cloudError);
  const sqlEditorUrl = getSupabaseSqlEditorUrl();

  useEffect(() => {
    if (!open) return;
    setShopName(data.shop);
    setUpiId(data.upiId);
    setCreditDays(String(data.creditDays));
    setError(null);
    setSaved(false);
    if (navigator.storage?.persisted) {
      navigator.storage.persisted().then(setPersistent).catch(() => setPersistent(false));
    }
  }, [open, data.shop, data.upiId, data.creditDays]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanShop = shopName.trim();
    const cleanUpi = upiId.trim();
    const days = Number(creditDays);
    if (!cleanShop) {
      setError(t.invalidShopName);
      return;
    }
    if (!cleanUpi || cleanUpi.includes(' ') || cleanUpi.length < 3) {
      setError(t.invalidUpi);
      return;
    }
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setError(t.invalidCreditDays);
      return;
    }
    setError(null);
    const ok = await commit((prev) => ({
      ...prev,
      shop: cleanShop.slice(0, 80),
      upiId: cleanUpi.slice(0, 120),
      creditDays: days,
    }));
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
  };

  const handlePersistent = async () => {
    const granted = await requestPersistentStorage();
    setPersistent(granted);
  };

  const copySetupSql = async () => {
    try {
      const response = await fetch('/setup.sql');
      if (!response.ok) throw new Error('Could not load setup.sql');
      const sql = await response.text();
      await navigator.clipboard.writeText(sql);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2200);
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t.settingsTitle}
      closeLabel={t.close}
      size="lg"
    >
      <div className="space-y-6">
        {storageError && (
          <p className="rounded-2xl bg-overdue-soft px-4 py-3 text-xs font-bold text-overdue">
            {storageError}
          </p>
        )}

        {cloudError && setupError && (
          <div className="rounded-2xl border border-due/25 bg-due-soft/80 p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold text-due">
              <AlertTriangle className="h-4 w-4" />
              {t.cloudSetupTitle}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-due">{t.cloudSetupBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copySetupSql}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-due px-3.5 text-xs font-bold text-white hover:bg-due/90"
              >
                <Copy className="h-4 w-4" />
                {copyState === 'copied'
                  ? t.setupSqlCopied
                  : copyState === 'failed'
                    ? t.importError
                    : t.copySetupSql}
              </button>
              {sqlEditorUrl && (
                <a
                  href={sqlEditorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-due/25 bg-white/60 px-3.5 text-xs font-bold text-due hover:bg-white"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t.openSqlEditor}
                </a>
              )}
            </div>
            <p className="mt-2 text-[10px] font-semibold text-due/80">
              supabase/migrations/0001_init.sql
            </p>
          </div>
        )}

        {cloudError && !setupError && (
          <p className="rounded-2xl bg-due-soft px-4 py-3 text-xs font-bold text-due">
            {cloudError}
          </p>
        )}

        <section>
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <Cloud className="h-4 w-4 text-hisaab" />
            {t.accountSection}
          </h3>
          <div className="mt-2 rounded-2xl border border-line bg-white/70 p-4">
            {sessionEmail ? (
              <>
                <p className="flex items-center gap-2 text-sm font-bold text-ink">
                  <UserRound className="h-4 w-4 text-settled" />
                  {t.signedInAs(sessionEmail)}
                </p>
                <p className={`mt-1 text-xs ${setupError ? 'font-semibold text-due' : 'text-ink-muted'}`}>
                  {setupError ? t.cloudSetupShort : t.cloudConnected}
                  {lastSavedAt ? ` · ${t.lastSavedAt(formatRelativeTime(lastSavedAt))}` : ''}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onSyncNow}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-hisaab px-4 text-xs font-bold text-cream hover:bg-hisaab-deep"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncState === 'saving' ? 'animate-spin' : ''}`} />
                    {t.syncNow}
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-bold text-ink-muted hover:bg-cream-deep hover:text-ink"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.signOut}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-sm font-bold text-ink">
                  <HardDrive className="h-4 w-4 text-ink-muted" />
                  {t.localOnly}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {cloudConfigured ? t.backUpToCloud : t.cloudNotConfiguredHint}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onSignIn}
                    disabled={!cloudConfigured}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-hisaab px-4 text-xs font-bold text-cream hover:bg-hisaab-deep disabled:opacity-50"
                  >
                    <Cloud className="h-4 w-4" />
                    {t.signIn}
                  </button>
                  {mode === 'cloud' && (
                    <button
                      type="button"
                      onClick={onUseOffline}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-bold text-ink-muted hover:bg-cream-deep hover:text-ink"
                    >
                      <HardDrive className="h-4 w-4" />
                      {t.useOffline}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <ShieldCheck className="h-4 w-4 text-hisaab" />
            {t.shopSettings}
          </h3>
          <form onSubmit={handleSave} className="mt-2 space-y-3 rounded-2xl border border-line bg-white/70 p-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="settings-shop">
                {t.shopNameLabel}
              </label>
              <input
                id="settings-shop"
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="min-h-[48px] w-full rounded-2xl border border-line bg-white px-3.5 text-sm font-semibold text-ink focus:border-hisaab focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="settings-upi">
                {t.upiIdLabel}
              </label>
              <input
                id="settings-upi"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="min-h-[48px] w-full rounded-2xl border border-line bg-white px-3.5 font-mono text-sm text-ink focus:border-hisaab focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-ink-muted">{t.upiIdHint}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="settings-days">
                {t.creditPeriod}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="settings-days"
                  type="number"
                  min="1"
                  max="365"
                  step="1"
                  value={creditDays}
                  onChange={(e) => setCreditDays(e.target.value)}
                  className="min-h-[48px] w-28 rounded-2xl border border-line bg-white px-3.5 text-sm font-semibold text-ink tabular-nums focus:border-hisaab focus:outline-none"
                />
                <span className="text-xs font-bold text-ink-muted">{t.daysUnit}</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted">{t.creditPeriodHint}</p>
            </div>
            {error && (
              <p className="rounded-xl bg-overdue-soft px-3 py-2 text-xs font-bold text-overdue" role="alert">
                {error}
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              {saved && <span className="text-xs font-bold text-settled">{t.syncStatusSaved}</span>}
              <button
                type="submit"
                className="min-h-[44px] rounded-full bg-hisaab px-5 text-xs font-extrabold text-cream hover:bg-hisaab-deep"
              >
                {t.saveSettings}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <Database className="h-4 w-4 text-hisaab" />
            {t.backupSection}
          </h3>
          <div className="mt-2 rounded-2xl border border-line bg-white/70 p-4">
            <p className="text-xs text-ink-muted">
              {lastSavedAt ? t.lastSavedAt(formatRelativeTime(lastSavedAt)) : t.notBackedUp}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportBackup}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-bold text-ink hover:bg-cream-deep"
              >
                <Download className="h-4 w-4 text-hisaab" />
                {t.exportBackup}
              </button>
              <button
                type="button"
                onClick={onBackupNow}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-bold text-ink hover:bg-cream-deep"
              >
                <Database className="h-4 w-4 text-saffron-ink" />
                {t.backupNow}
              </button>
              <button
                type="button"
                onClick={() => onOpenImport()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-bold text-ink hover:bg-cream-deep"
              >
                <Upload className="h-4 w-4 text-hisaab" />
                {t.importRestore}
              </button>
            </div>

            <div className="mt-4 border-t border-line/70 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                {t.localBackups}
              </p>
              {backups.length === 0 ? (
                <p className="mt-1 text-xs text-ink-muted">{t.noBackups}</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {backups.slice(0, 3).map((backup) => (
                    <li key={backup.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate text-ink-muted">
                        {formatRelativeTime(backup.savedAt)}
                        <span className="mx-1.5 text-line">·</span>
                        {backup.reason}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRestoreBackup(backup)}
                        className="min-h-[44px] shrink-0 rounded-full border border-line bg-white px-3 text-[11px] font-bold text-ink hover:bg-cream-deep"
                      >
                        {t.restore}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <HardDrive className="h-4 w-4 text-hisaab" />
            {t.storageSection}
          </h3>
          <div className="mt-2 rounded-2xl border border-line bg-white/70 p-4">
            <p className="text-xs text-ink-muted">
              {t.storageUsed(
                formatBytes(storageEstimate?.usage ?? 0),
                storageEstimate?.quota ? formatBytes(storageEstimate.quota) : ''
              )}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePersistent}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-bold text-ink hover:bg-cream-deep"
              >
                <ShieldCheck className="h-4 w-4 text-settled" />
                {t.requestPersistent}
              </button>
              <span className={`text-xs font-semibold ${persistent ? 'text-settled' : 'text-ink-muted'}`}>
                {persistent ? t.persistentOn : t.persistentOff}
              </span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <Database className="h-4 w-4 text-saffron-ink" />
            {t.demoSection}
          </h3>
          <div className="mt-2 rounded-2xl border border-line bg-white/70 p-4">
            <p className="text-xs text-ink-muted">{t.loadSampleHint}</p>
            <button
              type="button"
              onClick={onLoadSample}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-bold text-ink hover:bg-cream-deep"
            >
              <Upload className="h-4 w-4 text-saffron-ink" />
              {t.loadSampleShop}
            </button>
          </div>
        </section>
      </div>
    </Sheet>
  );
};
