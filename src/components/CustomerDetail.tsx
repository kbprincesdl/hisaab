import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  Copy,
  MessageCircle,
  Pencil,
  ReceiptText,
  Trash2,
} from 'lucide-react';
import { CustomerSummary, EntryType, Language, LedgerEntry } from '../types/ledger';
import { Translations } from '../utils/i18n';
import {
  buildUpiLink,
  buildWhatsAppLink,
  daysBetweenIsoDates,
  formatRelativeTime,
  formatRupees,
  formatShortDate,
  initials,
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
    method?: 'cash' | 'upi' | 'other';
    shot?: string;
  }) => void;
  onUpdateEntry: (
    id: string,
    payload: {
      type: EntryType;
      amount: number;
      date: string;
      note: string;
      method?: 'cash' | 'upi' | 'other';
      shot?: string;
    }
  ) => void;
  onDeleteEntry: (id: string) => void;
  onOpenLightbox: (src: string) => void;
  onCollect: () => void;
  onRemind: () => void;
  onEditCustomer: () => void;
}

const Stat: React.FC<{ label: string; value: string; tone?: 'ink' | 'overdue' | 'settled' }> = ({
  label,
  value,
  tone = 'ink',
}) => (
  <div className="rounded-2xl border border-line/80 bg-cream/70 px-3.5 py-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">{label}</p>
    <p
      className={`mt-1 text-sm font-extrabold tabular-nums ${
        tone === 'overdue' ? 'text-overdue' : tone === 'settled' ? 'text-settled' : 'text-ink'
      }`}
    >
      {value}
    </p>
  </div>
);

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
  onCollect,
  onRemind,
  onEditCustomer,
}) => {
  const { customer, balance, totalCredit, totalPayment, overdueAmount, dueSoonAmount, oldestDueDate } =
    summary;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const sortedEntries = sortEntriesNewestFirst(entries);
  const reminderLang = customer.language ?? lang;
  const waHref = buildWhatsAppLink(customer, balance, shopName, upiId, reminderLang);
  const upiHref = balance > 0 ? buildUpiLink(upiId, shopName, balance) : '';
  const dueInDays = oldestDueDate ? daysBetweenIsoDates(todayIso, oldestDueDate) : null;

  const handleCopyUpi = async () => {
    if (!upiHref) return;
    try {
      await navigator.clipboard.writeText(upiHref);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 1800);
    } catch {
      // Clipboard can be restricted; the link is still visible.
    }
  };

  return (
    <div className="rise space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white/70 px-3.5 text-sm font-bold text-ink-muted transition-colors hover:bg-cream-deep hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToLedger}
        </button>

        <div className="flex items-center gap-2">
          <a
            data-remind={customer.phone}
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onRemind}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white/70 px-3.5 text-sm font-bold text-hisaab transition-colors hover:bg-settled-soft hover:text-settled"
          >
            <MessageCircle className="h-4 w-4" />
            {t.remind}
          </a>
          {balance > 0 && (
            <button
              type="button"
              onClick={onCollect}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-hisaab px-4 text-sm font-extrabold text-cream transition-colors hover:bg-hisaab-deep"
            >
              <ArrowDownLeft className="h-4 w-4" />
              {t.collect}
            </button>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border border-line bg-white/75">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-saffron-soft text-sm font-extrabold text-saffron-ink">
              {initials(customer.name)}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-extrabold text-ink">{customer.name}</h1>
                <button
                  type="button"
                  onClick={onEditCustomer}
                  aria-label={t.editCustomer}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-ink-muted hover:bg-cream-deep hover:text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                <span className="tabular-nums">{customer.phone}</span>
                <span aria-hidden="true" className="text-line">·</span>
                <span>
                  {summary.lastRemindedAt
                    ? t.lastReminded(formatRelativeTime(summary.lastRemindedAt))
                    : t.neverReminded}
                </span>
              </p>
              {customer.notes && (
                <p className="mt-2 max-w-md text-xs leading-relaxed text-ink-muted">{customer.notes}</p>
              )}
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
              {balance > 0 ? t.balanceDue : balance < 0 ? t.advancePaid : t.settled}
            </p>
            <p
              className={`mt-1 text-3xl font-extrabold tabular-nums ${
                balance > 0 ? 'text-overdue' : balance < 0 ? 'text-settled' : 'text-ink-muted'
              }`}
            >
              {formatRupees(balance)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-line/70 bg-cream/50 px-5 py-4 sm:grid-cols-4 sm:px-6">
          <Stat label={t.totalCreditLabel} value={formatRupees(totalCredit)} />
          <Stat label={t.totalPaidLabel} value={formatRupees(totalPayment)} tone="settled" />
          <Stat
            label={t.overdueLabel}
            value={formatRupees(overdueAmount)}
            tone={overdueAmount > 0 ? 'overdue' : 'ink'}
          />
          <Stat label={t.dueSoonAmount} value={formatRupees(dueSoonAmount)} />
        </div>

        {balance > 0 && upiHref && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 px-5 py-3 text-xs text-ink-muted sm:px-6">
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-muted">
              {upiHref}
            </span>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-line bg-cream px-3 text-xs font-bold text-ink hover:bg-cream-deep"
            >
              {copiedUpi ? (
                <>
                  <Check className="h-3.5 w-3.5 text-settled" />
                  {t.upiCopied}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  {t.copyUpiLink}
                </>
              )}
            </button>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        <section className="rounded-[1.75rem] border border-line bg-white/75 p-5 lg:col-span-5">
          <h2 className="mb-4 text-lg font-extrabold text-ink">{t.addEntry}</h2>
          <EntryForm
            t={t}
            defaultDate={todayIso}
            initialType={initialEntryType}
            onSubmit={onAddEntry}
          />
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-line bg-white/75 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line/70 px-5 py-4">
            <div>
              <h2 className="text-lg font-extrabold text-ink">{t.entriesHeading}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
                <CalendarClock className="h-3.5 w-3.5" />
                {dueInDays !== null && overdueAmount === 0 && dueSoonAmount > 0
                  ? t.dueOn(formatShortDate(oldestDueDate as string))
                  : dueInDays !== null && overdueAmount > 0
                    ? t.overdueBy(summary.daysOverdue)
                    : t.noDueDate}
              </p>
            </div>
            <span className="rounded-full bg-cream-deep px-2.5 py-1 text-[11px] font-bold text-ink-muted">
              {sortedEntries.length} · {t.newestFirst}
            </span>
          </div>

          {sortedEntries.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-ink-muted">{t.noEntriesYet}</div>
          ) : (
            <div className="divide-y divide-line/70">
              {sortedEntries.map((entry) => {
                const isEditing = editingId === entry.id;
                if (isEditing) {
                  return (
                    <div key={entry.id} className="bg-cream/70 p-4 sm:p-5">
                      <EntryForm
                        t={t}
                        defaultDate={todayIso}
                        initialEntry={entry}
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
                  <div key={entry.id} data-entry={entry.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                    <span
                      className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isCredit ? 'bg-saffron-soft text-saffron-ink' : 'bg-settled-soft text-settled'
                      }`}
                      aria-hidden="true"
                    >
                      {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className={`text-xs font-extrabold ${isCredit ? 'text-saffron-ink' : 'text-settled'}`}>
                          {isCredit ? t.creditLabel : t.paymentLabel}
                        </span>
                        <span aria-hidden="true" className="text-line">·</span>
                        <span className="text-xs text-ink-muted tabular-nums">{formatShortDate(entry.date)}</span>
                        {entry.method && (
                          <>
                            <span aria-hidden="true" className="text-line">·</span>
                            <span className="text-xs text-ink-muted">
                              {entry.method === 'cash' ? t.cashMethod : entry.method === 'upi' ? t.upiMethod : t.otherMethod}
                            </span>
                          </>
                        )}
                      </div>
                      {entry.note && <p className="mt-1 break-words text-sm text-ink">{entry.note}</p>}
                      {entry.shot && (
                        <button
                          type="button"
                          onClick={() => onOpenLightbox(entry.shot!)}
                          aria-label={t.viewShot}
                          className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-cream px-2 py-1.5 text-[11px] font-bold text-ink-muted hover:bg-cream-deep"
                        >
                          <img
                            data-shot="true"
                            src={entry.shot}
                            alt={t.receiptLabel}
                            referrerPolicy="no-referrer"
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                          <ReceiptText className="h-3.5 w-3.5" />
                          {t.viewShot}
                        </button>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className={`text-sm font-extrabold tabular-nums ${isCredit ? 'text-saffron-ink' : 'text-settled'}`}>
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
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line bg-white text-ink-muted hover:bg-cream-deep hover:text-ink"
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
                            className="inline-flex min-h-[44px] items-center rounded-full bg-overdue px-3 text-[11px] font-extrabold text-white hover:bg-overdue/90"
                          >
                            {t.confirmDelete}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(entry.id)}
                            aria-label={t.delete}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line bg-white text-ink-muted hover:bg-overdue-soft hover:text-overdue"
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
