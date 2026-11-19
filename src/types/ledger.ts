export type EntryType = 'credit' | 'payment';

export type Language = 'en' | 'hi';

export interface Customer {
  name: string;
  phone: string;
}

export interface LedgerEntry {
  id: string;
  phone: string;
  type: EntryType;
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
  shot?: string; // Data URL for payment screenshot
  createdAt?: number;
}

export interface ShopData {
  shop: string;
  upiId: string;
  customers: Customer[];
  entries: LedgerEntry[];
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
}
