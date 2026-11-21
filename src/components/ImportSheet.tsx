import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, FileUp, RotateCcw, Upload } from 'lucide-react';
import { ImportParseResult, ShopData } from '../types/ledger';
import { Translations } from '../utils/i18n';
import {
  MAX_IMPORT_BYTES,
  SAMPLE_SHOP_JSON,
  computeCustomerSummaries,
  computeTotalOutstanding,
  formatRupees,
  parseImportJsonStrict,
} from '../utils/ledger';
import { Sheet } from './Sheet';

interface ImportSheetProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  currentData: ShopData;
  todayIso: string;
  initialText?: string;
  onReplace: (data: ShopData) => Promise<void>;
}

export const ImportSheet: React.FC<ImportSheetProps> = ({
  open,
  onClose,
  t,
  currentData,
  todayIso,
  initialText,
  onReplace,
}) => {
  const [rawText, setRawText] = useState(initialText ?? '');
  const [result, setResult] = useState<ImportParseResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const reset = () => {
    setRawText(initialText ?? '');
    setResult(null);
    setConfirmed(false);
    setBusy(false);
    setFileError(null);
    setStep('input');
  };

  React.useEffect(() => {
    if (!open) return;
    setConfirmed(false);
    setBusy(false);
    setFileError(null);
    setRawText(initialText ?? '');
    if (initialText) {
      const parsed = parseImportJsonStrict(initialText, currentData);
      setResult(parsed);
      setStep(parsed.ok ? 'preview' : 'input');
    } else {
      setResult(null);
      setStep('input');
    }
    // The sheet resets only when it opens or the caller supplies a new file.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialText]);

  const summary = useMemo(() => {
    if (!result?.ok) return null;
    const summaries = computeCustomerSummaries(
      result.data.customers,
      result.data.entries,
      todayIso,
      result.data.creditDays,
      result.data.reminders
    );
    return {
      customers: result.data.customers.length,
      entries: result.data.entries.length,
      outstanding: computeTotalOutstanding(summaries),
    };
  }, [result, todayIso]);

  const validate = (text: string) => {
    setFileError(null);
    const parsed = parseImportJsonStrict(text, currentData);
    setResult(parsed);
    if (parsed.ok) {
      setStep('preview');
      setConfirmed(false);
    }
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setFileError(`The file is larger than ${Math.round(MAX_IMPORT_BYTES / 1024 / 1024)} MB.`);
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setRawText(text);
      validate(text);
    };
    reader.onerror = () => setFileError('Could not read that file.');
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleReplace = async () => {
    if (!result?.ok || !confirmed) return;
    setBusy(true);
    try {
      await onReplace(result.data);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t.importTitle}
      description={t.importSubtitle}
      closeLabel={t.close}
      size="lg"
    >
      {step === 'input' ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="import-json">
              {t.pasteJsonLabel}
            </label>
            <textarea
              id="import-json"
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={t.importPlaceholder}
              className="w-full rounded-2xl border border-line bg-white p-3 font-mono text-xs leading-relaxed text-ink placeholder:text-ink-muted focus:border-hisaab focus:outline-none"
            />
          </div>

          {fileError && (
            <p className="rounded-xl bg-overdue-soft px-3 py-2 text-xs font-bold text-overdue" role="alert">
              {fileError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3.5 text-xs font-bold text-ink hover:bg-cream-deep">
              <FileUp className="h-4 w-4 text-hisaab" />
              {t.uploadJsonFile}
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFile}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setRawText(SAMPLE_SHOP_JSON);
                validate(SAMPLE_SHOP_JSON);
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white px-3.5 text-xs font-bold text-ink hover:bg-cream-deep"
            >
              <RotateCcw className="h-4 w-4 text-saffron-ink" />
              {t.loadSampleShop}
            </button>

            <button
              type="button"
              onClick={() => validate(rawText)}
              disabled={!rawText.trim()}
              className="ml-auto inline-flex min-h-[44px] items-center gap-2 rounded-full bg-hisaab px-4 text-xs font-extrabold text-cream hover:bg-hisaab-deep disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {t.validateFile}
            </button>
          </div>

          {result && !result.ok && (
            <div className="rounded-2xl border border-overdue/20 bg-overdue-soft/70 p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold text-overdue">
                <AlertTriangle className="h-4 w-4" />
                {t.importInvalid}
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-overdue">
                {result.errors.map((issue, index) => (
                  <li key={`${issue.row}-${issue.field}-${index}`}>
                    <strong>{issue.row > 0 ? `${t.rowNumber(issue.row)} · ` : ''}</strong>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        result?.ok && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-settled/20 bg-settled-soft/70 p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold text-settled">
                <Check className="h-4 w-4" />
                {t.importValid}
              </p>
              <p className="mt-1 text-xs text-settled/90">{result.data.shop}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-2xl border border-line bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {t.customersHeading}
                </p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-ink">{summary?.customers ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {t.entriesHeading}
                </p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-ink">{summary?.entries ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {t.totalOutstandingShort}
                </p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-ink">
                  {formatRupees(summary?.outstanding ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {t.creditPeriod}
                </p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-ink">
                  {result.data.creditDays} {t.daysUnit}
                </p>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="rounded-2xl border border-due/20 bg-due-soft/70 p-4">
                <p className="text-sm font-extrabold text-due">{t.importWarnings}</p>
                <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-due">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-line bg-white/70 p-4">
              <p className="text-sm font-bold text-ink">{t.replaceWarning}</p>
              <label className="mt-3 flex min-h-[44px] cursor-pointer items-start gap-2.5 py-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line accent-hisaab"
                />
                <span>{t.confirmReplace}</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setConfirmed(false);
                }}
                className="min-h-[44px] rounded-full border border-line bg-white px-4 text-xs font-bold text-ink-muted hover:bg-cream-deep hover:text-ink"
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={handleReplace}
                disabled={!confirmed || busy}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-overdue px-4 text-xs font-extrabold text-white hover:bg-overdue/90 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {busy ? t.syncStatusSaving : t.replaceLedger}
              </button>
            </div>
          </div>
        )
      )}
    </Sheet>
  );
};
