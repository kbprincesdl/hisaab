import React, { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, BarChart3, TrendingUp, Users, Wallet } from 'lucide-react';
import { CustomerSummary, ShopData } from '../types/ledger';
import { Translations } from '../utils/i18n';
import { formatMonth, formatRupees, roundMoney } from '../utils/ledger';

interface ReportsViewProps {
  data: ShopData;
  summaries: CustomerSummary[];
  todayIso: string;
  t: Translations;
}

function monthSlots(todayIso: string, count: number) {
  const [year, month] = todayIso.split('-').map(Number);
  return Array.from({ length: count }, (_, index) => {
    const dt = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = dt.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });
    return { key, label };
  });
}

const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  title,
  icon,
  children,
  className = '',
}) => (
  <section className={`rounded-[1.75rem] border border-line bg-white/75 p-5 ${className}`}>
    <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink">
      {icon}
      {title}
    </h2>
    <div className="mt-4">{children}</div>
  </section>
);

export const ReportsView: React.FC<ReportsViewProps> = ({ data, summaries, todayIso, t }) => {
  const thisMonth = todayIso.slice(0, 7);
  const monthEntries = data.entries.filter((entry) => entry.date.startsWith(thisMonth));
  const creditThisMonth = roundMoney(
    monthEntries.filter((entry) => entry.type === 'credit').reduce((sum, entry) => sum + entry.amount, 0)
  );
  const paidThisMonth = roundMoney(
    monthEntries.filter((entry) => entry.type === 'payment').reduce((sum, entry) => sum + entry.amount, 0)
  );
  const netChange = roundMoney(creditThisMonth - paidThisMonth);

  const aging = useMemo(
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

  const agingRows = [
    { label: t.agingCurrent, value: aging.current, tone: 'bg-settled' },
    { label: t.aging1to15, value: aging.days1to15, tone: 'bg-gold' },
    { label: t.aging16to30, value: aging.days16to30, tone: 'bg-saffron' },
    { label: t.aging31to60, value: aging.days31to60, tone: 'bg-due' },
    { label: t.aging60plus, value: aging.days60plus, tone: 'bg-overdue' },
  ];
  const agingMax = Math.max(...agingRows.map((row) => row.value), 1);

  const topDebtors = [...summaries].sort((a, b) => b.balance - a.balance).slice(0, 5);

  const months = useMemo(() => {
    const slots = monthSlots(todayIso, 6);
    return slots.map((slot) => {
      const entries = data.entries.filter((entry) => entry.date.slice(0, 7) === slot.key);
      const credit = roundMoney(
        entries.filter((entry) => entry.type === 'credit').reduce((sum, entry) => sum + entry.amount, 0)
      );
      const payment = roundMoney(
        entries.filter((entry) => entry.type === 'payment').reduce((sum, entry) => sum + entry.amount, 0)
      );
      return { ...slot, credit, payment };
    });
  }, [data.entries, todayIso]);

  const monthMax = Math.max(...months.flatMap((month) => [month.credit, month.payment]), 1);

  const methods = useMemo(() => {
    let cash = 0;
    let upi = 0;
    let other = 0;
    for (const entry of data.entries) {
      if (entry.type !== 'payment') continue;
      if (entry.method === 'cash') cash = roundMoney(cash + entry.amount);
      else if (entry.method === 'upi') upi = roundMoney(upi + entry.amount);
      else other = roundMoney(other + entry.amount);
    }
    return { cash, upi, other, total: roundMoney(cash + upi + other) };
  }, [data.entries]);

  if (data.entries.length === 0) {
    return (
      <div className="rise rounded-[1.75rem] border border-dashed border-line bg-white/60 px-6 py-16 text-center">
        <BarChart3 className="mx-auto h-8 w-8 text-ink-muted" />
        <p className="mt-3 text-sm text-ink-muted">{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="rise space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t.reportsTitle}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.reportsSubtitle}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
          {formatMonth(todayIso)}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[1.5rem] bg-hisaab p-5 text-cream">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cream/60">
            <ArrowUpRight className="h-3.5 w-3.5 text-gold" />
            {t.creditGiven}
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums">{formatRupees(creditThisMonth)}</p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-white/75 p-5">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
            <ArrowDownLeft className="h-3.5 w-3.5 text-settled" />
            {t.collected}
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-settled">{formatRupees(paidThisMonth)}</p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-white/75 p-5">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
            <TrendingUp className="h-3.5 w-3.5 text-saffron-ink" />
            {t.netChange}
          </p>
          <p className={`mt-2 text-2xl font-extrabold tabular-nums ${netChange > 0 ? 'text-saffron-ink' : 'text-settled'}`}>
            {netChange > 0 ? '+' : ''}
            {formatRupees(netChange)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title={t.aging} icon={<BarChart3 className="h-4 w-4 text-hisaab" />}>
          <div className="space-y-3">
            {agingRows.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink-muted">{row.label}</span>
                  <span className="font-bold tabular-nums text-ink">{formatRupees(row.value)}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-deep">
                  <div
                    className={`h-full rounded-full ${row.tone}`}
                    style={{ width: `${Math.max(2, (row.value / agingMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t.topDebtors} icon={<Users className="h-4 w-4 text-saffron-ink" />}>
          {topDebtors.length === 0 ? (
            <p className="text-xs text-ink-muted">{t.noData}</p>
          ) : (
            <ul className="space-y-2.5">
              {topDebtors.map((summary) => (
                <li key={summary.customer.phone} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink">{summary.customer.name}</p>
                    <p className="text-[10px] text-ink-muted">
                      {summary.overdueAmount > 0 ? t.overdueBy(summary.daysOverdue) : t.balanceDue}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-extrabold tabular-nums ${summary.balance > 0 ? 'text-overdue' : 'text-settled'}`}>
                    {formatRupees(summary.balance)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t.last6Months} icon={<TrendingUp className="h-4 w-4 text-hisaab" />} className="lg:col-span-2">
          <div className="flex items-end justify-between gap-2 sm:gap-4">
            {months.map((month) => (
              <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex h-28 w-full items-end justify-center gap-1">
                  <div
                    className="w-1/3 max-w-5 rounded-t-full bg-saffron"
                    style={{ height: `${Math.max(3, (month.credit / monthMax) * 100)}%` }}
                    title={`${t.creditGiven}: ${formatRupees(month.credit)}`}
                  />
                  <div
                    className="w-1/3 max-w-5 rounded-t-full bg-hisaab"
                    style={{ height: `${Math.max(3, (month.payment / monthMax) * 100)}%` }}
                    title={`${t.collected}: ${formatRupees(month.payment)}`}
                  />
                </div>
                <span className="mt-2 text-[10px] font-bold text-ink-muted">{month.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] font-bold text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-saffron" />
              {t.creditGiven}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-hisaab" />
              {t.collected}
            </span>
          </div>
        </Card>

        <Card title={t.cashVsUpi} icon={<Wallet className="h-4 w-4 text-saffron-ink" />} className="lg:col-span-2">
          <div className="space-y-3">
            {[
              { label: t.cashMethod, value: methods.cash, tone: 'bg-saffron' },
              { label: t.upiMethod, value: methods.upi, tone: 'bg-hisaab' },
              { label: t.otherMethod, value: methods.other, tone: 'bg-ink-muted' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">{row.label}</span>
                  <span className="font-bold tabular-nums text-ink">{formatRupees(row.value)}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-deep">
                  <div
                    className={`h-full rounded-full ${row.tone}`}
                    style={{
                      width: `${methods.total > 0 ? Math.max(2, (row.value / methods.total) * 100) : 2}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
