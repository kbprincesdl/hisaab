export type EntryType = 'credit' | 'payment';

export type Language = 'en' | 'hi';

export type PaymentMethod = 'cash' | 'upi' | 'other';

export interface Customer {
  name: string;
  phone: string;
  notes?: string;
  creditLimit?: number;
  language?: Language;
  createdAt?: number;
}

export interface LedgerEntry {
  id: string;
  phone: string;
  type: EntryType;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
  shot?: string; // Compressed image data URL, kept local
  method?: PaymentMethod;
  createdAt?: number;
  updatedAt?: number;
}

export interface Reminder {
  id: string;
  phone: string;
  sentAt: number; // epoch ms
  channel: 'whatsapp';
  lang: Language;
}

export interface ShopData {
  shop: string;
  upiId: string;
  creditDays: number;
  customers: Customer[];
  entries: LedgerEntry[];
  reminders: Reminder[];
}

export interface AgingBuckets {
  current: number;
  days1to15: number;
  days16to30: number;
  days31to60: number;
  days60plus: number;
}

export interface CustomerSummary {
  customer: Customer;
  balance: number; // totalCredit - totalPayment
  totalCredit: number;
  totalPayment: number;
  lastPaymentDate: string | null;
  earliestCreditDate: string | null;
  daysSinceLastPayment: number | null;
  entryCount: number;
  overdueAmount: number;
  dueSoonAmount: number;
  oldestDueDate: string | null;
  daysOverdue: number;
  aging: AgingBuckets;
  lastRemindedAt: number | null;
}

export interface ImportIssue {
  row: number;
  field: string;
  message: string;
}

export type ImportParseResult =
  | { ok: true; data: ShopData; warnings: string[] }
  | { ok: false; errors: ImportIssue[] };

export interface BackupRecord {
  id: string;
  savedAt: number;
  reason: string;
  data: ShopData;
}

export interface BackupFile {
  format: 'hisaab-backup';
  version: 1;
  exportedAt: string;
  data: ShopData;
}
