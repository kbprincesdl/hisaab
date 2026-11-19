import React from 'react';
import { ChevronRight, MessageCircle, Plus } from 'lucide-react';
import { CustomerSummary, Language } from '../types/ledger';
import { Translations } from '../utils/i18n';
import { buildWhatsAppLink, formatRupees, formatShortDate } from '../utils/ledger';

interface CustomerRowProps {
  summary: CustomerSummary;
  shopName: string;
  upiId: string;
  lang: Language;
  t: Translations;
  showOverdueMeta: boolean;
  onSelectCustomer: (phone: string) => void;
  onQuickAddEntry: (phone: string) => void;
}

export const CustomerRow: React.FC<CustomerRowProps> = ({
  summary,
  shopName,
  upiId,
  lang,
  t,
  showOverdueMeta,
  onSelectCustomer,
  onQuickAddEntry,
}) => {
  const { customer, balance, lastPaymentDate, daysSinceLastPayment } = summary;
  const waHref = buildWhatsAppLink(customer, balance, shopName, upiId, lang);

  const balanceColorClass =
    balance > 0
      ? 'text-red-700'
      : balance < 0
        ? 'text-emerald-700'
        : 'text-stone-500';

  const statusText =
    balance > 0
      ? t.balanceDue
      : balance < 0
        ? t.advancePaid
        : t.settled;

  return (
    <div
      data-customer={customer.phone}
      onClick={() => onSelectCustomer(customer.phone)}
      className="group flex cursor-pointer flex-col gap-3 border-b border-stone-200/80 px-4 py-3.5 transition-colors hover:bg-stone-50/90 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      {/* Left: Tap area to open customer ledger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectCustomer(customer.phone);
        }}
        className="flex min-h-[44px] flex-1 items-center justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 rounded-lg"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-[15px] font-semibold text-stone-900">
              {customer.name}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 sm:hidden" />
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
            <span className="font-mono tabular-nums">{customer.phone}</span>
            {showOverdueMeta && balance > 0 ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-amber-800 tabular-nums">
                  {daysSinceLastPayment !== null
                    ? t.daysSincePayment(daysSinceLastPayment)
                    : t.noPaymentsYet}
                </span>
              </>
            ) : lastPaymentDate ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{t.lastPaidOn(formatShortDate(lastPaymentDate))}</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Balance figure */}
        <div className="shrink-0 text-right">
          <div
            data-balance={balance}
            className={`font-mono text-base font-semibold tabular-nums ${balanceColorClass}`}
          >
            {formatRupees(balance)}
          </div>
          <div className="text-[11px] font-medium text-stone-500">
            {statusText}
          </div>
        </div>
      </button>

      {/* Right: Touch-friendly actions */}
      <div className="flex items-center justify-end gap-2 sm:shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAddEntry(customer.phone);
          }}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t.addEntry}</span>
        </button>

        <a
          data-remind={customer.phone}
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>{t.remind}</span>
        </a>
      </div>
    </div>
  );
};
