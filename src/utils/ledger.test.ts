import { describe, expect, it } from 'vitest';
import { Customer, LedgerEntry, ShopData } from '../types/ledger';
import {
  addDaysIso,
  computeCustomerSummaries,
  computeTotalOutstanding,
  createDefaultShopData,
  daysBetweenIsoDates,
  formatRupees,
  generateCsv,
  mergeShopData,
  normalizeStoredData,
  parseImportJsonStrict,
} from './ledger';

const CUSTOMER: Customer = { name: 'Ravi Kumar', phone: '9000000101' };

function entry(
  id: string,
  type: 'credit' | 'payment',
  amount: number,
  date: string,
  createdAt = 0
): LedgerEntry {
  return {
    id,
    phone: CUSTOMER.phone,
    type,
    amount,
    date,
    note: '',
    createdAt,
  };
}

function shop(entries: LedgerEntry[], creditDays = 30): ShopData {
  return {
    ...createDefaultShopData(),
    customers: [CUSTOMER],
    entries,
    creditDays,
  };
}

describe('dates', () => {
  it('adds days across month boundaries', () => {
    expect(addDaysIso('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('counts whole days between dates', () => {
    expect(daysBetweenIsoDates('2026-10-01', '2026-10-31')).toBe(30);
    expect(daysBetweenIsoDates('2026-10-31', '2026-10-01')).toBe(0);
  });
});

describe('money and dates', () => {
  it('formats Indian grouping and the rupee symbol', () => {
    expect(formatRupees(11820)).toBe('₹11,820');
    expect(formatRupees(118200)).toBe('₹1,18,200');
    expect(formatRupees(-670.5)).toBe('-₹670.5');
  });
});

describe('customer summaries and real overdue aging', () => {
  it('computes balance from credits and payments', () => {
    const summaries = computeCustomerSummaries(
      [CUSTOMER],
      [
        entry('a', 'credit', 1000, '2026-10-01'),
        entry('b', 'payment', 300, '2026-10-10'),
        entry('c', 'credit', 200, '2026-10-20'),
      ],
      '2026-10-25'
    );
    expect(summaries[0].balance).toBe(900);
    expect(summaries[0].totalCredit).toBe(1200);
    expect(summaries[0].totalPayment).toBe(300);
    expect(summaries[0].lastPaymentDate).toBe('2026-10-10');
  });

  it('does not call a balance overdue before its credit period ends', () => {
    const summaries = computeCustomerSummaries(
      [CUSTOMER],
      [entry('a', 'credit', 500, '2026-11-10')],
      '2026-11-21',
      30
    );
    expect(summaries[0].balance).toBe(500);
    expect(summaries[0].overdueAmount).toBe(0);
    expect(summaries[0].daysOverdue).toBe(0);
    expect(summaries[0].oldestDueDate).toBe('2026-12-10');
  });

  it('allocates payments to the oldest credits and ages the remainder', () => {
    const summaries = computeCustomerSummaries(
      [CUSTOMER],
      [
        entry('credit-old', 'credit', 100, '2026-10-01', 1),
        entry('pay-old', 'payment', 40, '2026-10-15', 2),
        entry('credit-new', 'credit', 50, '2026-11-25', 3),
      ],
      '2026-12-01',
      30
    );
    // 60 of the Oct credit is 31 days past its 31 Oct due date.
    expect(summaries[0].balance).toBe(110);
    expect(summaries[0].overdueAmount).toBe(60);
    expect(summaries[0].daysOverdue).toBe(31);
    expect(summaries[0].aging.days31to60).toBe(60);
    expect(summaries[0].aging.current).toBe(50);
    expect(summaries[0].oldestDueDate).toBe('2026-10-31');
  });

  it('marks a credit due within seven days as due soon, not overdue', () => {
    const summaries = computeCustomerSummaries(
      [CUSTOMER],
      [entry('credit', 'credit', 50, '2026-11-25')],
      '2026-12-20',
      30
    );
    expect(summaries[0].dueSoonAmount).toBe(50);
    expect(summaries[0].overdueAmount).toBe(0);
    expect(summaries[0].aging.current).toBe(50);
  });

  it('treats an advance as negative balance with no overdue', () => {
    const summaries = computeCustomerSummaries(
      [CUSTOMER],
      [
        entry('pay', 'payment', 100, '2026-10-01'),
        entry('credit', 'credit', 60, '2026-10-05'),
      ],
      '2026-12-01',
      30
    );
    expect(summaries[0].balance).toBe(-40);
    expect(summaries[0].overdueAmount).toBe(0);
  });

  it('uses an earlier advance to reduce a later credit', () => {
    const summaries = computeCustomerSummaries(
      [CUSTOMER],
      [
        entry('pay', 'payment', 100, '2026-10-01'),
        entry('credit-a', 'credit', 60, '2026-10-05'),
        entry('credit-b', 'credit', 50, '2026-11-01'),
      ],
      '2026-11-21',
      30
    );
    expect(summaries[0].balance).toBe(10);
    expect(summaries[0].overdueAmount).toBe(0);
    expect(summaries[0].aging.current).toBe(10);
  });

  it('ignores advances in total outstanding', () => {
    const summaries = computeCustomerSummaries(
      [CUSTOMER],
      [entry('pay', 'payment', 100, '2026-10-01')],
      '2026-11-21'
    );
    expect(computeTotalOutstanding(summaries)).toBe(0);
  });

  it('records the last reminder time', () => {
    const summaries = computeCustomerSummaries(
      [CUSTOMER],
      [],
      '2026-11-21',
      30,
      [
        { id: 'r1', phone: CUSTOMER.phone, sentAt: 100, channel: 'whatsapp', lang: 'en' },
        { id: 'r2', phone: CUSTOMER.phone, sentAt: 200, channel: 'whatsapp', lang: 'hi' },
      ]
    );
    expect(summaries[0].lastRemindedAt).toBe(200);
  });
});

describe('strict import', () => {
  it('accepts a valid shop', () => {
    const raw = JSON.stringify(shop([entry('a', 'credit', 500, '2026-10-01')]));
    const result = parseImportJsonStrict(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.customers).toHaveLength(1);
      expect(result.data.entries).toHaveLength(1);
      expect(result.data.creditDays).toBe(30);
    }
  });

  it('rejects the whole file when one entry references an unknown customer', () => {
    const raw = JSON.stringify({
      shop: 'Test',
      customers: [CUSTOMER],
      entries: [
        { ...entry('a', 'credit', 500, '2026-10-01'), phone: '9000000999' },
      ],
    });
    const result = parseImportJsonStrict(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'phone')).toBe(true);
      expect(result).not.toHaveProperty('data');
    }
  });

  it('rejects duplicate phones, bad amounts and bad dates', () => {
    const raw = JSON.stringify({
      shop: 'Test',
      customers: [CUSTOMER, { ...CUSTOMER }],
      entries: [
        entry('a', 'credit', 0, '2026-02-30'),
        entry('b', 'payment', 100, '2026-10-01'),
      ],
    });
    const result = parseImportJsonStrict(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'phone')).toBe(true);
      expect(result.errors.some((e) => e.field === 'amount')).toBe(true);
      expect(result.errors.some((e) => e.field === 'date')).toBe(true);
    }
  });

  it('normalizes an old sample shop name during import', () => {
    const raw = JSON.stringify({
      shop: 'Lakshmi Provision Store (fictional)',
      customers: [CUSTOMER],
      entries: [],
    });
    const result = parseImportJsonStrict(raw);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.shop).toBe('Lakshmi Provision Store');
  });

  it('accepts the backup file envelope', () => {
    const raw = JSON.stringify({
      format: 'hisaab-backup',
      version: 1,
      exportedAt: '2026-11-21T00:00:00.000Z',
      data: shop([entry('a', 'payment', 100, '2026-10-01')]),
    });
    const result = parseImportJsonStrict(raw);
    expect(result.ok).toBe(true);
  });

  it('rejects a file with an invalid credit period', () => {
    const raw = JSON.stringify({
      shop: 'Test',
      creditDays: 999,
      customers: [CUSTOMER],
      entries: [],
    });
    const result = parseImportJsonStrict(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].field).toBe('creditDays');
    }
  });
});

describe('stored data repair', () => {
  it('keeps a money entry even when its customer row is missing', () => {
    const data = normalizeStoredData({
      shop: 'Test Store',
      customers: [],
      entries: [entry('a', 'credit', 500, '2026-10-01')],
    });
    expect(data.customers).toHaveLength(1);
    expect(data.customers[0].phone).toBe(CUSTOMER.phone);
    expect(data.entries).toHaveLength(1);
  });

  it('defaults missing settings without losing records', () => {
    const data = normalizeStoredData({
      customers: [CUSTOMER],
      entries: [],
    });
    expect(data.creditDays).toBe(30);
    expect(data.shop).toBe('Lakshmi Provision Store');
    expect(data.customers).toHaveLength(1);
  });

  it('upgrades the old sample and default shop names', () => {
    const oldSample = normalizeStoredData({
      shop: 'Lakshmi Provision Store (fictional)',
      customers: [CUSTOMER],
      entries: [],
    });
    expect(oldSample.shop).toBe('Lakshmi Provision Store');

    const oldDefault = normalizeStoredData({
      shop: 'My Kirana Store',
      customers: [CUSTOMER],
      entries: [],
    });
    expect(oldDefault.shop).toBe('Lakshmi Provision Store');
  });
});

describe('merge', () => {
  it('unions customers, entries and reminders', () => {
    const local = shop([entry('a', 'credit', 100, '2026-10-01')]);
    const remote = shop([entry('b', 'payment', 40, '2026-10-02')]);
    remote.reminders = [
      { id: 'r1', phone: CUSTOMER.phone, sentAt: 1, channel: 'whatsapp', lang: 'en' },
    ];
    const merged = mergeShopData(local, remote);
    expect(merged.entries).toHaveLength(2);
    expect(merged.reminders).toHaveLength(1);
    expect(merged.customers).toHaveLength(1);
  });
});

describe('CSV', () => {
  it('starts with a BOM and includes a balance for every entry', () => {
    const data = shop([entry('a', 'credit', 100, '2026-10-01')]);
    const summaries = computeCustomerSummaries(data.customers, data.entries, '2026-11-21');
    const csv = generateCsv(data, summaries);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Customer Name,Phone,Type,Amount');
    expect(csv).toContain('Ravi Kumar,9000000101,credit,100,2026-10-01');
    expect(csv).toContain(',100,');
  });
});
