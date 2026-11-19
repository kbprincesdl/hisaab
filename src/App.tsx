import React, { useEffect, useMemo, useState } from 'react';
import { Download, Search, Store, UserPlus, X } from 'lucide-react';
import { AddCustomerModal } from './components/AddCustomerModal';
import { CustomerDetail } from './components/CustomerDetail';
import { CustomerRow } from './components/CustomerRow';
import { ImportPanel } from './components/ImportPanel';
import { EntryType, Language, LedgerEntry, ShopData } from './types/ledger';
import { getTranslations } from './utils/i18n';
import {
  computeCustomerSummaries,
  computeTotalOutstanding,
  createEntryId,
  deriveDefaultUpi,
  formatRupees,
  generateCsv,
  getEffectiveToday,
  LANG_STORAGE_KEY,
  parseImportJson,
  STORAGE_KEY,
} from './utils/ledger';

function loadInitialShopData(): ShopData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ShopData>;
      if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.entries)) {
        const shop = typeof parsed.shop === 'string' && parsed.shop.trim()
          ? parsed.shop
          : 'My Kirana Store';
        return {
          shop,
          upiId: typeof parsed.upiId === 'string' && parsed.upiId.trim()
            ? parsed.upiId
            : deriveDefaultUpi(shop),
          customers: parsed.customers,
          entries: parsed.entries,
        };
      }
    }
  } catch {
    // Ignore storage parse error and start clean
  }
  return {
    shop: 'My Kirana Store',
    upiId: 'kirana@upi',
    customers: [],
    entries: [],
  };
}

function loadInitialLang(): Language {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'hi' || saved === 'en') return saved;
  } catch {
    // Ignore storage read error
  }
  return 'en';
}

export default function App() {
  const [data, setData] = useState<ShopData>(() => loadInitialShopData());
  const [lang, setLang] = useState<Language>(() => loadInitialLang());
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [preferredEntryType, setPreferredEntryType] = useState<EntryType>('payment');
  const [activeTab, setActiveTab] = useState<'all' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [shopNameDraft, setShopNameDraft] = useState(data.shop);
  const [upiDraft, setUpiDraft] = useState(data.upiId);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const todayIso = useMemo(() => getEffectiveToday(), []);
  const t = useMemo(() => getTranslations(lang), [lang]);

  // Persist ledger data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Handle storage quota gracefully
    }
  }, [data]);

  // Persist language choice
  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore
    }
  }, [lang]);

  // Keep shop settings inputs synced when data is imported
  useEffect(() => {
    setShopNameDraft(data.shop);
    setUpiDraft(data.upiId);
  }, [data.shop, data.upiId]);

  const summaries = useMemo(
    () => computeCustomerSummaries(data.customers, data.entries, todayIso),
    [data.customers, data.entries, todayIso]
  );

  const totalOutstanding = useMemo(
    () => computeTotalOutstanding(summaries),
    [summaries]
  );

  const customersOwingCount = useMemo(
    () => summaries.filter((s) => s.balance > 0).length,
    [summaries]
  );

  const existingPhones = useMemo(
    () => new Set(data.customers.map((c) => c.phone)),
    [data.customers]
  );

  const displayedSummaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = summaries;

    if (activeTab === 'overdue') {
      list = list
        .filter((s) => s.balance > 0)
        .sort((a, b) => {
          const da = a.daysSinceLastPayment ?? Number.MAX_SAFE_INTEGER;
          const db = b.daysSinceLastPayment ?? Number.MAX_SAFE_INTEGER;
          if (db !== da) return db - da;
          return b.balance - a.balance;
        });
    }

    if (q) {
      list = list.filter(
        (s) =>
          s.customer.name.toLowerCase().includes(q) ||
          s.customer.phone.includes(q)
      );
    }

    return list;
  }, [summaries, activeTab, searchQuery]);

  const selectedSummary = useMemo(
    () => summaries.find((s) => s.customer.phone === selectedPhone) ?? null,
    [summaries, selectedPhone]
  );

  const selectedCustomerEntries = useMemo(
    () =>
      selectedPhone
        ? data.entries.filter((e) => e.phone === selectedPhone)
        : [],
    [data.entries, selectedPhone]
  );

  const handleAddCustomer = (name: string, phone: string) => {
    setData((prev) => ({
      ...prev,
      customers: [...prev.customers, { name, phone }],
    }));
    setShowAddCustomer(false);
  };

  const handleAddEntry = (payload: {
    type: EntryType;
    amount: number;
    date: string;
    note: string;
    shot?: string;
  }) => {
    if (!selectedPhone) return;
    const newEntry: LedgerEntry = {
      id: createEntryId(),
      phone: selectedPhone,
      type: payload.type,
      amount: payload.amount,
      date: payload.date,
      note: payload.note,
      shot: payload.shot,
      createdAt: Date.now(),
    };
    setData((prev) => ({
      ...prev,
      entries: [...prev.entries, newEntry],
    }));
  };

  const handleUpdateEntry = (
    id: string,
    payload: {
      type: EntryType;
      amount: number;
      date: string;
      note: string;
      shot?: string;
    }
  ) => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              type: payload.type,
              amount: payload.amount,
              date: payload.date,
              note: payload.note,
              shot: payload.shot,
            }
          : entry
      ),
    }));
  };

  const handleDeleteEntry = (id: string) => {
    setData((prev) => ({
      ...prev,
      entries: prev.entries.filter((entry) => entry.id !== id),
    }));
  };

  const handleImportJson = (rawText: string): { ok: boolean; message: string } => {
    try {
      const imported = parseImportJson(rawText, data.upiId);
      setData(imported);
      setSelectedPhone(null);
      setSearchQuery('');
      setActiveTab('all');
      return {
        ok: true,
        message: t.importSuccess(imported.customers.length, imported.entries.length),
      };
    } catch {
      return {
        ok: false,
        message: t.importError,
      };
    }
  };

  const handleExportCsv = () => {
    const csv = generateCsv(data, summaries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeShop = data.shop.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'hisaab';
    link.href = url;
    link.download = `${safeShop}-${todayIso}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanShop = shopNameDraft.trim() || 'My Kirana Store';
    const cleanUpi = upiDraft.trim() || deriveDefaultUpi(cleanShop);
    setData((prev) => ({
      ...prev,
      shop: cleanShop,
      upiId: cleanUpi,
    }));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-stone-900">
      {/* Compact single-row Top Bar (under 8% mobile viewport height) */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSelectedPhone(null)}
            className="font-display text-lg font-extrabold tracking-tight text-stone-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-stone-900"
          >
            {t.appName}
          </button>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher: EN / हिंदी */}
            <div className="flex items-center rounded-lg bg-stone-100 p-0.5">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`min-h-[36px] rounded-md px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  lang === 'en'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`min-h-[36px] rounded-md px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  lang === 'hi'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                हिं
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddCustomer(true)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800 whitespace-nowrap shrink-0"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{t.addCustomer}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
        {/* Top Outstanding Summary Banner (always rendered so #total-outstanding is always accessible) */}
        <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                <Store className="h-3.5 w-3.5 text-stone-400" />
                <span>{data.shop}</span>
                <span aria-hidden="true">·</span>
                <span>{t.ledgerSubtitle}</span>
              </div>
              <h1 className="mt-1 font-display text-sm font-semibold text-stone-600">
                {t.totalOutstanding}
              </h1>
              <div
                id="total-outstanding"
                className="mt-1 font-mono text-3xl font-bold tracking-tight text-stone-900 tabular-nums sm:text-4xl"
              >
                {formatRupees(totalOutstanding)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
              <span>
                <strong className="font-mono tabular-nums text-stone-900">
                  {customersOwingCount}
                </strong>{' '}
                {t.customersOwing}
              </span>
              <span aria-hidden="true" className="text-stone-300">
                ·
              </span>
              <span>
                <strong className="font-mono tabular-nums text-stone-900">
                  {data.customers.length}
                </strong>{' '}
                {t.totalCustomers}
              </span>
              <span aria-hidden="true" className="text-stone-300">
                ·
              </span>
              <span className="font-mono tabular-nums text-stone-500">{todayIso}</span>
            </div>
          </div>
        </section>

        {/* Customer Detail Page OR Main Ledger + Import Split */}
        {selectedSummary ? (
          <CustomerDetail
            summary={selectedSummary}
            entries={selectedCustomerEntries}
            shopName={data.shop}
            upiId={data.upiId}
            todayIso={todayIso}
            lang={lang}
            t={t}
            initialEntryType={preferredEntryType}
            onBack={() => setSelectedPhone(null)}
            onAddEntry={handleAddEntry}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onOpenLightbox={(src) => setLightboxSrc(src)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
            {/* Left/Main Column: Customer Ledger */}
            <div className="space-y-4 lg:col-span-8">
              {/* Filter Tabs, Search & CSV Export Toolbar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1 rounded-xl bg-stone-200/70 p-1 self-start">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      activeTab === 'all'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {t.allCustomers} ({data.customers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('overdue')}
                    className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      activeTab === 'overdue'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {t.overdueList} ({customersOwingCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={data.customers.length === 0}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{t.exportCsv}</span>
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="min-h-[44px] w-full rounded-xl border border-stone-200 bg-white pl-10 pr-16 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                  >
                    {t.clearSearch}
                  </button>
                )}
              </div>

              {/* Customer List */}
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                {data.customers.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <p className="mx-auto max-w-sm text-sm text-stone-600">
                      {t.noCustomersYet}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCustomer(true)}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 whitespace-nowrap"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>{t.addCustomer}</span>
                      </button>
                    </div>
                  </div>
                ) : displayedSummaries.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-stone-500">
                    {activeTab === 'overdue' && !searchQuery
                      ? t.noOverdueCustomers
                      : t.noMatchingCustomers}
                  </div>
                ) : (
                  <div>
                    {displayedSummaries.map((summary) => (
                      <CustomerRow
                        key={summary.customer.phone}
                        summary={summary}
                        shopName={data.shop}
                        upiId={data.upiId}
                        lang={lang}
                        t={t}
                        showOverdueMeta={activeTab === 'overdue'}
                        onSelectCustomer={(phone) => {
                          setPreferredEntryType('payment');
                          setSelectedPhone(phone);
                        }}
                        onQuickAddEntry={(phone) => {
                          setPreferredEntryType('credit');
                          setSelectedPhone(phone);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar: Import JSON & Shop UPI Settings */}
            <aside className="space-y-5 lg:col-span-4">
              <ImportPanel t={t} onImportJson={handleImportJson} />

              <section className="rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="font-display text-base font-bold text-stone-900">
                  {t.shopSettings}
                </h2>
                <form onSubmit={handleSaveShopSettings} className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">
                      {t.shopNameLabel}
                    </label>
                    <input
                      type="text"
                      value={shopNameDraft}
                      onChange={(e) => setShopNameDraft(e.target.value)}
                      className="min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">
                      {t.upiIdLabel}
                    </label>
                    <input
                      type="text"
                      value={upiDraft}
                      onChange={(e) => setUpiDraft(e.target.value)}
                      placeholder="yourshop@upi"
                      className="min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-stone-500">{t.upiIdHint}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {settingsSaved ? (
                      <span className="text-xs font-medium text-emerald-700">Saved</span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      className="min-h-[40px] rounded-lg border border-stone-300 bg-stone-50 px-4 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100 whitespace-nowrap"
                    >
                      {t.saveSettings}
                    </button>
                  </div>
                </form>
              </section>
            </aside>
          </div>
        )}
      </main>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <AddCustomerModal
          t={t}
          existingPhones={existingPhones}
          onAdd={handleAddCustomer}
          onClose={() => setShowAddCustomer(false)}
        />
      )}

      {/* Payment Screenshot Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxSrc(null)}
              aria-label={t.close}
              className="absolute right-3 top-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxSrc}
              alt="Payment receipt"
              referrerPolicy="no-referrer"
              className="max-h-[82vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
