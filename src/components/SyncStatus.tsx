import React from 'react';
import {
  AlertTriangle,
  Check,
  Cloud,
  CloudOff,
  HardDrive,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Translations } from '../utils/i18n';
import { SyncState } from '../hooks/useHisaab';
import { StorageMode } from '../utils/storage';

interface SyncStatusProps {
  state: SyncState;
  mode: StorageMode | null;
  cloudConfigured: boolean;
  t: Translations;
  onClick: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  state,
  mode,
  cloudConfigured,
  t,
  onClick,
}) => {
  const local = mode !== 'cloud';
  const label = local
    ? t.syncStatusIdle
    : state === 'saving'
      ? t.syncStatusSaving
      : state === 'saved'
        ? t.syncStatusSaved
        : state === 'offline'
          ? t.syncStatusOffline
          : state === 'conflict'
            ? t.syncConflict
            : state === 'error'
              ? t.syncStatusError
              : t.syncStatusIdle;

  const Icon = local
    ? HardDrive
    : state === 'saving'
      ? Loader2
      : state === 'saved'
        ? Check
        : state === 'offline'
          ? CloudOff
          : state === 'conflict'
            ? RefreshCw
            : state === 'error'
              ? AlertTriangle
              : Cloud;

  const tone = local
    ? 'border-line bg-cream-deep text-ink-muted'
    : state === 'saved'
      ? 'border-settled/20 bg-settled-soft text-settled'
      : state === 'saving'
        ? 'border-line bg-cream-deep text-ink-muted'
        : state === 'offline'
          ? 'border-due/20 bg-due-soft text-due'
          : state === 'error' || state === 'conflict'
            ? 'border-overdue/20 bg-overdue-soft text-overdue'
            : 'border-line bg-cream-deep text-ink-muted';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={cloudConfigured ? label : `${label} — ${t.cloudNotConfigured}`}
      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors hover:brightness-[0.98] ${tone}`}
    >
      <Icon className={`h-4 w-4 ${state === 'saving' && !local ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};
