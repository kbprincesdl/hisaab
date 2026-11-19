import React, { useState } from 'react';
import { ArrowLeft, Check, Copy, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { CustomerSummary, EntryType, Language, LedgerEntry } from '../types/ledger';
import { Translations } from '../utils/i18n';
import {
  buildUpiLink,
  buildWhatsAppLink,
  formatRupees,
  formatShortDate,
  sortEntriesNewestFirst,
} from '../utils/ledger';
import { EntryForm } from './EntryForm';

interface CustomerDetailProps {
  summary: CustomerSummary;
  entries: LedgerEntry[];
  shopName: string;
  upiId: string;
  todayIso: string;
  lang: Language;
  t: Translations;
  initialEntryType?: EntryType;
  onBack: () => void;
  onAddEntry: (payload: {
    type: EntryType;
    amount: number;
    date: string;
    note: string;
    shot?: string;
  }) => void;
  onUpdateEntry: (
    id: string,
    payload: {
      type: EntryType;
      amount: number;
      date: string;
      note: string;
      shot?: string;
    }
  ) => void;
  onDeleteEntry: (id: string) => void;
  onOpenLightbox: (src: string) => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({
  summary,
  entries,
  shopName,
  upiId,
  todayIso,
  lang,
  t,
  initialEntryType = 'payment',
  onBack,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onOpenLightbox,
}) => {
  const { customer, balance, totalCredit, totalPayment } = summary;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const sortedEntries = sortEntriesNewestFirst(entries);
  const waHref = buildWhatsAppLink(customer, balance, shopName, upiId, lang);
  const upiHref = balance > 0 ? buildUpiLink(upiId, shopName, balance) : '';

  const handleCopyUpi = async () => {
    if (!upiHref) return;
    try {
      await navigator.clipboard.writeText(upiHref);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 1800);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900 whitespace-nowrap"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.backToLedger}</span>
        </button>

        <a
          data-remind={customer.phone}
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 whitespace-nowrap"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{t.remind}</span>
        </a>
      </div>

      {/* Customer Summary Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900">
              {customer.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span className="font-mono tabular-nums">{customer.phone}</span>
              <span aria-hidden="true">·</span>
              <span>
                {t.creditLabel}: <strong className="font-mono tabular-nums text-stone-700">{formatRupees(totalCredit)}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t.paymentLabel}: <strong className="font-mono tabular-nums text-stone-700">{formatRupees(totalPayment)}</strong>
              </span>
            </div>
          </div>

          <div className="sm:text-right">
            <div className="text-xs font-medium text-stone-500">
              {balance > 0 ? t.balanceDue : balance < 0 ? t.advancePaid : t.settled}
            </div>
            <div
              className={`mt-0.5 font-mono text-2xl font-bold tabular-nums ${
                balance > 0
                  ? 'text-red-700'
                  : balance < 0
                    ? 'text-emerald-700'
                    : 'text-stone-600'
              }`}
            >
              {formatRupees(balance)}
            </div>
          </div>
        </div>

        {balance > 0 && upiHref && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs text-stone-600">
            <span className="truncate font-mono text-[11px] text-stone-500">
              {upiHref}
            </span>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 whitespace-nowrap shrink-0"
            >
              {copiedUpi ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{t.upiCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t.copyUpiLink}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Split on Desktop: Add Entry Form + Entries List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Add Entry Panel */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5 lg:col-span-5">
          <h3 className="mb-4 font-display text-base font-bold text-stone-900">
            {t.addEntry}
          </h3>
          <EntryForm
            t={t}
            defaultDate={todayIso}
            initialType={initialEntryType}
            isPrimaryForm={true}
            onSubmit={onAddEntry}
          />
        </section>

        {/* Entries List (Newest First) */}
        <section className="rounded-2xl border border-stone-200 bg-white lg:col-span-7">
          <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5">
            <h3 className="font-display text-base font-bold text-stone-900">
              {t.entriesHeading}
            </h3>
            <span className="text-xs text-stone-500">
              {sortedEntries.length} · {t.newestFirst}
            </span>
          </div>

          {sortedEntries.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-stone-500">
              {t.noEntriesYet}
            </div>
          ) : (
            <div className="divide-y divide-stone-200/80">
              {sortedEntries.map((entry) => {
                const isEditing = editingId === entry.id;
                if (isEditing) {
                  return (
                    <div key={entry.id} className="bg-stone-50/70 p-4 sm:p-5">
                      <EntryForm
                        t={t}
                        defaultDate={todayIso}
                        initialEntry={entry}
                        isPrimaryForm={false}
                        onSubmit={(payload) => {
                          onUpdateEntry(entry.id, payload);
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  );
                }

                const isCredit = entry.type === 'credit';
                return (
                  <div
                    key={entry.id}
                    data-entry={entry.id}
                    className="flex items-start justify-between gap-3 px-4 py-3.5 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span
                          className={`text-xs font-semibold ${
                            isCredit ? 'text-red-700' : 'text-emerald-700'
                          }`}
                        >
                          {isCredit ? t.creditLabel : t.paymentLabel}
                        </span>
                        <span aria-hidden="true" className="text-stone-300">
                          ·
                        </span>
                        <span className="font-mono text-xs text-stone-500 tabular-nums">
                          {formatShortDate(entry.date)}
                        </span>
                      </div>

                      {entry.note && (
                        <p className="mt-1 text-sm text-stone-800 break-words">
                          {entry.note}
                        </p>
                      )}

                      {entry.shot && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => onOpenLightbox(entry.shot!)}
                            className="inline-block overflow-hidden rounded-lg border border-stone-200 bg-stone-50 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-stone-900"
                            title={t.viewShot}
                          >
                            <img
                              data-shot="true"
                              src={entry.shot}
                              alt={`Payment receipt ${entry.date}`}
                              referrerPolicy="no-referrer"
                              className="h-14 w-14 object-cover"
                            />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span
                        className={`font-mono text-base font-semibold tabular-nums ${
                          isCredit ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatRupees(entry.amount)}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteId(null);
                            setEditingId(entry.id);
                          }}
                          aria-label={t.edit}
                          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-stone-200 bg-white px-2 text-xs text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        {confirmDeleteId === entry.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteEntry(entry.id);
                              setConfirmDeleteId(null);
                            }}
                            className="inline-flex min-h-[36px] items-center rounded-md bg-red-700 px-2.5 text-xs font-semibold text-white hover:bg-red-800 whitespace-nowrap"
                          >
                            {t.confirmDelete}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(entry.id)}
                            aria-label={t.delete}
                            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-stone-200 bg-white px-2 text-xs text-stone-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
