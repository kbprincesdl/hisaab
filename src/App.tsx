import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Database,
  Download,
  Loader2,
  Search,
  Settings as SettingsIcon,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import { AppHeader } from './components/AppHeader';
import { AuthScreen } from './components/AuthScreen';
import { BrandMark } from './components/BrandMark';
import { CustomerDetail } from './components/CustomerDetail';
import { CustomerFormSheet } from './components/CustomerFormSheet';
import { CustomerRow } from './components/CustomerRow';
import { ImportSheet } from './components/ImportSheet';
import { OutstandingBand } from './components/OutstandingBand';
import { QuickEntrySheet } from './components/QuickEntrySheet';
import { ReportsView } from './components/ReportsView';
import { SettingsSheet } from './components/SettingsSheet';
import { useHisaab } from './hooks/useHisaab';
import { isCloudSetupError } from './lib/cloud';
import {
  BackupRecord,
  Customer,
  EntryType,
  Language,
  LedgerEntry,
  PaymentMethod,
  Reminder,
  ShopData,
} from './types/ledger';
import { AppView, LedgerTab, QuickEntryState } from './types/ui';
import { getTranslations } from './utils/i18n';
import {
  SAMPLE_SHOP_JSON,
  computeCustomerSummaries,
  computeTotalDueSoon,
  computeTotalOutstanding,
  computeTotalOverdue,
  createEntryId,
  createReminderId,
  formatRupees,
  formatRelativeTime,
  generateCsv,
  getEffectiveToday,
  parseImportJsonStrict,
  roundMoney,
} from './utils/ledger';
import {
  createBackupFile,
  loadBackups,
  loadLanguage,
  saveLanguage,
} from './utils/storage';

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function safeFilename(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'hisaab'
  );
}

const Splash: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex min-h-screen items-center justify-center bg-cream px-6">
    <div className="text-center">
      <BrandMark size={56} className="mx-auto text-hisaab" />
      <p className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink">Hisaab</p>
      <p className="mt-1 flex items-center justify-center gap-2 text-xs font-semibold text-ink-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {title}
      </p>
    </div>
  </div>
);

const SideCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <section className="rounded-[1.5rem] border border-line bg-white/70 p-4">
    <h2 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-ink-muted">
      {icon}
      {title}
    </h2>
    <div className="mt-3">{children}</div>
  </section>
);

const SideRow: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone = 'text-ink' }) => (
  <div className="flex items-center justify-between gap-2 py-1">
    <span className="text-xs text-ink-muted">{label}</span>
    <span className={`text-xs font-extrabold tabular-nums ${tone}`}>{value}</span>
  </div>
);

export default function App() {
  const store = useHisaab();
  const [lang, setLang] = useState<Language>(() => loadLanguage());
  const t = useMemo(() => getTranslations(lang), [lang]);
  const [view, setView] = useState<AppView>('ledger');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [tab, setTab] = useState<LedgerTab>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'name' | 'balance' | 'overdue'>('name');
  const [quickEntry, setQuickEntry] = useState<QuickEntryState>(null);
  const [customerSheet, setCustomerSheet] = useState<{
    mode: 'add' | 'edit';
    customer?: Customer;
  } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState<string | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);

  const data = store.data;
  const todayIso = useMemo(() => getEffectiveToday(), []);

  const summaries = useMemo(
    () =>
      computeCustomerSummaries(
        data.customers,
        data.entries,
        todayIso,
        data.creditDays,
        data.reminders
      ),
    [data.customers, data.entries, data.creditDays, data.reminders, todayIso]
  );

  const totalOutstanding = useMemo(() => computeTotalOutstanding(summaries), [summaries]);
  const totalOverdue = useMemo(() => computeTotalOverdue(summaries), [summaries]);
  const totalDueSoon = useMemo(() => computeTotalDueSoon(summaries), [summaries]);
  const customersOwingCount = useMemo(
    () => summaries.filter((summary) => summary.balance > 0).length,
    [summaries]
  );
  const overdueSummaries = useMemo(
    () => summaries.filter((summary) => summary.overdueAmount > 0),
    [summaries]
  );
  const dueSoonSummaries = useMemo(
    () => summaries.filter((summary) => summary.dueSoonAmount > 0),
    [summaries]
  );

  const todayEntries = useMemo(
    () => data.entries.filter((entry) => entry.date === todayIso),
    [data.entries, todayIso]
  );
  const collectedToday = useMemo(
    () =>
      roundMoney(
        todayEntries.filter((entry) => entry.type === 'payment').reduce((sum, entry) => sum + entry.amount, 0)
      ),
    [todayEntries]
  );
  const creditToday = useMemo(
    () =>
      roundMoney(
        todayEntries.filter((entry) => entry.type === 'credit').reduce((sum, entry) => sum + entry.amount, 0)
      ),
    [todayEntries]
  );

  const displayedSummaries = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = summaries;

    if (tab === 'overdue') list = list.filter((summary) => summary.overdueAmount > 0);
    if (tab === 'dueSoon') list = list.filter((summary) => summary.dueSoonAmount > 0);

    if (query) {
      list = list.filter(
        (summary) =>
          summary.customer.name.toLowerCase().includes(query) ||
          summary.customer.phone.includes(query)
      );
    }

    const sorted = [...list];
    if (tab === 'overdue') {
      sorted.sort((a, b) => b.daysOverdue - a.daysOverdue || b.balance - a.balance);
    } else if (tab === 'dueSoon') {
      sorted.sort(
        (a, b) =>
          (a.oldestDueDate ?? '').localeCompare(b.oldestDueDate ?? '') ||
          b.balance - a.balance
      );
    } else if (sort === 'balance') {
      sorted.sort((a, b) => b.balance - a.balance);
    } else if (sort === 'overdue') {
      sorted.sort((a, b) => b.daysOverdue - a.daysOverdue || b.balance - a.balance);
    } else {
      sorted.sort((a, b) => a.customer.name.localeCompare(b.customer.name));
    }
    return sorted;
  }, [summaries, tab, search, sort]);

  const selectedSummary = useMemo(
    () => summaries.find((summary) => summary.customer.phone === selectedPhone) ?? null,
    [summaries, selectedPhone]
  );
  const selectedEntries = useMemo(
    () => (selectedPhone ? data.entries.filter((entry) => entry.phone === selectedPhone) : []),
    [data.entries, selectedPhone]
  );
  const existingPhones = useMemo(
    () => new Set(data.customers.map((customer) => customer.phone)),
    [data.customers]
  );

  const agingTotals = useMemo(
    () =>
      summaries.reduce(
        (acc, summary) => ({
          current: roundMoney(acc.current + summary.aging.current),
          days1to15: roundMoney(acc.days1to15 + summary.aging.days1to15),
          days16to30: roundMoney(acc.days16to30 + summary.aging.days16to30),
          days31to60: roundMoney(acc.days31to60 + summary.aging.days31to60),
          days60plus: roundMoney(acc.days60plus + summary.aging.days60plus),
        }),
        { current: 0, days1to15: 0, days16to30: 0, days31to60: 0, days60plus: 0 }
      ),
    [summaries]
  );

  const refreshBackups = useCallback(async () => {
    setBackups(await loadBackups());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    saveLanguage(lang);
  }, [lang]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!settingsOpen) return;
    void refreshBackups();
    void store.refreshStorageEstimate();
  }, [settingsOpen, refreshBackups, store.refreshStorageEstimate]);

  useEffect(() => {
    if (selectedPhone && !selectedSummary) setSelectedPhone(null);
  }, [selectedPhone, selectedSummary]);

  useEffect(() => {
    if (view === 'ledger' && selectedPhone) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedPhone, view]);

  useEffect(() => {
    if (!lightboxSrc) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxSrc(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxSrc]);

  const handleLangChange = (next: Language) => setLang(next);

  const handleViewChange = (next: AppView) => {
    setView(next);
    setSelectedPhone(null);
    if (next === 'reports') setSettingsOpen(false);
  };

  const handleRemind = (phone: string) => {
    const customer = data.customers.find((item) => item.phone === phone);
    const reminder: Reminder = {
      id: createReminderId(),
      phone,
      sentAt: Date.now(),
      channel: 'whatsapp',
      lang: customer?.language ?? lang,
    };
    void store.commit((prev) => ({
      ...prev,
      reminders: [...prev.reminders, reminder],
    }));
    setToast(t.reminderOpened);
  };

  const handleQuickEntry = (payload: {
    phone: string;
    type: EntryType;
    amount: number;
    date: string;
    note: string;
    method?: PaymentMethod;
  }) => {
    const entry: LedgerEntry = {
      id: createEntryId(),
      phone: payload.phone,
      type: payload.type,
      amount: payload.amount,
      date: payload.date,
      note: payload.note,
      method: payload.method,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    void store.commit((prev) => ({ ...prev, entries: [...prev.entries, entry] }));
    setToast(payload.type === 'payment' ? t.paymentSaved : t.creditSaved);
  };

  const handleAddEntry = (payload: {
    type: EntryType;
    amount: number;
    date: string;
    note: string;
    method?: PaymentMethod;
    shot?: string;
  }) => {
    if (!selectedPhone) return;
    const entry: LedgerEntry = {
      id: createEntryId(),
      phone: selectedPhone,
      type: payload.type,
      amount: payload.amount,
      date: payload.date,
      note: payload.note,
      method: payload.method,
      shot: payload.shot,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    void store.commit((prev) => ({ ...prev, entries: [...prev.entries, entry] }));
    setToast(payload.type === 'payment' ? t.paymentSaved : t.creditSaved);
  };

  const handleUpdateEntry = (
    id: string,
    payload: {
      type: EntryType;
      amount: number;
      date: string;
      note: string;
      method?: PaymentMethod;
      shot?: string;
    }
  ) => {
    void store.commit((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              type: payload.type,
              amount: payload.amount,
              date: payload.date,
              note: payload.note,
              method: payload.method,
              shot: payload.shot,
              updatedAt: Date.now(),
            }
          : entry
      ),
    }));
    setToast(t.entryUpdated);
  };

  const handleDeleteEntry = (id: string) => {
    void store.commit((prev) => ({
      ...prev,
      entries: prev.entries.filter((entry) => entry.id !== id),
    }));
    setToast(t.deletedLabel);
  };

  const handleSaveCustomer = (customer: Customer) => {
    const mode = customerSheet?.mode ?? 'add';
    void store.commit((prev) => ({
      ...prev,
      customers:
        mode === 'edit'
          ? prev.customers.map((item) =>
              item.phone === customer.phone ? { ...item, ...customer } : item
            )
          : [...prev.customers, customer],
    }));
    setCustomerSheet(null);
    setToast(t.customerSaved);
  };

  const handleExportCsv = () => {
    const csv = generateCsv(data, summaries);
    downloadFile(`${safeFilename(data.shop)}-${todayIso}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const handleExportBackup = () => {
    downloadFile(
      `hisaab-backup-${todayIso}.json`,
      createBackupFile(data),
      'application/json;charset=utf-8'
    );
  };

  const handleBackupNow = async () => {
    const ok = await store.backupNow('manual');
    setToast(ok ? t.backupCreated : t.importError);
    await refreshBackups();
  };

  const handleOpenImport = (text?: string) => {
    setImportText(text);
    setImportOpen(true);
    setSettingsOpen(false);
  };

  const handleReplaceLedger = async (imported: ShopData) => {
    await store.backupNow('before-import');
    await store.commit(() => imported);
    setToast(t.importSuccess(imported.customers.length, imported.entries.length));
    await refreshBackups();
  };

  const handleRestoreBackup = async (backup: BackupRecord) => {
    const parsed = parseImportJsonStrict(JSON.stringify(backup.data), data);
    if (!parsed.ok) {
      setToast(t.importError);
      return;
    }
    if (!window.confirm(t.restoreConfirm)) return;
    await store.backupNow('before-restore');
    await store.commit(() => parsed.data);
    setToast(t.importSuccess(parsed.data.customers.length, parsed.data.entries.length));
    await refreshBackups();
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleSignOut = async () => {
    await store.signOut();
    setSettingsOpen(false);
    setToast(t.signedOut);
  };

  const handleAddCustomer = () => setCustomerSheet({ mode: 'add' });

  const handleEditCustomer = (customer: Customer) =>
    setCustomerSheet({ mode: 'edit', customer });

  const hasLocalData = data.customers.length > 0 || data.entries.length > 0;
  const canCloseAuth = Boolean(store.mode) || hasLocalData;

  if (!store.loaded) {
    return <Splash title={t.loadingLedger} />;
  }

  if (store.showAuth || (!store.mode && !store.session)) {
    return (
      <AuthScreen
        t={t}
        cloudConfigured={store.cloudConfigured}
        busy={store.authBusy}
        error={store.authError}
        sentTo={store.magicLinkSentTo}
        hasLocalData={hasLocalData}
        onSignIn={store.signIn}
        onUseOffline={store.useOffline}
        onClose={canCloseAuth ? () => store.setShowAuth(false) : undefined}
      />
    );
  }

  const agingMax = Math.max(
    agingTotals.days1to15,
    agingTotals.days16to30,
    agingTotals.days31to60,
    agingTotals.days60plus,
    1
  );

  return (
    <div className="min-h-screen bg-cream pb-24 lg:pb-0">
      <AppHeader
        shopName={data.shop}
        lang={lang}
        onLangChange={handleLangChange}
        view={view}
        onViewChange={handleViewChange}
        onAddCustomer={handleAddCustomer}
        onOpenSettings={handleOpenSettings}
        syncState={store.syncState}
        mode={store.mode}
        cloudConfigured={store.cloudConfigured}
        onSyncClick={handleOpenSettings}
        t={t}
      />

      {store.session && store.cloudError && (
        <div className="border-b border-due/20 bg-due-soft">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 sm:px-6">
            <p className="text-xs font-bold text-due">
              {isCloudSetupError(store.cloudError) ? t.cloudSetupShort : t.syncStatusError}
            </p>
            <button
              type="button"
              onClick={handleOpenSettings}
              className="inline-flex min-h-[44px] items-center rounded-full border border-due/25 bg-white/60 px-3 text-[11px] font-bold text-due hover:bg-white"
            >
              {t.navSettings}
            </button>
          </div>
        </div>
      )}

      {view === 'reports' ? (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <ReportsView data={data} summaries={summaries} todayIso={todayIso} t={t} />
        </main>
      ) : selectedSummary ? (
        <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
          <CustomerDetail
            summary={selectedSummary}
            entries={selectedEntries}
            shopName={data.shop}
            upiId={data.upiId}
            todayIso={todayIso}
            lang={lang}
            t={t}
            initialEntryType={quickEntry?.type ?? 'payment'}
            onBack={() => setSelectedPhone(null)}
            onAddEntry={handleAddEntry}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onOpenLightbox={setLightboxSrc}
            onCollect={() => setQuickEntry({ phone: selectedSummary.customer.phone, type: 'payment' })}
            onRemind={() => handleRemind(selectedSummary.customer.phone)}
            onEditCustomer={() => handleEditCustomer(selectedSummary.customer)}
          />
        </main>
      ) : (
        <>
          <OutstandingBand
            shopName={data.shop}
            totalOutstanding={totalOutstanding}
            overdueAmount={totalOverdue}
            dueSoonAmount={totalDueSoon}
            customersOwingCount={customersOwingCount}
            totalCustomers={data.customers.length}
            overdueCount={overdueSummaries.length}
            onCollect={() => setQuickEntry({ type: 'payment' })}
            onViewOverdue={() => {
              setTab('overdue');
              document.getElementById('ledger')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            t={t}
          />

          <main id="ledger" className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
              <div className="space-y-3 lg:col-span-8">
                <div className="rounded-[1.5rem] border border-line bg-white/70 p-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-cream-deep/70 p-1">
                      {[
                        { id: 'all' as LedgerTab, label: t.allCustomers, count: data.customers.length },
                        { id: 'overdue' as LedgerTab, label: t.overdueList, count: overdueSummaries.length },
                        { id: 'dueSoon' as LedgerTab, label: t.dueSoon, count: dueSoonSummaries.length },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTab(item.id)}
                          aria-pressed={tab === item.id}
                          className={`min-h-[44px] rounded-full px-2.5 text-[11px] font-extrabold transition-colors sm:px-3.5 sm:text-xs ${
                            tab === item.id
                              ? 'bg-hisaab text-cream shadow-sm'
                              : 'text-ink-muted hover:text-ink'
                          }`}
                        >
                          {item.label}
                          <span className={`ml-1 ${tab === item.id ? 'text-cream/60' : 'text-ink-muted'}`}>
                            {item.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="relative min-w-[170px] flex-1">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label={t.searchPlaceholder}
                        placeholder={t.searchPlaceholder}
                        className="min-h-[44px] w-full rounded-full border border-line bg-white pl-10 pr-10 text-sm text-ink placeholder:text-ink-muted focus:border-hisaab focus:outline-none"
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch('')}
                          aria-label={t.clearSearchLabel}
                          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-cream-deep hover:text-ink"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="relative hidden sm:block">
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as 'name' | 'balance' | 'overdue')}
                        aria-label={t.sortBy}
                        className="min-h-[44px] appearance-none rounded-full border border-line bg-white pl-3.5 pr-9 text-xs font-bold text-ink-muted focus:border-hisaab focus:outline-none"
                      >
                        <option value="name">{t.sortName}</option>
                        <option value="balance">{t.sortBalance}</option>
                        <option value="overdue">{t.sortOverdue}</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink-muted">
                        ▾
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportCsv}
                      disabled={data.customers.length === 0}
                      aria-label={t.exportCsv}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-xs font-bold text-ink-muted hover:bg-cream-deep hover:text-ink disabled:opacity-40"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden md:inline">{t.exportCsv}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 lg:hidden">
                  <div className="rounded-2xl bg-hisaab p-4 text-cream">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-cream/60">
                      {t.collected}
                    </p>
                    <p className="mt-1 text-lg font-extrabold tabular-nums">{formatRupees(collectedToday)}</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-white/70 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                      {t.creditGiven}
                    </p>
                    <p className="mt-1 text-lg font-extrabold tabular-nums text-saffron-ink">
                      {formatRupees(creditToday)}
                    </p>
                  </div>
                </div>

                <section className="overflow-hidden rounded-[1.75rem] border border-line bg-white/75">
                  <div className="flex items-center justify-between border-b border-line/70 px-4 py-3.5 sm:px-5">
                    <div>
                      <h2 className="text-lg font-extrabold text-ink">{t.customersHeading}</h2>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        {displayedSummaries.length} / {data.customers.length}
                        <span className="mx-1.5 text-line">·</span>
                        {overdueSummaries.length} {t.overdueCustomers}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomer}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-saffron px-3.5 text-xs font-extrabold text-ink hover:bg-gold"
                    >
                      + {t.addCustomer}
                    </button>
                  </div>

                  {data.customers.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                      <BrandMark size={56} className="mx-auto text-hisaab" />
                      <h3 className="mt-4 text-xl font-extrabold text-ink">{t.noCustomersYet}</h3>
                      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleAddCustomer}
                          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-hisaab px-5 text-sm font-extrabold text-cream hover:bg-hisaab-deep"
                        >
                          + {t.addFirstCustomer}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenImport(SAMPLE_SHOP_JSON)}
                          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-bold text-ink-muted hover:bg-cream-deep hover:text-ink"
                        >
                          <Upload className="h-4 w-4" />
                          {t.loadSampleShop}
                        </button>
                      </div>
                    </div>
                  ) : displayedSummaries.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-ink-muted">
                      {search
                        ? t.noMatchingCustomers
                        : tab === 'overdue'
                          ? t.noOverdueCustomers
                          : t.noDueSoonCustomers}
                    </div>
                  ) : (
                    <div>
                      {displayedSummaries.map((summary) => (
                        <CustomerRow
                          key={summary.customer.phone}
                          summary={summary}
                          shopName={data.shop}
                          upiId={data.upiId}
                          todayIso={todayIso}
                          lang={lang}
                          t={t}
                          onOpen={() => setSelectedPhone(summary.customer.phone)}
                          onCollect={() =>
                            setQuickEntry({ phone: summary.customer.phone, type: 'payment' })
                          }
                          onAddCredit={() =>
                            setQuickEntry({ phone: summary.customer.phone, type: 'credit' })
                          }
                          onEdit={() => handleEditCustomer(summary.customer)}
                          onRemind={() => handleRemind(summary.customer.phone)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <aside className="hidden space-y-4 lg:col-span-4 lg:block">
                <SideCard title={t.todayLabel} icon={<Sun className="h-3.5 w-3.5 text-saffron-ink" />}>
                  <SideRow label={t.collected} value={formatRupees(collectedToday)} tone="text-settled" />
                  <SideRow label={t.creditGiven} value={formatRupees(creditToday)} tone="text-saffron-ink" />
                  <SideRow label={t.overdueCustomers} value={String(overdueSummaries.length)} />
                  <SideRow label={t.dueSoonCustomers} value={String(dueSoonSummaries.length)} />
                </SideCard>

                <SideCard title={t.aging} icon={<BarChart3 className="h-3.5 w-3.5 text-hisaab" />}>
                  <p className="text-lg font-extrabold tabular-nums text-overdue">{formatRupees(totalOverdue)}</p>
                  <div className="mt-3 space-y-2">
                    {[
                      { label: t.aging1to15, value: agingTotals.days1to15, tone: 'bg-gold' },
                      { label: t.aging16to30, value: agingTotals.days16to30, tone: 'bg-saffron' },
                      { label: t.aging31to60, value: agingTotals.days31to60, tone: 'bg-due' },
                      { label: t.aging60plus, value: agingTotals.days60plus, tone: 'bg-overdue' },
                    ].map((row) => (
                      <div key={row.label}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-ink-muted">{row.label}</span>
                          <span className="font-bold tabular-nums text-ink">{formatRupees(row.value)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-deep">
                          <div
                            className={`h-full rounded-full ${row.tone}`}
                            style={{ width: `${Math.max(2, (row.value / agingMax) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SideCard>

                <SideCard title={t.backupSection} icon={<Database className="h-3.5 w-3.5 text-hisaab" />}>
                  <p className="text-xs font-bold text-ink">
                    {store.mode === 'cloud' ? t.cloudConnected : t.notBackedUp}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    {store.mode === 'cloud'
                      ? store.lastSavedAt
                        ? t.lastSavedAt(formatRelativeTime(store.lastSavedAt))
                        : t.cloudConnected
                      : t.localOnly}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (store.session) void store.syncNow();
                      else if (store.cloudConfigured) store.setShowAuth(true);
                      else void handleBackupNow();
                    }}
                    className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-hisaab px-3 text-xs font-extrabold text-cream hover:bg-hisaab-deep"
                  >
                    <Database className="h-4 w-4" />
                    {store.session ? t.syncNow : store.cloudConfigured ? t.backUpToCloud : t.backupNow}
                  </button>
                </SideCard>
              </aside>
            </div>
          </main>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-2 backdrop-blur-md safe-bottom lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {[
            { id: 'ledger' as const, label: t.navLedger, icon: BookOpen },
            { id: 'reports' as const, label: t.navReports, icon: BarChart3 },
          ].map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleViewChange(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition-colors ${
                  active ? 'text-hisaab' : 'text-ink-muted'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                <span className={`h-1 w-1 rounded-full ${active ? 'bg-saffron' : 'bg-transparent'}`} />
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleOpenSettings}
            className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold text-ink-muted"
          >
            <SettingsIcon className="h-5 w-5" />
            {t.navSettings}
            <span className="h-1 w-1 rounded-full bg-transparent" />
          </button>
        </div>
      </nav>

      <QuickEntrySheet
        open={quickEntry !== null}
        onClose={() => setQuickEntry(null)}
        summaries={summaries}
        todayIso={todayIso}
        initialPhone={quickEntry?.phone}
        initialType={quickEntry?.type ?? 'payment'}
        t={t}
        onAddCustomer={handleAddCustomer}
        onSubmit={handleQuickEntry}
      />

      <CustomerFormSheet
        open={customerSheet !== null}
        onClose={() => setCustomerSheet(null)}
        mode={customerSheet?.mode ?? 'add'}
        initial={customerSheet?.customer}
        existingPhones={existingPhones}
        t={t}
        defaultLanguage={lang}
        onSave={handleSaveCustomer}
      />

      <ImportSheet
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportText(undefined);
        }}
        t={t}
        currentData={data}
        todayIso={todayIso}
        initialText={importText}
        onReplace={handleReplaceLedger}
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        t={t}
        data={data}
        commit={store.commit}
        mode={store.mode}
        sessionEmail={store.session?.user.email ?? null}
        syncState={store.syncState}
        lastSavedAt={store.lastSavedAt}
        storageError={store.storageError}
        cloudError={store.cloudError}
        cloudConfigured={store.cloudConfigured}
        storageEstimate={store.storageEstimate}
        backups={backups}
        onSignIn={() => {
          setSettingsOpen(false);
          store.setShowAuth(true);
        }}
        onSignOut={handleSignOut}
        onSyncNow={() => void store.syncNow()}
        onUseOffline={store.useOffline}
        onOpenImport={handleOpenImport}
        onLoadSample={() => handleOpenImport(SAMPLE_SHOP_JSON)}
        onExportBackup={handleExportBackup}
        onBackupNow={handleBackupNow}
        onRestoreBackup={handleRestoreBackup}
      />

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
          aria-label={t.receiptLabel}
        >
          <div
            className="relative max-h-[90dvh] max-w-2xl overflow-hidden rounded-[1.75rem] bg-cream p-2 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxSrc(null)}
              aria-label={t.close}
              className="absolute right-3 top-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-ink/70 text-cream hover:bg-ink"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxSrc}
              alt={t.receiptLabel}
              referrerPolicy="no-referrer"
              className="max-h-[84dvh] w-auto rounded-[1.25rem] object-contain"
            />
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-[95] -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-xs font-bold text-cream shadow-xl lg:bottom-6"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
