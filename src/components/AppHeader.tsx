import React from 'react';
import { Settings, UserPlus } from 'lucide-react';
import { Language } from '../types/ledger';
import { AppView } from '../types/ui';
import { SyncState } from '../hooks/useHisaab';
import { StorageMode } from '../utils/storage';
import { Translations } from '../utils/i18n';
import { BrandLockup } from './BrandMark';
import { SyncStatus } from './SyncStatus';

interface AppHeaderProps {
  shopName: string;
  lang: Language;
  onLangChange: (lang: Language) => void;
  view: AppView;
  onViewChange: (view: AppView) => void;
  onAddCustomer: () => void;
  onOpenSettings: () => void;
  syncState: SyncState;
  mode: StorageMode | null;
  cloudConfigured: boolean;
  onSyncClick: () => void;
  t: Translations;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  shopName,
  lang,
  onLangChange,
  view,
  onViewChange,
  onAddCustomer,
  onOpenSettings,
  syncState,
  mode,
  cloudConfigured,
  onSyncClick,
  t,
}) => {
  const navItems: { id: AppView; label: string }[] = [
    { id: 'ledger', label: t.navLedger },
    { id: 'reports', label: t.navReports },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onViewChange('ledger')}
          className="min-h-[44px] shrink-0 rounded-xl text-left"
          aria-label={`${t.appName} — ${t.navLedger}`}
        >
          <BrandLockup shopName={shopName} />
        </button>

        <nav className="hidden items-center gap-1 rounded-full border border-line/80 bg-white/60 p-1 lg:flex" aria-label="Main">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
              className={`min-h-[44px] rounded-full px-4 text-sm font-bold transition-colors ${
                view === item.id
                  ? 'bg-hisaab text-cream shadow-sm'
                  : 'text-ink-muted hover:bg-cream-deep hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <SyncStatus
            state={syncState}
            mode={mode}
            cloudConfigured={cloudConfigured}
            t={t}
            onClick={onSyncClick}
          />

          <div className="flex items-center rounded-full border border-line/80 bg-white/60 p-0.5" role="group" aria-label="Language">
            <button
              type="button"
              onClick={() => onLangChange('en')}
              aria-pressed={lang === 'en'}
              className={`min-h-[44px] min-w-[44px] rounded-full px-2 text-xs font-bold transition-colors ${
                lang === 'en' ? 'bg-hisaab text-cream' : 'text-ink-muted hover:text-ink'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLangChange('hi')}
              aria-pressed={lang === 'hi'}
              className={`min-h-[44px] min-w-[44px] rounded-full px-2 text-xs font-bold transition-colors ${
                lang === 'hi' ? 'bg-hisaab text-cream' : 'text-ink-muted hover:text-ink'
              }`}
            >
              हिं
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t.navSettings}
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line/80 bg-white/60 text-ink-muted transition-colors hover:bg-cream-deep hover:text-ink sm:inline-flex"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onAddCustomer}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-saffron px-3.5 text-xs font-bold text-ink transition-colors hover:bg-gold sm:px-4"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{t.addCustomer}</span>
            <span className="sr-only sm:hidden">{t.addCustomer}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
