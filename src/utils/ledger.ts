import { Customer, CustomerSummary, Language, LedgerEntry, ShopData } from '../types/ledger';

export const STORAGE_KEY = 'hisaab_ledger_v1';
export const LANG_STORAGE_KEY = 'hisaab_lang_v1';

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

export function formatRupees(amount: number): string {
  const abs = Math.abs(Math.round(amount * 100) / 100);
  const formatted = abs.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-Rs ${formatted}` : `Rs ${formatted}`;
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
  const am = Math.max(0, Math.round(amount * 100) / 100);
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR`;
}

export function buildWhatsAppLink(
  customer: Customer,
  balance: number,
  shopName: string,
  upiId: string,
  lang: Language
): string {
  const due = Math.max(0, Math.round(balance * 100) / 100);
  const cleanShop = shopName.trim() || 'Hisaab Store';
  const upi = due > 0 ? buildUpiLink(upiId, cleanShop, due) : '';

  let message: string;
  if (lang === 'hi') {
    message =
      due > 0
        ? `नमस्ते ${customer.name} जी, ${cleanShop} पर आपका बकाया हिसाब Rs ${due} है। कृपया भुगतान करें।${upi ? ` UPI से पेमेंट करें: ${upi}` : ''}`
        : `नमस्ते ${customer.name} जी, ${cleanShop} में आपका खाता पूरा चुकता (Rs 0) है। धन्यवाद!`;
  } else {
    message =
      due > 0
        ? `Namaste ${customer.name}, your pending balance at ${cleanShop} is Rs ${due}. Kindly pay at your earliest convenience.${upi ? ` Pay via UPI: ${upi}` : ''}`
        : `Namaste ${customer.name}, your ledger balance at ${cleanShop} is Rs 0. Thank you!`;
  }

  return `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
}

export function computeCustomerSummaries(
  customers: Customer[],
  entries: LedgerEntry[],
  todayIso: string
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

  return customers.map((customer) => {
    const list = byPhone.get(customer.phone) ?? [];
    let totalCredit = 0;
    let totalPayment = 0;
    let lastPaymentDate: string | null = null;
    let earliestCreditDate: string | null = null;

    for (const e of list) {
      if (e.type === 'credit') {
        totalCredit += e.amount;
        if (!earliestCreditDate || e.date < earliestCreditDate) {
          earliestCreditDate = e.date;
        }
      } else if (e.type === 'payment') {
        totalPayment += e.amount;
        if (!lastPaymentDate || e.date > lastPaymentDate) {
          lastPaymentDate = e.date;
        }
      }
    }

    const balance = Math.round((totalCredit - totalPayment) * 100) / 100;
    let daysSinceLastPayment: number | null = null;
    if (lastPaymentDate) {
      daysSinceLastPayment = daysBetweenIsoDates(lastPaymentDate, todayIso);
    } else if (earliestCreditDate && balance > 0) {
      daysSinceLastPayment = daysBetweenIsoDates(earliestCreditDate, todayIso);
    }

    return {
      customer,
      balance,
      totalCredit,
      totalPayment,
      lastPaymentDate,
      earliestCreditDate,
      daysSinceLastPayment,
      entryCount: list.length,
    };
  });
}

export function computeTotalOutstanding(summaries: CustomerSummary[]): number {
  return Math.round(
    summaries.reduce((sum, s) => sum + (s.balance > 0 ? s.balance : 0), 0) * 100
  ) / 100;
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

export function parseImportJson(rawText: string, existingUpiId?: string): ShopData {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Root must be an object');
  }
  if (!Array.isArray(parsed.customers) || !Array.isArray(parsed.entries)) {
    throw new Error('Missing customers or entries array');
  }

  const shop = typeof parsed.shop === 'string' && parsed.shop.trim()
    ? parsed.shop.trim()
    : 'My Kirana Store';

  const seenPhones = new Set<string>();
  const customers: Customer[] = [];
  for (const rawCust of parsed.customers) {
    if (!rawCust || typeof rawCust !== 'object') continue;
    const phone = normalizePhone(String(rawCust.phone ?? ''));
    const name = String(rawCust.name ?? '').trim();
    if (!name || !isValidPhone(phone) || seenPhones.has(phone)) continue;
    seenPhones.add(phone);
    customers.push({ name, phone });
  }

  const entries: LedgerEntry[] = [];
  parsed.entries.forEach((rawEntry: unknown, index: number) => {
    if (!rawEntry || typeof rawEntry !== 'object') return;
    const rec = rawEntry as Record<string, unknown>;
    const phone = normalizePhone(String(rec.phone ?? ''));
    const type = rec.type === 'payment' ? 'payment' : rec.type === 'credit' ? 'credit' : null;
    const amount = Number(rec.amount);
    const date = String(rec.date ?? '').trim();
    const note = String(rec.note ?? '').trim();
    const shot = typeof rec.shot === 'string' && rec.shot ? rec.shot : undefined;
    if (!isValidPhone(phone) || !type || !Number.isFinite(amount) || amount <= 0 || !isValidIsoDate(date)) {
      return;
    }
    // Auto-add customer if entry references an unknown phone
    if (!seenPhones.has(phone)) {
      seenPhones.add(phone);
      customers.push({ name: phone, phone });
    }
    entries.push({
      id: typeof rec.id === 'string' && rec.id ? rec.id : `imp_${index}_${Date.now()}`,
      phone,
      type,
      amount: Math.round(amount * 100) / 100,
      date,
      note,
      shot,
      createdAt: index,
    });
  });

  const upiId = typeof parsed.upiId === 'string' && parsed.upiId.trim()
    ? parsed.upiId.trim()
    : existingUpiId && existingUpiId.trim()
      ? existingUpiId.trim()
      : deriveDefaultUpi(shop);

  return {
    shop,
    upiId,
    customers,
    entries,
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
    ['Customer Name', 'Phone', 'Type', 'Amount', 'Date', 'Note', 'Customer Balance'].map(escapeCsvCell).join(','),
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
        summary?.balance ?? 0,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  // Include customers with zero entries so CSV reflects all customers if needed
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
          summary.balance,
        ]
          .map(escapeCsvCell)
          .join(',')
      );
    }
  }

  return rows.join('\n');
}

export const SAMPLE_SHOP_JSON = JSON.stringify(
  {
    shop: 'Lakshmi Provision Store (fictional)',
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
      { phone: '9000000101', type: 'payment', amount: 180, date: '2026-10-10', note: 'paid on UPI' },
      { phone: '9000000101', type: 'credit', amount: 420, date: '2026-10-19', note: 'groceries' },
      { phone: '9000000101', type: 'credit', amount: 180, date: '2026-10-23', note: 'groceries' },
      { phone: '9000000101', type: 'payment', amount: 1500, date: '2026-10-25', note: 'paid on UPI' },
      { phone: '9000000102', type: 'credit', amount: 1500, date: '2026-09-20', note: 'groceries' },
      { phone: '9000000102', type: 'credit', amount: 1200, date: '2026-09-22', note: 'groceries' },
      { phone: '9000000102', type: 'payment', amount: 120, date: '2026-09-25', note: 'paid on UPI' },
      { phone: '9000000102', type: 'credit', amount: 340, date: '2026-09-27', note: 'groceries' },
      { phone: '9000000102', type: 'credit', amount: 1500, date: '2026-10-02', note: 'groceries' },
      { phone: '9000000102', type: 'payment', amount: 950, date: '2026-10-04', note: 'paid on UPI' },
      { phone: '9000000103', type: 'credit', amount: 1200, date: '2026-09-23', note: 'groceries' },
      { phone: '9000000103', type: 'credit', amount: 420, date: '2026-09-28', note: 'groceries' },
      { phone: '9000000103', type: 'payment', amount: 120, date: '2026-10-07', note: 'paid on UPI' },
      { phone: '9000000103', type: 'credit', amount: 950, date: '2026-10-10', note: 'groceries' },
      { phone: '9000000103', type: 'credit', amount: 780, date: '2026-10-16', note: 'groceries' },
      { phone: '9000000103', type: 'payment', amount: 420, date: '2026-10-19', note: 'paid on UPI' },
      { phone: '9000000104', type: 'credit', amount: 120, date: '2026-09-26', note: 'groceries' },
      { phone: '9000000104', type: 'credit', amount: 1500, date: '2026-09-29', note: 'groceries' },
      { phone: '9000000104', type: 'payment', amount: 780, date: '2026-10-02', note: 'paid on UPI' },
      { phone: '9000000104', type: 'credit', amount: 420, date: '2026-10-05', note: 'groceries' },
      { phone: '9000000105', type: 'credit', amount: 120, date: '2026-09-08', note: 'groceries' },
      { phone: '9000000105', type: 'credit', amount: 340, date: '2026-09-13', note: 'groceries' },
      { phone: '9000000105', type: 'payment', amount: 230, date: '2026-09-15', note: 'paid on UPI' },
      { phone: '9000000106', type: 'credit', amount: 1500, date: '2026-09-26', note: 'groceries' },
      { phone: '9000000106', type: 'credit', amount: 420, date: '2026-10-01', note: 'groceries' },
      { phone: '9000000106', type: 'payment', amount: 180, date: '2026-10-08', note: 'paid on UPI' },
      { phone: '9000000106', type: 'credit', amount: 560, date: '2026-10-14', note: 'groceries' },
      { phone: '9000000106', type: 'credit', amount: 780, date: '2026-10-16', note: 'groceries' },
      { phone: '9000000106', type: 'payment', amount: 250, date: '2026-10-19', note: 'paid on UPI' },
      { phone: '9000000107', type: 'credit', amount: 950, date: '2026-10-08', note: 'groceries' },
      { phone: '9000000107', type: 'credit', amount: 250, date: '2026-10-17', note: 'groceries' },
      { phone: '9000000107', type: 'payment', amount: 950, date: '2026-10-22', note: 'paid on UPI' },
      { phone: '9000000108', type: 'credit', amount: 780, date: '2026-09-17', note: 'groceries' },
      { phone: '9000000108', type: 'credit', amount: 180, date: '2026-09-25', note: 'groceries' },
      { phone: '9000000108', type: 'payment', amount: 780, date: '2026-10-03', note: 'paid on UPI' },
      { phone: '9000000108', type: 'credit', amount: 120, date: '2026-10-08', note: 'groceries' },
    ],
  },
  null,
  2
);
