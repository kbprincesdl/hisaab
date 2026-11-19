import React, { useEffect, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { EntryType, LedgerEntry } from '../types/ledger';
import { Translations } from '../utils/i18n';
import { formatRupees, isValidIsoDate } from '../utils/ledger';
import { compressImageToDataUrl, extractAmountFromImage } from '../utils/ocr';

interface EntryFormProps {
  t: Translations;
  defaultDate: string;
  initialEntry?: LedgerEntry | null;
  initialType?: EntryType;
  isPrimaryForm?: boolean;
  onSubmit: (payload: {
    type: EntryType;
    amount: number;
    date: string;
    note: string;
    shot?: string;
  }) => void;
  onCancel?: () => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({
  t,
  defaultDate,
  initialEntry,
  initialType = 'credit',
  isPrimaryForm = true,
  onSubmit,
  onCancel,
}) => {
  const [type, setType] = useState<EntryType>(initialEntry?.type ?? initialType);
  const [amountStr, setAmountStr] = useState<string>(
    initialEntry ? String(initialEntry.amount) : ''
  );
  const [date, setDate] = useState<string>(initialEntry?.date ?? defaultDate);
  const [note, setNote] = useState<string>(initialEntry?.note ?? '');
  const [shot, setShot] = useState<string | undefined>(initialEntry?.shot);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'reading' | 'found' | 'not_found'>('idle');
  const [detectedAmount, setDetectedAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialEntry) {
      setType(initialType);
    }
  }, [initialType, initialEntry]);

  useEffect(() => {
    if (!initialEntry) {
      setDate(defaultDate);
    }
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
        // Auto-fill amount field if empty so user/tester sees OCR work immediately
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
      shot: type === 'payment' ? shot : undefined,
    });

    if (!initialEntry) {
      setAmountStr('');
      setNote('');
      setShot(undefined);
      setOcrStatus('idle');
      setDetectedAmount(null);
      if (isPrimaryForm) {
        const input = document.getElementById('shot-input') as HTMLInputElement | null;
        if (input) input.value = '';
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Entry Type Segmented Toggle */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-stone-100 p-1">
        <button
          type="button"
          data-entry-type="credit"
          onClick={() => setType('credit')}
          className={`flex min-h-[44px] flex-col items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap ${
            type === 'credit'
              ? 'bg-white text-red-700 shadow-xs ring-1 ring-stone-200/80'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>{t.creditLabel}</span>
          <span className="text-[11px] font-normal text-stone-500">{t.creditHint}</span>
        </button>

        <button
          type="button"
          data-entry-type="payment"
          onClick={() => setType('payment')}
          className={`flex min-h-[44px] flex-col items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap ${
            type === 'payment'
              ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-stone-200/80'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>{t.paymentLabel}</span>
          <span className="text-[11px] font-normal text-stone-500">{t.paymentHint}</span>
        </button>
      </div>

      {/* Amount & Date */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-700">
            {t.amountRs}
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0.01"
            placeholder="0"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            required
            className="min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-base font-medium text-stone-900 tabular-nums focus:border-stone-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-stone-700">
            {t.dateLabel}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-700">
          {t.noteLabel}
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={type === 'credit' ? t.notePlaceholderCredit : t.notePlaceholderPayment}
          className="min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
        />
      </div>

      {/* Payment Screenshot Upload & OCR */}
      {type === 'payment' && (
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
          <label
            htmlFor={isPrimaryForm ? 'shot-input' : undefined}
            className="mb-2 flex items-center gap-2 text-xs font-medium text-stone-700"
          >
            <Camera className="h-4 w-4 text-stone-500" />
            <span>{t.screenshotLabel}</span>
          </label>

          <input
            id={isPrimaryForm ? 'shot-input' : undefined}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-xs text-stone-600 file:mr-3 file:min-h-[40px] file:cursor-pointer file:rounded-lg file:border file:border-stone-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-stone-800 hover:file:bg-stone-100"
          />

          {ocrStatus === 'reading' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-stone-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{t.readingScreenshot}</span>
            </div>
          )}

          {ocrStatus === 'found' && detectedAmount !== null && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800">
              <span>
                {t.detectedAmountPrefix}{' '}
                <strong className="font-mono tabular-nums">{formatRupees(detectedAmount)}</strong>
              </span>
              {amountStr !== String(detectedAmount) && (
                <button
                  type="button"
                  onClick={() => setAmountStr(String(detectedAmount))}
                  className="font-semibold underline hover:text-emerald-950"
                >
                  Use {formatRupees(detectedAmount)}
                </button>
              )}
            </div>
          )}

          {ocrStatus === 'not_found' && (
            <p className="mt-2 text-xs text-stone-500">{t.ocrNoAmount}</p>
          )}

          {shot && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={shot}
                alt="Payment screenshot preview"
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-lg border border-stone-200 object-cover bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  setShot(undefined);
                  setOcrStatus('idle');
                  setDetectedAmount(null);
                  if (isPrimaryForm) {
                    const input = document.getElementById('shot-input') as HTMLInputElement | null;
                    if (input) input.value = '';
                  }
                }}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
              >
                <X className="h-3.5 w-3.5" />
                <span>{t.removeShot}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 whitespace-nowrap"
          >
            {t.cancel}
          </button>
        )}
        <button
          type="submit"
          className={`min-h-[44px] flex-1 sm:flex-none rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap ${
            type === 'credit'
              ? 'bg-red-700 hover:bg-red-800'
              : 'bg-emerald-700 hover:bg-emerald-800'
          }`}
        >
          {initialEntry ? t.updateEntry : t.saveEntry}
        </button>
      </div>
    </form>
  );
};
