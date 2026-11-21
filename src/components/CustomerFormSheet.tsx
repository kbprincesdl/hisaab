import React, { useEffect, useState } from 'react';
import { Customer, Language } from '../types/ledger';
import { Translations } from '../utils/i18n';
import { isValidPhone, normalizePhone, roundMoney } from '../utils/ledger';
import { Sheet } from './Sheet';

interface CustomerFormSheetProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initial?: Customer | null;
  existingPhones: Set<string>;
  t: Translations;
  defaultLanguage: Language;
  onSave: (customer: Customer) => void;
}

export const CustomerFormSheet: React.FC<CustomerFormSheetProps> = ({
  open,
  onClose,
  mode,
  initial,
  existingPhones,
  t,
  defaultLanguage,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [notes, setNotes] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setPhoneInput(initial?.phone ?? '');
    setNotes(initial?.notes ?? '');
    setCreditLimit(initial?.creditLimit !== undefined ? String(initial.creditLimit) : '');
    setLanguage(initial?.language ?? defaultLanguage);
    setError(null);
  }, [open, initial, defaultLanguage]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError(t.invalidName);
      return;
    }
    const phone = mode === 'edit' && initial ? initial.phone : normalizePhone(phoneInput);
    if (!isValidPhone(phone)) {
      setError(t.invalidPhone);
      return;
    }
    if (existingPhones.has(phone) && !(mode === 'edit' && initial?.phone === phone)) {
      setError(t.duplicatePhone);
      return;
    }
    const limitNumber = creditLimit.trim() === '' ? undefined : Number(creditLimit);
    if (limitNumber !== undefined && (!Number.isFinite(limitNumber) || limitNumber < 0)) {
      setError(t.invalidAmount);
      return;
    }
    onSave({
      name: cleanName,
      phone,
      notes: notes.trim() || undefined,
      creditLimit: limitNumber !== undefined ? roundMoney(limitNumber) : undefined,
      language,
      createdAt: initial?.createdAt ?? Date.now(),
    });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === 'add' ? t.addCustomer : t.editCustomer}
      description={mode === 'edit' ? t.phoneCannotChange : undefined}
      closeLabel={t.close}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="customer-name">
            {t.customerName}
          </label>
          <input
            id="customer-name"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.customerNamePlaceholder}
            className="min-h-[48px] w-full rounded-2xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-hisaab focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="customer-phone">
            {t.phone10Digit}
          </label>
          <input
            id="customer-phone"
            type="tel"
            inputMode="numeric"
            maxLength={14}
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder={t.phonePlaceholder}
            disabled={mode === 'edit'}
            className="min-h-[48px] w-full rounded-2xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink tabular-nums placeholder:text-ink-muted focus:border-hisaab focus:outline-none disabled:bg-cream-deep disabled:text-ink-muted"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="customer-notes">
              {t.notesLabel}
            </label>
            <input
              id="customer-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[48px] w-full rounded-2xl border border-line bg-white px-3.5 py-2 text-sm text-ink focus:border-hisaab focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="customer-limit">
              {t.creditLimitLabel}
            </label>
            <input
              id="customer-limit"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="0"
              className="min-h-[48px] w-full rounded-2xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink tabular-nums focus:border-hisaab focus:outline-none"
            />
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-bold text-ink-muted">{t.reminderLanguage}</span>
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-line bg-cream-deep/60 p-1.5">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              aria-pressed={language === 'en'}
              className={`min-h-[44px] rounded-xl text-xs font-bold transition-colors ${
                language === 'en' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              aria-pressed={language === 'hi'}
              className={`min-h-[44px] rounded-xl text-xs font-bold transition-colors ${
                language === 'hi' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-overdue-soft px-3 py-2 text-xs font-bold text-overdue" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] rounded-full border border-line bg-white px-4 text-sm font-bold text-ink-muted hover:bg-cream-deep hover:text-ink"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="min-h-[48px] rounded-full bg-hisaab px-5 text-sm font-extrabold text-cream hover:bg-hisaab-deep"
          >
            {mode === 'add' ? t.saveCustomer : t.saveChanges}
          </button>
        </div>
      </form>
    </Sheet>
  );
};
