export type AppView = 'ledger' | 'reports';

export type LedgerTab = 'all' | 'overdue' | 'dueSoon';

export type QuickEntryState = {
  phone?: string;
  type: 'payment' | 'credit';
} | null;
