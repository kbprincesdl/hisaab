import React, { useRef } from 'react';
import {
  ArrowDownLeft,
  ChevronRight,
  MessageCircle,
  MoreVertical,
  Pencil,
  Plus,
  Wallet,
} from 'lucide-react';
import { CustomerSummary, Language } from '../types/ledger';
import { Translations } from '../utils/i18n';
import {
  buildWhatsAppLink,
  daysBetweenIsoDates,
  formatRelativeTime,
  formatRupees,
  formatShortDate,
  initials,
} from '../utils/ledger';

interface CustomerRowProps {
  summary: CustomerSummary;
  shopName: string;
  upiId: string;
  todayIso: string;
  lang: Language;
  t: Translations;
  onOpen: () => void;
  onCollect: () => void;
  onAddCredit: () => void;
  onEdit: () => void;
  onRemind: () => void;
}

export const CustomerRow: React.FC<CustomerRowProps> = ({
  summary,
  shopName,
  upiId,
  todayIso,
  lang,
  t,
  onOpen,
  onCollect,
  onAddCredit,
  onEdit,
  onRemind,
}) => {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const { customer, balance, overdueAmount, dueSoonAmount, daysOverdue, lastPaymentDate, lastRemindedAt } =
    summary;
  const waHref = buildWhatsAppLink(customer, balance, shopName, upiId, lang);
  const dueInDays = summary.oldestDueDate
    ? daysBetweenIsoDates(todayIso, summary.oldestDueDate)
    : 0;

  const isOverdue = overdueAmount > 0;
  const isDueSoon = !isOverdue && dueSoonAmount > 0;
  const isSettled = Math.abs(balance) < 0.005;
  const isAdvance = balance < 0;

  const avatarTone = isOverdue
    ? 'bg-overdue-soft text-overdue'
    : isDueSoon
      ? 'bg-due-soft text-due'
      : isSettled || isAdvance
        ? 'bg-settled-soft text-settled'
        : 'bg-saffron-soft text-saffron-ink';

  const balanceTone = isOverdue
    ? 'text-overdue'
    : isAdvance
      ? 'text-settled'
      : isSettled
        ? 'text-ink-muted'
        : 'text-ink';

  const dueLabel =
    dueInDays <= 0 ? t.dueToday : dueInDays === 1 ? t.dueTomorrow : t.dueIn(dueInDays);

  const statusText = isOverdue
    ? t.overdueBy(daysOverdue)
    : isDueSoon
      ? dueLabel
      : isAdvance
        ? t.advancePaid
        : isSettled
          ? t.settled
          : t.balanceDue;

  const detailText = lastPaymentDate
    ? t.lastPaidOn(formatShortDate(lastPaymentDate))
    : t.noPaymentsYet;

  const closeMenu = () => detailsRef.current?.removeAttribute('open');

  return (
    <div
      data-customer={customer.phone}
      data-balance={balance}
      className="group border-b border-line/70 px-4 py-3 transition-colors last:border-b-0 hover:bg-white/65 sm:px-5"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-xl text-left"
          aria-label={`${t.viewLedger}: ${customer.name}`}
        >
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${avatarTone}`}
            aria-hidden="true"
          >
            {initials(customer.name)}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[15px] font-bold text-ink">{customer.name}</span>
              {isOverdue && (
                <span className="hidden shrink-0 rounded-full bg-overdue-soft px-2 py-0.5 text-[10px] font-bold text-overdue sm:inline-flex">
                  {t.overdueLabel}
                </span>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 sm:hidden" />
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-muted">
              <span className="tabular-nums">{customer.phone}</span>
              <span aria-hidden="true" className="text-line">
                ·
              </span>
              <span>{detailText}</span>
              {isOverdue && lastRemindedAt && (
                <>
                  <span aria-hidden="true" className="text-line">
                    ·
                  </span>
                  <span>{t.lastReminded(formatRelativeTime(lastRemindedAt))}</span>
                </>
              )}
            </span>
          </span>

          <span className="shrink-0 text-right">
            <span className={`block text-base font-extrabold tabular-nums ${balanceTone}`}>
              {formatRupees(balance)}
            </span>
            <span
              className={`mt-0.5 block text-[10px] font-bold ${
                isOverdue ? 'text-overdue' : isDueSoon ? 'text-due' : 'text-ink-muted'
              }`}
            >
              {statusText}
            </span>
          </span>
        </button>

        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <button
            type="button"
            onClick={onCollect}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-hisaab px-3.5 text-xs font-bold text-cream transition-colors hover:bg-hisaab-deep"
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            {t.collect}
          </button>

          <a
            data-remind={customer.phone}
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onRemind}
            aria-label={`${t.remind}: ${customer.name}`}
            title={t.remind}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line bg-white/70 text-hisaab transition-colors hover:bg-settled-soft hover:text-settled"
          >
            <MessageCircle className="h-4 w-4" />
          </a>

          <details ref={detailsRef} className="relative">
            <summary
              aria-label={t.moreActions}
              className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded-full border border-line bg-white/70 text-ink-muted transition-colors hover:bg-cream-deep hover:text-ink [&::-webkit-details-marker]:hidden"
            >
              <MoreVertical className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-2xl border border-line bg-cream p-1 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onAddCredit();
                }}
                className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-semibold text-ink hover:bg-cream-deep"
              >
                <Plus className="h-4 w-4 text-saffron-ink" />
                {t.addCredit}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onOpen();
                }}
                className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-semibold text-ink hover:bg-cream-deep"
              >
                <Wallet className="h-4 w-4 text-hisaab" />
                {t.viewLedger}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onEdit();
                }}
                className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-semibold text-ink hover:bg-cream-deep"
              >
                <Pencil className="h-4 w-4 text-ink-muted" />
                {t.editCustomer}
              </button>
            </div>
          </details>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-2 pl-[52px] sm:hidden">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCollect}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-hisaab px-3.5 text-xs font-bold text-cream"
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            {t.collect}
          </button>
          <a
            data-remind={customer.phone}
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onRemind}
            aria-label={`${t.remind}: ${customer.name}`}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line bg-white/70 text-hisaab"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`${t.editCustomer}: ${customer.name}`}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line bg-white/70 text-ink-muted"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

