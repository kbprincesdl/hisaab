import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Translations } from '../utils/i18n';
import { isValidPhone, normalizePhone } from '../utils/ledger';

interface AddCustomerModalProps {
  t: Translations;
  existingPhones: Set<string>;
  onAdd: (name: string, phone: string) => void;
  onClose: () => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  t,
  existingPhones,
  onAdd,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError(t.invalidName);
      return;
    }
    const cleanPhone = normalizePhone(phoneInput);
    if (!isValidPhone(cleanPhone)) {
      setError(t.invalidPhone);
      return;
    }
    if (existingPhones.has(cleanPhone)) {
      setError(t.duplicatePhone);
      return;
    }
    onAdd(cleanName, cleanPhone);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-customer-title"
    >
      <div className="w-full max-w-md rounded-t-3xl border border-stone-200 bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
        <div className="flex items-center justify-between">
          <h2 id="add-customer-title" className="font-display text-lg font-bold text-stone-900">
            {t.addCustomer}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-700">
              {t.customerName}
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.customerNamePlaceholder}
              className="min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-700">
              {t.phone10Digit}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={14}
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={t.phonePlaceholder}
              className="min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm text-stone-900 tabular-nums focus:border-stone-900 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 whitespace-nowrap"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-lg bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 whitespace-nowrap"
            >
              {t.saveCustomer}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
