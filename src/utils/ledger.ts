import {
  AgingBuckets,
  Customer,
  CustomerSummary,
  ImportIssue,
  ImportParseResult,
  Language,
  LedgerEntry,
  Reminder,
  ShopData,
} from '../types/ledger';

export const STORAGE_KEY = 'hisaab_ledger_v1';
export const LANG_STORAGE_KEY = 'hisaab_lang_v1';
export const DEFAULT_SHOP_NAME = 'Lakshmi Provision Store';
export const DEFAULT_UPI_ID = 'kirana@upi';
export const DEFAULT_CREDIT_DAYS = 30;
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_SHOT_BYTES = 2.5 * 1024 * 1024;
export const MAX_TOTAL_SHOT_BYTES = 8 * 1024 * 1024;

const DUE_SOON_DAYS = 7;

export function isValidIsoDate(val: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const [y, m, d] = val.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getEffectiveToday(search?: string): string {
  const query = typeof search === 'string'
    ? search
    : typeof window !== 'undefined'
      ? window.location.search
      : '';
  const params = new URLSearchParams(query);
  const override = params.get('today');
  if (override && isValidIsoDate(override.trim())) {
    return override.trim();
  }
  return getLocalTodayIso();
}

export function addDaysIso(iso: string, days: number): string {
  if (!isValidIsoDate(iso)) return iso;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function daysBetweenIsoDates(fromIso: string, toIso: string): number {
  if (!isValidIsoDate(fromIso) || !isValidIsoDate(toIso)) return 0;
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.max(0, Math.round((toUtc - fromUtc) / 86400000));
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function formatRupees(amount: number): string {
  const rounded = roundMoney(amount);
  const abs = Math.abs(rounded);
  const formatted = abs.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });
  return rounded < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

export function formatSignedRupees(amount: number): string {
  const rounded = roundMoney(amount);
  if (rounded === 0) return formatRupees(0);
  return `${rounded > 0 ? '+' : '-'}₹${Math.abs(rounded).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

export function formatShortDate(iso: string): string {
  if (!isValidIsoDate(iso)) return iso;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatShortDate(new Date(timestamp).toISOString().slice(0, 10));
}

export function formatMonth(iso: string): string {
  if (!isValidIsoDate(iso)) return iso;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function deriveDefaultUpi(shopName: string): string {
  const slug = shopName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 18);
  return `${slug || 'kirana'}@upi`;
}

export function buildUpiLink(upiId: string, shopName: string, amount: number): string {
  const pa = (upiId || deriveDefaultUpi(shopName)).trim();
  const pn = encodeURIComponent(shopName || 'Kirana Shop');
  const am = Math.max(0, roundMoney(amount));
  return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${pn}&am=${am}&cu=INR`;
}

export function buildWhatsAppLink(
  customer: Customer,
  balance: number,
  shopName: string,
  upiId: string,
  lang: Language
): string {
  const due = Math.max(0, roundMoney(balance));
  const cleanShop = shopName.trim() || DEFAULT_SHOP_NAME;
  const upi = due > 0 ? buildUpiLink(upiId, cleanShop, due) : '';

  let message: string;
  if (lang === 'hi') {
    message =
      due > 0
        ? `नमस्ते ${customer.name} जी, ${cleanShop} पर आपका बकाया ₹${due} है। कृपया भुगतान करें।${upi ? ` UPI से पेमेंट करें: ${upi}` : ''}`
        : `नमस्ते ${customer.name} जी, ${cleanShop} में आपका खाता पूरा चुकता (₹0) है। धन्यवाद!`;
  } else {
    message =
      due > 0
        ? `Namaste ${customer.name}, your pending balance at ${cleanShop} is ₹${due}. Kindly pay at your earliest convenience.${upi ? ` Pay via UPI: ${upi}` : ''}`
        : `Namaste ${customer.name}, your ledger balance at ${cleanShop} is ₹0. Thank you!`;
  }

  return `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
}

function emptyAging(): AgingBuckets {
  return { current: 0, days1to15: 0, days16to30: 0, days31to60: 0, days60plus: 0 };
}

function sortTransactions(a: LedgerEntry, b: LedgerEntry): number {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  const ac = a.createdAt ?? 0;
  const bc = b.createdAt ?? 0;
  if (ac !== bc) return ac - bc;
  return a.id.localeCompare(b.id);
}

interface CreditLot {
  date: string;
  remaining: number;
}

function computeAgingForEntries(
  entries: LedgerEntry[],
  creditDays: number,
  todayIso: string
): {
  overdueAmount: number;
  dueSoonAmount: number;
  oldestDueDate: string | null;
  daysOverdue: number;
  aging: AgingBuckets;
} {
  const aging = emptyAging();
  const lots: CreditLot[] = [];
  let advance = 0;

  for (const entry of [...entries].sort(sortTransactions)) {
    if (entry.type === 'credit') {
      let remaining = entry.amount;
      if (advance > 0) {
        const used = Math.min(advance, remaining);
        advance = roundMoney(advance - used);
        remaining = roundMoney(remaining - used);
      }
      if (remaining > 0) {
        lots.push({ date: entry.date, remaining });
      }
    } else {
      let remaining = entry.amount;
      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const used = Math.min(lot.remaining, remaining);
        lot.remaining = roundMoney(lot.remaining - used);
        remaining = roundMoney(remaining - used);
        if (lot.remaining <= 0.005) lots.shift();
      }
      if (remaining > 0) advance = roundMoney(advance + remaining);
    }
  }

  let overdueAmount = 0;
  let dueSoonAmount = 0;
  let oldestDueDate: string | null = null;
  let daysOverdue = 0;

  for (const lot of lots) {
    if (lot.remaining <= 0) continue;
    const dueDate = addDaysIso(lot.date, creditDays);
    if (!oldestDueDate || dueDate < oldestDueDate) oldestDueDate = dueDate;

    const isOverdue = todayIso > dueDate;
    const daysPast = isOverdue ? daysBetweenIsoDates(dueDate, todayIso) : 0;
    const daysUntilDue = isOverdue ? -1 : daysBetweenIsoDates(todayIso, dueDate);

    if (isOverdue) {
      overdueAmount = roundMoney(overdueAmount + lot.remaining);
      daysOverdue = Math.max(daysOverdue, daysPast);
      if (daysPast <= 15) aging.days1to15 = roundMoney(aging.days1to15 + lot.remaining);
      else if (daysPast <= 30) aging.days16to30 = roundMoney(aging.days16to30 + lot.remaining);
      else if (daysPast <= 60) aging.days31to60 = roundMoney(aging.days31to60 + lot.remaining);
      else aging.days60plus = roundMoney(aging.days60plus + lot.remaining);
    } else {
      aging.current = roundMoney(aging.current + lot.remaining);
      if (daysUntilDue <= DUE_SOON_DAYS) {
        dueSoonAmount = roundMoney(dueSoonAmount + lot.remaining);
      }
    }
  }

  return { overdueAmount, dueSoonAmount, oldestDueDate, daysOverdue, aging };
}

export function computeCustomerSummaries(
  customers: Customer[],
  entries: LedgerEntry[],
  todayIso: string,
  creditDays = DEFAULT_CREDIT_DAYS,
  reminders: Reminder[] = []
): CustomerSummary[] {
  const byPhone = new Map<string, LedgerEntry[]>();
  for (const entry of entries) {
    const list = byPhone.get(entry.phone);
    if (list) {
      list.push(entry);
    } else {
      byPhone.set(entry.phone, [entry]);
    }
  }

  const lastReminderByPhone = new Map<string, number>();
  for (const reminder of reminders) {
    const current = lastReminderByPhone.get(reminder.phone) ?? 0;
    if (reminder.sentAt > current) lastReminderByPhone.set(reminder.phone, reminder.sentAt);
  }

  return customers.map((customer) => {
    const list = byPhone.get(customer.phone) ?? [];
    let totalCredit = 0;
    let totalPayment = 0;
    let lastPaymentDate: string | null = null;
    let earliestCreditDate: string | null = null;

    for (const e of list) {
      if (e.type === 'credit') {
        totalCredit = roundMoney(totalCredit + e.amount);
        if (!earliestCreditDate || e.date < earliestCreditDate) {
          earliestCreditDate = e.date;
        }
      } else if (e.type === 'payment') {
        totalPayment = roundMoney(totalPayment + e.amount);
        if (!lastPaymentDate || e.date > lastPaymentDate) {
          lastPaymentDate = e.date;
        }
      }
    }

    const balance = roundMoney(totalCredit - totalPayment);
    let daysSinceLastPayment: number | null = null;
    if (lastPaymentDate) {
      daysSinceLastPayment = daysBetweenIsoDates(lastPaymentDate, todayIso);
    } else if (earliestCreditDate && balance > 0) {
      daysSinceLastPayment = daysBetweenIsoDates(earliestCreditDate, todayIso);
    }

    const agingResult = balance > 0
      ? computeAgingForEntries(list, creditDays, todayIso)
      : {
          overdueAmount: 0,
          dueSoonAmount: 0,
          oldestDueDate: null,
          daysOverdue: 0,
          aging: emptyAging(),
        };

    return {
      customer,
      balance,
      totalCredit,
      totalPayment,
      lastPaymentDate,
      earliestCreditDate,
      daysSinceLastPayment,
      entryCount: list.length,
      overdueAmount: agingResult.overdueAmount,
      dueSoonAmount: agingResult.dueSoonAmount,
      oldestDueDate: agingResult.oldestDueDate,
      daysOverdue: agingResult.daysOverdue,
      aging: agingResult.aging,
      lastRemindedAt: lastReminderByPhone.get(customer.phone) ?? null,
    };
  });
}

export function computeTotalOutstanding(summaries: CustomerSummary[]): number {
  return roundMoney(
    summaries.reduce((sum, s) => sum + (s.balance > 0 ? s.balance : 0), 0)
  );
}

export function computeTotalOverdue(summaries: CustomerSummary[]): number {
  return roundMoney(summaries.reduce((sum, s) => sum + s.overdueAmount, 0));
}

export function computeTotalDueSoon(summaries: CustomerSummary[]): number {
  return roundMoney(summaries.reduce((sum, s) => sum + s.dueSoonAmount, 0));
}

export function sortEntriesNewestFirst(entries: LedgerEntry[]): LedgerEntry[] {
  return entries
    .map((entry, idx) => ({ entry, idx }))
    .sort((a, b) => {
      if (a.entry.date !== b.entry.date) {
        return b.entry.date.localeCompare(a.entry.date);
      }
      const ca = a.entry.createdAt ?? 0;
      const cb = b.entry.createdAt ?? 0;
      if (ca !== cb) return cb - ca;
      return b.idx - a.idx;
    })
    .map((item) => item.entry);
}

export function createEntryId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `e_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createReminderId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeShopName(value: string): string {
  const cleaned = value.replace(/\s*\(fictional\)\s*$/i, '').trim();
  if (!cleaned || cleaned === 'My Kirana Store' || cleaned === 'Hisaab Store') {
    return DEFAULT_SHOP_NAME;
  }
  return cleaned;
}

export function createDefaultShopData(): ShopData {
  return {
    shop: DEFAULT_SHOP_NAME,
    upiId: DEFAULT_UPI_ID,
    creditDays: DEFAULT_CREDIT_DAYS,
    customers: [],
    entries: [],
    reminders: [],
  };
}

function readNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
}

function readOptionalString(value: unknown, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed.slice(0, max);
}

function readOptionalLanguage(value: unknown): Language | undefined {
  return value === 'en' || value === 'hi' ? value : undefined;
}

export function normalizeStoredData(raw: unknown, fallback?: Partial<ShopData>): ShopData {
  const base = createDefaultShopData();
  if (!raw || typeof raw !== 'object') {
    return {
      ...base,
      shop: fallback?.shop ?? base.shop,
      upiId: fallback?.upiId ?? base.upiId,
      creditDays: fallback?.creditDays ?? base.creditDays,
    };
  }

  const parsed = raw as Record<string, unknown>;
  const rawShop = typeof parsed.shop === 'string' && parsed.shop.trim()
    ? parsed.shop.trim().slice(0, 80)
    : fallback?.shop ?? base.shop;
  const shop = normalizeShopName(rawShop);
  const upiId = typeof parsed.upiId === 'string' && parsed.upiId.trim()
    ? parsed.upiId.trim().slice(0, 120)
    : fallback?.upiId ?? deriveDefaultUpi(shop);
  const creditDaysRaw = readNumber(parsed.creditDays);
  const creditDays = Number.isInteger(creditDaysRaw) && creditDaysRaw >= 1 && creditDaysRaw <= 365
    ? creditDaysRaw
    : fallback?.creditDays ?? base.creditDays;

  const customers: Customer[] = [];
  const phones = new Set<string>();
  if (Array.isArray(parsed.customers)) {
    for (const item of parsed.customers) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as Record<string, unknown>;
      const name = typeof rec.name === 'string' ? rec.name.trim().slice(0, 80) : '';
      const phone = normalizePhone(String(rec.phone ?? ''));
      if (!name || !isValidPhone(phone) || phones.has(phone)) continue;
      phones.add(phone);
      const creditLimitRaw = readNumber(rec.creditLimit);
      customers.push({
        name,
        phone,
        notes: readOptionalString(rec.notes, 500),
        creditLimit: Number.isFinite(creditLimitRaw) && creditLimitRaw >= 0
          ? roundMoney(creditLimitRaw)
          : undefined,
        language: readOptionalLanguage(rec.language),
        createdAt: typeof rec.createdAt === 'number' ? rec.createdAt : undefined,
      });
    }
  }

  const entries: LedgerEntry[] = [];
  const entryIds = new Set<string>();
  if (Array.isArray(parsed.entries)) {
    for (const item of parsed.entries) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as Record<string, unknown>;
      const phone = normalizePhone(String(rec.phone ?? ''));
      const type = rec.type === 'payment' ? 'payment' : rec.type === 'credit' ? 'credit' : null;
      const amount = readNumber(rec.amount);
      const date = typeof rec.date === 'string' ? rec.date.trim() : '';
      if (!isValidPhone(phone) || !type || !Number.isFinite(amount) || amount <= 0 || !isValidIsoDate(date)) {
        continue;
      }
      // Keep money records even if their customer row was lost; repair the customer.
      if (!phones.has(phone)) {
        phones.add(phone);
        customers.push({ name: phone, phone });
      }
      let id = typeof rec.id === 'string' && rec.id ? rec.id.slice(0, 100) : createEntryId();
      if (entryIds.has(id)) id = createEntryId();
      entryIds.add(id);
      entries.push({
        id,
        phone,
        type,
        amount: roundMoney(amount),
        date,
        note: readOptionalString(rec.note, 300) ?? '',
        shot: typeof rec.shot === 'string' && rec.shot.startsWith('data:image/')
          ? rec.shot.slice(0, MAX_SHOT_BYTES)
          : undefined,
        method: rec.method === 'cash' || rec.method === 'upi' || rec.method === 'other'
          ? rec.method
          : undefined,
        createdAt: typeof rec.createdAt === 'number' ? rec.createdAt : undefined,
        updatedAt: typeof rec.updatedAt === 'number' ? rec.updatedAt : undefined,
      });
    }
  }

  const reminders: Reminder[] = [];
  const reminderIds = new Set<string>();
  if (Array.isArray(parsed.reminders)) {
    for (const item of parsed.reminders) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as Record<string, unknown>;
      const phone = normalizePhone(String(rec.phone ?? ''));
      const sentAt = readNumber(rec.sentAt);
      if (!isValidPhone(phone) || !Number.isFinite(sentAt) || sentAt <= 0) continue;
      let id = typeof rec.id === 'string' && rec.id ? rec.id.slice(0, 100) : createReminderId();
      if (reminderIds.has(id)) id = createReminderId();
      reminderIds.add(id);
      reminders.push({
        id,
        phone,
        sentAt,
        channel: 'whatsapp',
        lang: rec.lang === 'hi' ? 'hi' : 'en',
      });
    }
  }

  return { shop, upiId, creditDays, customers, entries, reminders };
}

export function parseImportJsonStrict(
  rawText: string,
  current?: Partial<ShopData>
): ImportParseResult {
  if (typeof rawText !== 'string' || rawText.trim() === '') {
    return { ok: false, errors: [{ row: 0, field: 'file', message: 'The file is empty.' }] };
  }
  if (rawText.length > MAX_IMPORT_BYTES) {
    return {
      ok: false,
      errors: [{ row: 0, field: 'file', message: 'The file is larger than 10 MB.' }],
    };
  }

  let root: unknown;
  try {
    root = JSON.parse(rawText);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    return { ok: false, errors: [{ row: 0, field: 'file', message: `Invalid JSON: ${message}` }] };
  }

  if (root && typeof root === 'object' && (root as Record<string, unknown>).format === 'hisaab-backup') {
    const backupData = (root as Record<string, unknown>).data;
    if (backupData && typeof backupData === 'object') {
      root = backupData;
    }
  }

  if (!root || typeof root !== 'object' || Array.isArray(root)) {
    return { ok: false, errors: [{ row: 0, field: 'file', message: 'Root must be an object.' }] };
  }

  const rec = root as Record<string, unknown>;
  if (!Array.isArray(rec.customers) || !Array.isArray(rec.entries)) {
    return {
      ok: false,
      errors: [{ row: 0, field: 'file', message: 'Expected customers and entries arrays.' }],
    };
  }
  if (rec.customers.length > 10000) {
    return {
      ok: false,
      errors: [{ row: 0, field: 'customers', message: 'At most 10,000 customers can be imported.' }],
    };
  }
  if (rec.entries.length > 100000) {
    return {
      ok: false,
      errors: [{ row: 0, field: 'entries', message: 'At most 100,000 entries can be imported.' }],
    };
  }
  if (rec.reminders !== undefined && !Array.isArray(rec.reminders)) {
    return {
      ok: false,
      errors: [{ row: 0, field: 'reminders', message: 'reminders must be an array when present.' }],
    };
  }

  const errors: ImportIssue[] = [];
  const shop = normalizeShopName(
    typeof rec.shop === 'string' && rec.shop.trim()
      ? rec.shop.trim().slice(0, 80)
      : current?.shop ?? DEFAULT_SHOP_NAME
  );
  const upiId = typeof rec.upiId === 'string' && rec.upiId.trim()
    ? rec.upiId.trim().slice(0, 120)
    : current?.upiId ?? deriveDefaultUpi(shop);
  if (upiId.includes(' ') || upiId.length < 3) {
    errors.push({ row: 0, field: 'upiId', message: 'UPI ID must be at least 3 characters and contain no spaces.' });
  }
  const creditDaysRaw = readNumber(rec.creditDays);
  const creditDays = rec.creditDays === undefined
    ? current?.creditDays ?? DEFAULT_CREDIT_DAYS
    : Number.isInteger(creditDaysRaw) && creditDaysRaw >= 1 && creditDaysRaw <= 365
      ? creditDaysRaw
      : Number.NaN;
  if (!Number.isFinite(creditDays)) {
    errors.push({ row: 0, field: 'creditDays', message: 'Credit period must be a whole number from 1 to 365.' });
  }

  const customers: Customer[] = [];
  const phones = new Set<string>();
  rec.customers.forEach((item, index) => {
    const row = index + 1;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push({ row, field: 'customer', message: 'Customer must be an object.' });
      return;
    }
    const c = item as Record<string, unknown>;
    const name = typeof c.name === 'string' ? c.name.trim() : '';
    const phone = normalizePhone(typeof c.phone === 'string' ? c.phone : String(c.phone ?? ''));
    if (!name) errors.push({ row, field: 'name', message: 'Customer name is required.' });
    if (name.length > 80) errors.push({ row, field: 'name', message: 'Customer name must be 80 characters or fewer.' });
    if (!isValidPhone(phone)) errors.push({ row, field: 'phone', message: 'Phone must be a valid 10-digit mobile number.' });
    if (phones.has(phone)) errors.push({ row, field: 'phone', message: 'Duplicate phone number in this file.' });
    if (phones.has(phone)) return;
    if (name && name.length <= 80 && isValidPhone(phone)) {
      phones.add(phone);
      const creditLimitRaw = readNumber(c.creditLimit);
      const language = readOptionalLanguage(c.language);
      customers.push({
        name,
        phone,
        notes: readOptionalString(c.notes, 500),
        creditLimit: c.creditLimit !== undefined && Number.isFinite(creditLimitRaw) && creditLimitRaw >= 0
          ? roundMoney(creditLimitRaw)
          : undefined,
        language,
        createdAt: typeof c.createdAt === 'number' ? c.createdAt : undefined,
      });
    }
  });

  const entries: LedgerEntry[] = [];
  const entryIds = new Set<string>();
  let totalShotBytes = 0;
  rec.entries.forEach((item, index) => {
    const row = index + 1;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push({ row, field: 'entry', message: 'Entry must be an object.' });
      return;
    }
    const e = item as Record<string, unknown>;
    const phone = normalizePhone(typeof e.phone === 'string' ? e.phone : String(e.phone ?? ''));
    const type = e.type === 'credit' || e.type === 'payment' ? e.type : null;
    const amountRaw = readNumber(e.amount);
    const amount = Number.isFinite(amountRaw) ? roundMoney(amountRaw) : Number.NaN;
    const date = typeof e.date === 'string' ? e.date.trim() : '';
    const note = typeof e.note === 'string' ? e.note.trim() : '';

    if (!type) errors.push({ row, field: 'type', message: 'Type must be credit or payment.' });
    if (!isValidPhone(phone)) errors.push({ row, field: 'phone', message: 'Entry phone is not a valid 10-digit number.' });
    if (!phones.has(phone)) errors.push({ row, field: 'phone', message: 'No customer with this phone number exists in the file.' });
    if (!Number.isFinite(amount) || amount <= 0) errors.push({ row, field: 'amount', message: 'Amount must be greater than 0.' });
    if (amount > 50000000) errors.push({ row, field: 'amount', message: 'Amount cannot exceed ₹5,00,00,000.' });
    if (!isValidIsoDate(date)) errors.push({ row, field: 'date', message: 'Date must be a real date in YYYY-MM-DD format.' });
    if (note.length > 300) errors.push({ row, field: 'note', message: 'Note must be 300 characters or fewer.' });

    let shot: string | undefined;
    if (e.shot !== undefined && e.shot !== null && e.shot !== '') {
      if (typeof e.shot !== 'string' || (!e.shot.startsWith('data:image/') && !/^https?:\/\//.test(e.shot))) {
        errors.push({ row, field: 'shot', message: 'Receipt must be an image data URL or an https URL.' });
      } else if (e.shot.length > MAX_SHOT_BYTES) {
        errors.push({ row, field: 'shot', message: 'A receipt image is larger than 2.5 MB.' });
      } else if (totalShotBytes + e.shot.length > MAX_TOTAL_SHOT_BYTES) {
        errors.push({ row, field: 'shot', message: 'Receipt images in this file exceed 8 MB in total.' });
      } else {
        totalShotBytes += e.shot.length;
        shot = e.shot;
      }
    }

    let id = typeof e.id === 'string' && e.id.trim() ? e.id.trim().slice(0, 100) : createEntryId();
    if (entryIds.has(id)) {
      errors.push({ row, field: 'id', message: 'Duplicate entry id in this file.' });
      id = createEntryId();
    }

    if (type && isValidPhone(phone) && phones.has(phone) && Number.isFinite(amount) && amount > 0 && amount <= 50000000 && isValidIsoDate(date) && note.length <= 300) {
      entryIds.add(id);
      entries.push({
        id,
        phone,
        type,
        amount,
        date,
        note,
        shot,
        method: e.method === 'cash' || e.method === 'upi' || e.method === 'other'
          ? e.method
          : undefined,
        createdAt: typeof e.createdAt === 'number' ? e.createdAt : undefined,
        updatedAt: typeof e.updatedAt === 'number' ? e.updatedAt : undefined,
      });
    }
  });

  const reminders: Reminder[] = [];
  const reminderIds = new Set<string>();
  if (Array.isArray(rec.reminders)) {
    rec.reminders.slice(0, 5000).forEach((item, index) => {
      const row = index + 1;
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push({ row, field: 'reminder', message: 'Reminder must be an object.' });
        return;
      }
      const r = item as Record<string, unknown>;
      const phone = normalizePhone(typeof r.phone === 'string' ? r.phone : String(r.phone ?? ''));
      const sentAt = readNumber(r.sentAt);
      if (!isValidPhone(phone) || !phones.has(phone) || !Number.isFinite(sentAt) || sentAt <= 0) {
        errors.push({ row, field: 'reminder', message: 'Reminder needs a known phone and a valid sentAt timestamp.' });
        return;
      }
      let id = typeof r.id === 'string' && r.id.trim() ? r.id.trim().slice(0, 100) : createReminderId();
      if (reminderIds.has(id)) id = createReminderId();
      reminderIds.add(id);
      reminders.push({
        id,
        phone,
        sentAt,
        channel: 'whatsapp',
        lang: r.lang === 'hi' ? 'hi' : 'en',
      });
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors: errors.slice(0, 50) };
  }

  const warnings: string[] = [];
  const customersWithEntries = new Set(entries.map((e) => e.phone));
  const emptyCount = customers.filter((c) => !customersWithEntries.has(c.phone)).length;
  if (emptyCount > 0) warnings.push(`${emptyCount} customer${emptyCount === 1 ? '' : 's'} have no entries.`);

  return {
    ok: true,
    data: {
      shop,
      upiId,
      creditDays,
      customers,
      entries,
      reminders,
    },
    warnings,
  };
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsv(data: ShopData, summaries: CustomerSummary[]): string {
  const customerMap = new Map<string, CustomerSummary>();
  for (const s of summaries) {
    customerMap.set(s.customer.phone, s);
  }

  const rows: string[] = [
    [
      'Customer Name',
      'Phone',
      'Type',
      'Amount',
      'Date',
      'Note',
      'Method',
      'Entry ID',
      'Customer Balance',
      'Overdue Amount',
    ]
      .map(escapeCsvCell)
      .join(','),
  ];

  const sorted = sortEntriesNewestFirst(data.entries);
  for (const entry of sorted) {
    const summary = customerMap.get(entry.phone);
    rows.push(
      [
        summary?.customer.name ?? entry.phone,
        entry.phone,
        entry.type,
        entry.amount,
        entry.date,
        entry.note,
        entry.method ?? '',
        entry.id,
        summary?.balance ?? 0,
        summary?.overdueAmount ?? 0,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const summary of summaries) {
    if (summary.entryCount === 0) {
      rows.push(
        [
          summary.customer.name,
          summary.customer.phone,
          'opening',
          0,
          '',
          '',
          '',
          '',
          summary.balance,
          summary.overdueAmount,
        ]
          .map(escapeCsvCell)
          .join(',')
      );
    }
  }

  return `\uFEFF${rows.join('\n')}`;
}

export function mergeShopData(local: ShopData, remote: ShopData): ShopData {
  const customers = new Map<string, Customer>();
  for (const customer of remote.customers) customers.set(customer.phone, customer);
  for (const customer of local.customers) {
    const existing = customers.get(customer.phone);
    if (!existing) {
      customers.set(customer.phone, customer);
    } else {
      customers.set(customer.phone, {
        ...existing,
        ...customer,
        notes: customer.notes ?? existing.notes,
        creditLimit: customer.creditLimit ?? existing.creditLimit,
        language: customer.language ?? existing.language,
        createdAt: customer.createdAt ?? existing.createdAt,
      });
    }
  }

  const entries = new Map<string, LedgerEntry>();
  for (const entry of remote.entries) entries.set(entry.id, entry);
  for (const entry of local.entries) {
    const existing = entries.get(entry.id);
    if (!existing) {
      entries.set(entry.id, entry);
    } else {
      const localTime = entry.updatedAt ?? entry.createdAt ?? 0;
      const remoteTime = existing.updatedAt ?? existing.createdAt ?? 0;
      if (localTime >= remoteTime) entries.set(entry.id, entry);
    }
  }

  const reminders = new Map<string, Reminder>();
  for (const reminder of remote.reminders) reminders.set(reminder.id, reminder);
  for (const reminder of local.reminders) {
    if (!reminders.has(reminder.id)) reminders.set(reminder.id, reminder);
  }

  const remoteCustomized =
    remote.shop !== DEFAULT_SHOP_NAME ||
    remote.upiId !== DEFAULT_UPI_ID ||
    remote.creditDays !== DEFAULT_CREDIT_DAYS;
  const settings = remoteCustomized ? remote : local;

  return {
    shop: settings.shop,
    upiId: settings.upiId,
    creditDays: settings.creditDays,
    customers: [...customers.values()],
    entries: [...entries.values()],
    reminders: [...reminders.values()],
  };
}

const SAMPLE_SHOP_BASE = {
  shop: 'Lakshmi Provision Store',
  upiId: 'lakshmi@upi',
  creditDays: 30,
  reminders: [],
  customers: [
    { name: 'Ravi Kumar', phone: '9000000101' },
    { name: 'Sunita Devi', phone: '9000000102' },
    { name: 'Mohd Irfan', phone: '9000000103' },
    { name: 'Anjali Reddy', phone: '9000000104' },
    { name: 'Prakash Rao', phone: '9000000105' },
    { name: 'Fatima Begum', phone: '9000000106' },
    { name: 'Venkat Naidu', phone: '9000000107' },
    { name: 'Kavitha S', phone: '9000000108' },
  ],
  entries: [
    { phone: '9000000101', type: 'credit', amount: 250, date: '2026-09-27', note: 'groceries' },
    { phone: '9000000101', type: 'credit', amount: 1500, date: '2026-10-06', note: 'groceries' },
    { phone: '9000000101', type: 'payment', amount: 180, date: '2026-10-10', note: 'paid on UPI', method: 'upi' },
    { phone: '9000000101', type: 'credit', amount: 420, date: '2026-10-19', note: 'groceries' },
    { phone: '9000000101', type: 'credit', amount: 180, date: '2026-10-23', note: 'groceries' },
    { phone: '9000000101', type: 'payment', amount: 1500, date: '2026-10-25', note: 'paid on UPI', method: 'upi' },
    { phone: '9000000102', type: 'credit', amount: 1500, date: '2026-09-20', note: 'groceries' },
    { phone: '9000000102', type: 'credit', amount: 1200, date: '2026-09-22', note: 'groceries' },
    { phone: '9000000102', type: 'payment', amount: 120, date: '2026-09-25', note: 'paid on UPI', method: 'upi' },
    { phone: '9000000102', type: 'credit', amount: 340, date: '2026-09-27', note: 'groceries' },
    { phone: '9000000102', type: 'credit', amount: 1500, date: '2026-10-02', note: 'groceries' },
    { phone: '9000000102', type: 'payment', amount: 950, date: '2026-10-04', note: 'paid on UPI', method: 'upi' },
    { phone: '9000000103', type: 'credit', amount: 1200, date: '2026-09-23', note: 'groceries' },
    { phone: '9000000103', type: 'credit', amount: 420, date: '2026-09-28', note: 'groceries' },
    { phone: '9000000103', type: 'payment', amount: 120, date: '2026-10-07', note: 'paid on UPI', method: 'upi' },
    { phone: '9000000103', type: 'credit', amount: 950, date: '2026-10-10', note: 'groceries' },
    { phone: '9000000103', type: 'credit', amount: 780, date: '2026-10-16', note: 'groceries' },
    { phone: '9000000103', type: 'payment', amount: 420, date: '2026-10-19', note: 'paid on UPI', method: 'upi' },
    { phone: '9000000104', type: 'credit', amount: 120, date: '2026-09-26', note: 'groceries' },
    { phone: '9000000104', type: 'credit', amount: 1500, date: '2026-09-29', note: 'groceries' },
    { phone: '9000000104', type: 'payment', amount: 780, date: '2026-10-02', note: 'paid on UPI', method: 'upi' },
    { phone: '9000000104', type: 'credit', amount: 420, date: '2026-10-05', note: 'groceries' },
    { phone: '9000000105', type: 'credit', amount: 120, date: '2026-09-08', note: 'groceries' },
    { phone: '9000000105', type: 'credit', amount: 340, date: '2026-09-13', note: 'groceries' },
    { phone: '9000000105', type: 'payment', amount: 230, date: '2026-09-15', note: 'paid in cash', method: 'cash' },
    { phone: '9000000106', type: 'credit', amount: 1500, date: '2026-09-26', note: 'groceries' },
    { phone: '9000000106', type: 'credit', amount: 420, date: '2026-10-01', note: 'groceries' },
    { phone: '9000000106', type: 'payment', amount: 180, date: '2026-10-08', note: 'paid on UPI', method: 'upi' },
    { phone: '9000000106', type: 'credit', amount: 560, date: '2026-10-14', note: 'groceries' },
    { phone: '9000000106', type: 'credit', amount: 780, date: '2026-10-16', note: 'groceries' },
    { phone: '9000000106', type: 'payment', amount: 250, date: '2026-10-19', note: 'paid on UPI', method: 'upi' },
    { phone: '9000000107', type: 'credit', amount: 950, date: '2026-10-08', note: 'groceries' },
    { phone: '9000000107', type: 'credit', amount: 250, date: '2026-10-17', note: 'groceries' },
    { phone: '9000000107', type: 'payment', amount: 950, date: '2026-10-22', note: 'paid on UPI', method: 'upi' },
    { phone: '9000000108', type: 'credit', amount: 780, date: '2026-09-17', note: 'groceries' },
    { phone: '9000000108', type: 'credit', amount: 180, date: '2026-09-25', note: 'groceries' },
    { phone: '9000000108', type: 'payment', amount: 780, date: '2026-10-03', note: 'paid on UPI', method: 'upi' },
    { phone: '9000000108', type: 'credit', amount: 120, date: '2026-10-08', note: 'groceries' },
  ],
};

const sampleShiftDays = daysBetweenIsoDates('2026-10-25', getLocalTodayIso());

export const SAMPLE_SHOP_JSON = JSON.stringify(
  {
    ...SAMPLE_SHOP_BASE,
    entries: SAMPLE_SHOP_BASE.entries.map((entry) => ({
      ...entry,
      date: addDaysIso(entry.date, sampleShiftDays),
    })),
  },
  null,
  2
);
