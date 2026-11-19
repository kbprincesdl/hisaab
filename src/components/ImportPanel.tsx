import React, { useState } from 'react';
import { FileUp, Upload } from 'lucide-react';
import { Translations } from '../utils/i18n';
import { SAMPLE_SHOP_JSON } from '../utils/ledger';

interface ImportPanelProps {
  t: Translations;
  onImportJson: (rawText: string) => { ok: boolean; message: string };
}

export const ImportPanel: React.FC<ImportPanelProps> = ({ t, onImportJson }) => {
  const [rawJson, setRawJson] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleImportClick = () => {
    const res = onImportJson(rawJson);
    setFeedback(res);
  };

  const handleLoadSample = () => {
    setRawJson(SAMPLE_SHOP_JSON);
    const res = onImportJson(SAMPLE_SHOP_JSON);
    setFeedback(res);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      setRawJson(content);
      const res = onImportJson(content);
      setFeedback(res);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold text-stone-900">
            {t.importTitle}
          </h2>
          <p className="mt-1 text-xs text-stone-500">{t.importSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex min-h-[40px] items-center rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-100 whitespace-nowrap shrink-0"
        >
          {t.loadSampleShop}
        </button>
      </div>

      <textarea
        id="import-box"
        rows={4}
        value={rawJson}
        onChange={(e) => setRawJson(e.target.value)}
        placeholder={t.importPlaceholder}
        className="mt-3 w-full rounded-xl border border-stone-300 bg-stone-50/50 p-3 font-mono text-xs text-stone-800 focus:border-stone-900 focus:bg-white focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 whitespace-nowrap">
          <FileUp className="h-3.5 w-3.5 text-stone-500" />
          <span>{t.uploadJsonFile}</span>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </label>

        <button
          id="import-go"
          type="button"
          onClick={handleImportClick}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800 whitespace-nowrap"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>{t.importButton}</span>
        </button>
      </div>

      {feedback && (
        <p
          role="status"
          className={`mt-2.5 text-xs font-medium ${
            feedback.ok ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          {feedback.message}
        </p>
      )}
    </section>
  );
};
