import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ChevronDown, PlusCircle } from 'lucide-react';
import { CustomerSummary, EntryType, PaymentMethod } from '../types/ledger';
import { Translations } from '../utils/i18n';
import { formatRupees, isValidIsoDate } from '../utils/ledger';
import { Sheet } from './Sheet';

interface QuickEntrySheetProps {
  open: boolean;
  onClose: () => void;
  summaries: CustomerSummary[];
  todayIso: string;
  initialPhone?: string;
  initialType?: EntryType;
  t: Translations;
  onAddCustomer: () => void;
  onSubmit: (payload: {
    phone: string;
    type: EntryType;
    amount: number;
    date: string;
    note: string;
    method?: PaymentMethod;
  }) => void;
}

export const QuickEntrySheet: React.FC<QuickEntrySheetProps> = ({
  open,
  onClose,
  summaries,
  todayIso,
  initialPhone,
  initialType = 'payment',
  t,
  onAddCustomer,
  onSubmit,
}) => {
  const sorted = useMemo(
    () =>
      [...summaries].sort((a, b) => {
        if (Math.abs(b.balance) !== Math.abs(a.balance)) return Math.abs(b.balance) - Math.abs(a.balance);
        return a.customer.name.localeCompare(b.customer.name);
      }),
    [summaries]
  );

  const [phone, setPhone] = useState(initialPhone ?? '');
  const [type, setType] = useState<EntryType>(initialType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso);
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [error, setError] = useState<string | null>(null);

  const selected = sorted.find((s) => s.customer.phone === phone) ?? null;

  useEffect(() => {
    if (!open) return;
    setPhone(initialPhone ?? '');
    setType(initialType);
    setDate(todayIso);
    setNote('');
    setMethod('cash');
    setError(null);
    const initial = summaries.find((s) => s.customer.phone === initialPhone);
    setAmount(
      initialType === 'payment' && initial && initial.balance > 0
        ? String(initial.balance)
        : ''
    );
  }, [open, initialPhone, initialType, todayIso, summaries]);

  const chooseCustomer = (nextPhone: string) => {
    setPhone(nextPhone);
    const next = summaries.find((s) => s.customer.phone === nextPhone);
    if (type === 'payment' && next && next.balance > 0) {
      setAmount(String(next.balance));
    }
  };

  const chooseType = (nextType: EntryType) => {
    setType(nextType);
    if (nextType === 'payment' && selected && selected.balance > 0) {
      setAmount(String(selected.balance));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError(t.chooseCustomerError);
      return;
    }
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError(t.invalidAmount);
      return;
    }
    if (!isValidIsoDate(date)) {
      setError(t.invalidDate);
      return;
    }
    onSubmit({
      phone,
      type,
      amount: Math.round(num * 100) / 100,
      date,
      note: note.trim(),
      method: type === 'payment' ? method : undefined,
    });
    onClose();
  };

  const isPayment = type === 'payment';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isPayment ? t.receivePayment : t.giveCredit}
      description={isPayment ? t.paymentHint : t.creditHint}
      closeLabel={t.close}
      size="md"
    >
      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center">
          <p className="text-sm text-ink-muted">{t.noCustomersForEntry}</p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddCustomer();
            }}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-saffron px-4 text-sm font-bold text-ink"
          >
            <PlusCircle className="h-4 w-4" />
            {t.addCustomer}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-line bg-cream-deep/60 p-1.5">
            <button
              type="button"
              onClick={() => chooseType('payment')}
              aria-pressed={isPayment}
              className={`min-h-[48px] rounded-xl text-sm font-extrabold transition-colors ${
                isPayment ? 'bg-hisaab text-cream shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t.paymentLabel}
            </button>
            <button
              type="button"
              onClick={() => chooseType('credit')}
              aria-pressed={!isPayment}
              className={`min-h-[48px] rounded-xl text-sm font-extrabold transition-colors ${
                !isPayment ? 'bg-saffron text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t.creditLabel}
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="quick-customer">
              {t.chooseCustomer}
            </label>
            <div className="relative">
              <select
                id="quick-customer"
                value={phone}
                onChange={(e) => chooseCustomer(e.target.value)}
                className="min-h-[48px] w-full appearance-none rounded-2xl border border-line bg-white px-3.5 py-2 pr-10 text-sm font-semibold text-ink focus:border-hisaab focus:outline-none"
              >
                <option value="">{t.chooseCustomer}</option>
                {sorted.map((summary) => (
                  <option key={summary.customer.phone} value={summary.customer.phone}>
                    {summary.customer.name} — {formatRupees(summary.balance)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            </div>
            {selected && (
              <p className="mt-1.5 text-xs text-ink-muted">
                {selected.customer.phone}
                <span className="mx-1.5 text-line">·</span>
                {t.balanceDue} <strong className="tabular-nums text-ink">{formatRupees(selected.balance)}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="quick-amount">
              {t.amountRs}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-ink-muted">
                ₹
              </span>
              <input
                id="quick-amount"
                type="number"
                inputMode="decimal"
                step="any"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
                className="min-h-[56px] w-full rounded-2xl border border-line bg-white px-4 py-2 pl-9 text-xl font-extrabold text-ink tabular-nums placeholder:text-ink-muted focus:border-hisaab focus:outline-none"
              />
            </div>
            {isPayment && selected && selected.balance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(selected.balance))}
                className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-saffron-soft px-3 text-xs font-bold text-saffron-ink"
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                {t.fullBalance}: {formatRupees(selected.balance)}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="quick-date">
                {t.dateLabel}
              </label>
              <input
                id="quick-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="min-h-[48px] w-full rounded-2xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-hisaab focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="quick-note">
                {t.noteLabel}
              </label>
              <input
                id="quick-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isPayment ? t.notePlaceholderPayment : t.notePlaceholderCredit}
                className="min-h-[48px] w-full rounded-2xl border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-hisaab focus:outline-none"
              />
            </div>
          </div>

          {isPayment && (
            <div>
              <span className="mb-1.5 block text-xs font-bold text-ink-muted">{t.method}</span>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-line bg-cream-deep/60 p-1.5">
                {(['cash', 'upi', 'other'] as PaymentMethod[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMethod(value)}
                    aria-pressed={method === value}
                    className={`min-h-[44px] rounded-xl text-xs font-bold transition-colors ${
                      method === value ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {value === 'cash' ? t.cashMethod : value === 'upi' ? t.upiMethod : t.otherMethod}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-overdue-soft px-3 py-2 text-xs font-bold text-overdue" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className={`min-h-[52px] w-full rounded-full text-sm font-extrabold transition-colors ${
              isPayment ? 'bg-hisaab text-cream hover:bg-hisaab-deep' : 'bg-saffron text-ink hover:bg-gold'
            }`}
          >
            {isPayment ? t.savePayment : t.saveCredit}
          </button>
        </form>
      )}
    </Sheet>
  );
};
