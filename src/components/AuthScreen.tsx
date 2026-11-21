import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Cloud,
  Loader2,
  Mail,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { Translations } from '../utils/i18n';
import { BrandMark } from './BrandMark';

interface AuthScreenProps {
  t: Translations;
  cloudConfigured: boolean;
  busy: boolean;
  error: string | null;
  sentTo: string | null;
  hasLocalData: boolean;
  onSignIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  onUseOffline: () => void;
  onClose?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  t,
  cloudConfigured,
  busy,
  error,
  sentTo,
  hasLocalData,
  onSignIn,
  onUseOffline,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError(t.invalidEmail);
      return;
    }
    const result = await onSignIn(email.trim());
    if (!result.ok) setLocalError(result.error ?? 'Could not send the link.');
  };

  const resend = async () => {
    if (!sentTo) return;
    setLocalError(null);
    const result = await onSignIn(sentTo);
    if (!result.ok) setLocalError(result.error ?? 'Could not send the link.');
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-hisaab px-5 py-6 text-cream sm:px-8 sm:py-10 lg:px-14 lg:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 85% 12%, rgba(242,181,68,0.22), transparent 34%), radial-gradient(circle at 8% 92%, rgba(232,117,26,0.18), transparent 38%)',
            }}
          />
          <div className="relative mx-auto flex h-full max-w-xl flex-col justify-between gap-6 sm:gap-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-2xl bg-cream p-1.5">
                  <BrandMark size={36} className="text-hisaab" />
                </span>
                <span>
                  <span className="block font-display text-2xl font-extrabold leading-none tracking-[-0.04em]">
                    {t.appName}
                  </span>
                  <span className="mt-1 block text-[11px] font-medium text-cream/60">
                    {t.ledgerSubtitle}
                  </span>
                </span>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-cream/20 px-3 text-xs font-bold text-cream/80 hover:bg-cream/10"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t.back}
                </button>
              )}
            </div>

            <div>
              <p className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-gold sm:block">
                {t.ledgerSubtitle}
              </p>
              <h1 className="mt-3 max-w-lg font-display text-[clamp(2rem,5vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.05em]">
                {t.welcomeTitle}
              </h1>
              <p className="mt-4 hidden max-w-md text-sm leading-relaxed text-cream/70 sm:block sm:text-base">
                {t.welcomeSubtitle}
              </p>

              <ul className="mt-7 hidden gap-2.5 text-sm text-cream/80 sm:grid">
                {[t.featureCloud, t.featureBackup, t.featurePrivate, t.featureHindi].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 text-gold">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden items-center gap-3 text-[11px] text-cream/65 lg:flex">
              <span className="h-px flex-1 bg-cream/15" />
              <span>Made for the shop counter</span>
              <span className="h-px flex-1 bg-cream/15" />
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
          <div className="w-full max-w-md">
            <div className="rounded-[1.75rem] border border-line bg-white/75 p-5 shadow-[0_24px_80px_-48px_rgba(11,61,46,0.45)] sm:p-7">
              {sentTo ? (
                <div className="text-center">
                  <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-settled-soft text-settled">
                    <Mail className="h-6 w-6" />
                  </span>
                  <h2 className="mt-4 text-2xl font-extrabold text-ink">{t.checkEmail}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {t.checkEmailBody(sentTo)}
                  </p>
                  <button
                    type="button"
                    onClick={resend}
                    disabled={busy}
                    className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-hisaab px-4 text-sm font-extrabold text-cream hover:bg-hisaab-deep disabled:opacity-60"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {busy ? t.sendingLink : t.resend}
                  </button>
                  <button
                    type="button"
                    onClick={onUseOffline}
                    className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-bold text-ink-muted hover:bg-cream-deep hover:text-ink"
                  >
                    <WifiOff className="h-4 w-4" />
                    {t.useOffline}
                  </button>
                  <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">{t.offlineNote}</p>
                </div>
              ) : (
                <>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-soft text-saffron-ink">
                    <Cloud className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-2xl font-extrabold text-ink">{t.signIn}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {t.welcomeSubtitle}
                  </p>

                  <form onSubmit={submit} className="mt-5 space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-ink-muted" htmlFor="auth-email">
                        {t.emailLabel}
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="min-h-[52px] w-full rounded-2xl border border-line bg-white px-4 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-hisaab focus:outline-none"
                      />
                    </div>

                    {(localError || error) && (
                      <p className="rounded-xl bg-overdue-soft px-3 py-2 text-xs font-bold text-overdue" role="alert">
                        {localError || error}
                      </p>
                    )}

                    {!cloudConfigured && (
                      <p className="rounded-xl bg-due-soft px-3 py-2 text-xs font-bold text-due">
                        {t.cloudNotConfigured}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={busy || !cloudConfigured}
                      className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-hisaab px-4 text-sm font-extrabold text-cream hover:bg-hisaab-deep disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      {busy ? t.sendingLink : t.sendLink}
                    </button>
                  </form>

                  <div className="my-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                    <span className="h-px flex-1 bg-line" />
                    or
                    <span className="h-px flex-1 bg-line" />
                  </div>

                  <button
                    type="button"
                    onClick={onUseOffline}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-bold text-ink-muted hover:bg-cream-deep hover:text-ink"
                  >
                    <WifiOff className="h-4 w-4" />
                    {t.useOffline}
                  </button>
                  <p className="mt-2 text-center text-[11px] leading-relaxed text-ink-muted">
                    {t.offlineNote}
                  </p>
                </>
              )}
            </div>

            <p className="mt-4 flex items-start justify-center gap-2 px-3 text-center text-[11px] leading-relaxed text-ink-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-settled" />
              {t.privacyNote}
            </p>

            {hasLocalData && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="mx-auto mt-3 flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-xs font-bold text-ink-muted hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t.backToLedger}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
