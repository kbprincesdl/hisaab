import React, { useEffect, useId, useState } from 'react';
import { Camera, Check, Loader2, X } from 'lucide-react';
import { EntryType, LedgerEntry, PaymentMethod } from '../types/ledger';
import { Translations } from '../utils/i18n';
import { formatRupees, isValidIsoDate } from '../utils/ledger';
import { compressImageToDataUrl, extractAmountFromImage } from '../utils/ocr';

interface EntryPayload {
  type: EntryType;
  amount: number;
  date: string;
  note: string;
  method?: PaymentMethod;
  shot?: string;
}

interface EntryFormProps {
  t: Translations;
  defaultDate: string;
  initialEntry?: LedgerEntry | null;
  initialType?: EntryType;
  isPrimaryForm?: boolean;
  onSubmit: (payload: EntryPayload) => void;
  onCancel?: () => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({
  t,
  defaultDate,
  initialEntry,
  initialType = 'credit',
  onSubmit,
  onCancel,
}) => {
  const shotInputId = useId();
  const [type, setType] = useState<EntryType>(initialEntry?.type ?? initialType);
  const [amountStr, setAmountStr] = useState<string>(
    initialEntry ? String(initialEntry.amount) : ''
  );
  const [date, setDate] = useState<string>(initialEntry?.date ?? defaultDate);
  const [note, setNote] = useState<string>(initialEntry?.note ?? '');
  const [method, setMethod] = useState<PaymentMethod>(initialEntry?.method ?? 'cash');
  const [shot, setShot] = useState<string | undefined>(initialEntry?.shot);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'reading' | 'found' | 'not_found'>('idle');
  const [detectedAmount, setDetectedAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialEntry) setType(initialType);
  }, [initialType, initialEntry]);

  useEffect(() => {
    if (!initialEntry) setDate(defaultDate);
  }, [defaultDate, initialEntry]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setOcrStatus('reading');
    setDetectedAmount(null);

    try {
      const compressed = await compressImageToDataUrl(file);
      setShot(compressed);

      const ocrResult = await extractAmountFromImage(file);
      if (ocrResult.amount !== null && ocrResult.amount > 0) {
        setDetectedAmount(ocrResult.amount);
        setOcrStatus('found');
        setAmountStr((prev) => (prev.trim() === '' ? String(ocrResult.amount) : prev));
      } else {
        setOcrStatus('not_found');
      }
    } catch {
      setOcrStatus('not_found');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amountStr);
    if (!Number.isFinite(num) || num <= 0) {
      setError(t.invalidAmount);
      return;
    }
    if (!isValidIsoDate(date)) {
      setError(t.invalidDate);
      return;
    }
    setError(null);
    onSubmit({
      type,
      amount: Math.round(num * 100) / 100,
      date,
      note: note.trim(),
      method: type === 'payment' ? method : undefined,
      shot: type === 'payment' ? shot : undefined,
    });

    if (!initialEntry) {
      setAmountStr('');
      setNote('');
      setShot(undefined);
      setMethod('cash');
      setOcrStatus('idle');
      setDetectedAmount(null);
    }
  };

  const isPayment = type === 'payment';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-line bg-cream-deep/60 p-1.5">
        <button
          type="button"
          data-entry-type="payment"
          onClick={() => setType('payment')}
          aria-pressed={isPayment}
          className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl px-3 py-1.5 text-sm font-extrabold transition-colors ${
            isPayment ? 'bg-hisaab text-cream shadow-sm' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <span>{t.paymentLabel}</span>
          <span className={`text-[10px] font-medium ${isPayment ? 'text-cream/65' : 'text-ink-muted'}`}>
            {t.paymentHint}
          </span>
        </button>

        <button
          type="button"
          data-entry-type="credit"
          onClick={() => setType('credit')}
          aria-pressed={!isPayment}
          className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl px-3 py-1.5 text-sm font-extrabold transition-colors ${
            !isPayment ? 'bg-saffron text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <span>{t.creditLabel}</span>
          <span className={`text-[10px] font-medium ${!isPayment ? 'text-ink' : 'text-ink-muted'}`}>
            {t.creditHint}
          </span>
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor={`${shotInputId}-amount`}>
          {t.amountRs}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-ink-muted">
            ₹
          </span>
          <input
            id={`${shotInputId}-amount`}
            type="number"
            inputMode="decimal"
            step="any"
            min="0.01"
            placeholder="0"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            required
            className="min-h-[56px] w-full rounded-2xl border border-line bg-white px-4 py-2 pl-9 text-xl font-extrabold text-ink tabular-nums transition-colors placeholder:text-ink-muted focus:border-hisaab focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor={`${shotInputId}-date`}>
            {t.dateLabel}
          </label>
          <input
            id={`${shotInputId}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="min-h-[48px] w-full rounded-2xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-hisaab focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor={`${shotInputId}-note`}>
            {t.noteLabel}
          </label>
          <input
            id={`${shotInputId}-note`}
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
                  method === value
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {value === 'cash' ? t.cashMethod : value === 'upi' ? t.upiMethod : t.otherMethod}
              </button>
            ))}
          </div>
        </div>
      )}

      {isPayment && (
        <div className="rounded-2xl border border-line bg-white/65 p-3.5">
          <label
            htmlFor={shotInputId}
            className="mb-2 flex items-center gap-2 text-xs font-bold text-ink-muted"
          >
            <Camera className="h-4 w-4 text-hisaab" />
            <span>{t.screenshotLabel}</span>
          </label>

          <input
            id={shotInputId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-xs text-ink-muted file:mr-3 file:min-h-[44px] file:cursor-pointer file:rounded-xl file:border file:border-line file:bg-cream file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-ink hover:file:bg-cream-deep"
          />

          {ocrStatus === 'reading' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{t.readingScreenshot}</span>
            </div>
          )}

          {ocrStatus === 'found' && detectedAmount !== null && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-settled">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {t.detectedAmountPrefix}{' '}
                <strong className="tabular-nums">{formatRupees(detectedAmount)}</strong>
              </span>
              {amountStr !== String(detectedAmount) && (
                <button
                  type="button"
                  onClick={() => setAmountStr(String(detectedAmount))}
                  className="font-bold underline hover:text-hisaab"
                >
                  Use {formatRupees(detectedAmount)}
                </button>
              )}
            </div>
          )}

          {ocrStatus === 'not_found' && (
            <p className="mt-2 text-xs text-ink-muted">{t.ocrNoAmount}</p>
          )}

          {shot && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={shot}
                alt={t.receiptLabel}
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-xl border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setShot(undefined);
                  setOcrStatus('idle');
                  setDetectedAmount(null);
                }}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-line bg-cream px-2.5 py-1 text-xs font-bold text-ink hover:bg-cream-deep"
              >
                <X className="h-3.5 w-3.5" />
                <span>{t.removeShot}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-overdue-soft px-3 py-2 text-xs font-bold text-overdue" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] rounded-full border border-line bg-white px-4 text-sm font-bold text-ink-muted hover:bg-cream-deep hover:text-ink"
          >
            {t.cancel}
          </button>
        )}
        <button
          type="submit"
          className={`min-h-[48px] flex-1 rounded-full px-5 text-sm font-extrabold transition-colors sm:flex-none ${
            isPayment
              ? 'bg-hisaab text-cream hover:bg-hisaab-deep'
              : 'bg-saffron text-ink hover:bg-gold'
          }`}
        >
          {initialEntry
            ? t.updateEntry
            : isPayment
              ? t.savePayment
              : t.saveCredit}
        </button>
      </div>
    </form>
  );
};
