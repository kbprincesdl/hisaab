import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Store } from 'lucide-react';
import { Translations } from '../utils/i18n';
import { formatRupees } from '../utils/ledger';

interface OutstandingBandProps {
  shopName: string;
  totalOutstanding: number;
  overdueAmount: number;
  dueSoonAmount: number;
  customersOwingCount: number;
  totalCustomers: number;
  overdueCount: number;
  onCollect: () => void;
  onViewOverdue: () => void;
  t: Translations;
}

export const OutstandingBand: React.FC<OutstandingBandProps> = ({
  shopName,
  totalOutstanding,
  overdueAmount,
  dueSoonAmount,
  customersOwingCount,
  totalCustomers,
  overdueCount,
  onCollect,
  onViewOverdue,
  t,
}) => (
  <section className="relative overflow-hidden bg-hisaab text-cream">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-80"
      style={{
        backgroundImage:
          'radial-gradient(circle at 12% 18%, rgba(242,181,68,0.20), transparent 34%), radial-gradient(circle at 88% 76%, rgba(232,117,26,0.18), transparent 38%)',
      }}
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-cream/10"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-6 -top-12 h-44 w-44 rounded-full border border-cream/10"
    />

    <div className="relative mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-cream/65 lg:hidden">
            <Store className="h-3.5 w-3.5" />
            <span className="truncate">{shopName}</span>
          </p>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cream/65">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {t.totalOutstanding}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
            <span
              className="font-display text-[clamp(2.6rem,7vw,4.6rem)] font-extrabold leading-[0.95] tracking-[-0.055em] tabular-nums"
              id="total-outstanding"
            >
              {formatRupees(totalOutstanding)}
            </span>
            <span className="mb-1 rounded-full border border-cream/15 bg-cream/10 px-2.5 py-1 text-[11px] font-semibold text-cream/80">
              {customersOwingCount} {t.customersOwing}
            </span>
          </div>
          <p className="mt-3 text-xs text-cream/65">
            {totalCustomers} {t.totalCustomers}
            <span className="mx-2 text-cream/25">·</span>
            {overdueCount} {t.overdueCustomers}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:max-w-md sm:gap-3 lg:w-auto">
          <div className="rounded-2xl border border-cream/12 bg-cream/[0.07] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cream/65">
              {t.overdueAmount}
            </p>
            <p className="mt-1 text-lg font-extrabold tabular-nums text-gold sm:text-xl">
              {formatRupees(overdueAmount)}
            </p>
          </div>
          <div className="rounded-2xl border border-cream/12 bg-cream/[0.07] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cream/65">
              {t.dueSoonAmount}
            </p>
            <p className="mt-1 text-lg font-extrabold tabular-nums text-cream sm:text-xl">
              {formatRupees(dueSoonAmount)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onCollect}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-saffron px-5 text-sm font-extrabold text-ink transition-colors hover:bg-gold"
        >
          <ArrowDownLeft className="h-4 w-4" />
          {t.collectPayment}
        </button>
        <button
          type="button"
          onClick={onViewOverdue}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-cream/20 bg-cream/[0.07] px-5 text-sm font-bold text-cream transition-colors hover:bg-cream/[0.12]"
        >
          <ArrowUpRight className="h-4 w-4" />
          {t.viewOverdue}
          <ChevronRight className="h-4 w-4 text-cream/60" />
        </button>
      </div>
    </div>
  </section>
);
