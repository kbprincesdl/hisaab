import { Language } from '../types/ledger';

export interface Translations {
  appName: string;
  ledgerSubtitle: string;
  totalOutstanding: string;
  customersOwing: string;
  totalCustomers: string;
  addCustomer: string;
  customerName: string;
  customerNamePlaceholder: string;
  phone10Digit: string;
  phonePlaceholder: string;
  saveCustomer: string;
  cancel: string;
  searchPlaceholder: string;
  allCustomers: string;
  overdueList: string;
  exportCsv: string;
  remind: string;
  addEntry: string;
  creditLabel: string;
  paymentLabel: string;
  creditHint: string;
  paymentHint: string;
  amountRs: string;
  dateLabel: string;
  noteLabel: string;
  notePlaceholderCredit: string;
  notePlaceholderPayment: string;
  screenshotLabel: string;
  readingScreenshot: string;
  detectedAmountPrefix: string;
  ocrNoAmount: string;
  saveEntry: string;
  updateEntry: string;
  backToLedger: string;
  balanceDue: string;
  settled: string;
  advancePaid: string;
  entriesHeading: string;
  newestFirst: string;
  noEntriesYet: string;
  noCustomersYet: string;
  noMatchingCustomers: string;
  noOverdueCustomers: string;
  loadSampleShop: string;
  importTitle: string;
  importSubtitle: string;
  importPlaceholder: string;
  importButton: string;
  uploadJsonFile: string;
  shopSettings: string;
  shopNameLabel: string;
  upiIdLabel: string;
  upiIdHint: string;
  saveSettings: string;
  daysSincePayment: (days: number) => string;
  noPaymentsYet: string;
  lastPaidOn: (date: string) => string;
  edit: string;
  delete: string;
  confirmDelete: string;
  removeShot: string;
  viewShot: string;
  close: string;
  clearSearch: string;
  invalidPhone: string;
  duplicatePhone: string;
  invalidName: string;
  invalidAmount: string;
  invalidDate: string;
  importSuccess: (custCount: number, entryCount: number) => string;
  importError: string;
  copyUpiLink: string;
  upiCopied: string;
}

const EN: Translations = {
  appName: 'Hisaab',
  ledgerSubtitle: 'Kirana Credit Ledger',
  totalOutstanding: 'Total Outstanding',
  customersOwing: 'customers with balance',
  totalCustomers: 'customers',
  addCustomer: 'Add Customer',
  customerName: 'Customer Name',
  customerNamePlaceholder: 'e.g. Ramesh Sharma',
  phone10Digit: '10-Digit Phone Number',
  phonePlaceholder: '9876543210',
  saveCustomer: 'Save Customer',
  cancel: 'Cancel',
  searchPlaceholder: 'Search by name or phone...',
  allCustomers: 'All Customers',
  overdueList: 'Overdue',
  exportCsv: 'Export CSV',
  remind: 'Remind',
  addEntry: 'Add Entry',
  creditLabel: 'Credit',
  paymentLabel: 'Payment',
  creditHint: 'Shop gave goods',
  paymentHint: 'Customer paid',
  amountRs: 'Amount (Rs)',
  dateLabel: 'Date',
  noteLabel: 'Note',
  notePlaceholderCredit: 'e.g. groceries, atta, oil',
  notePlaceholderPayment: 'e.g. paid on UPI, cash',
  screenshotLabel: 'Payment Screenshot (optional)',
  readingScreenshot: 'Reading amount from screenshot...',
  detectedAmountPrefix: 'Detected amount from screenshot:',
  ocrNoAmount: 'Could not read amount automatically — enter manually.',
  saveEntry: 'Save Entry',
  updateEntry: 'Update Entry',
  backToLedger: 'Back to Ledger',
  balanceDue: 'Balance Due',
  settled: 'Settled',
  advancePaid: 'Advance',
  entriesHeading: 'Ledger Entries',
  newestFirst: 'Newest first',
  noEntriesYet: 'No entries recorded for this customer yet.',
  noCustomersYet: 'Your ledger is empty. Add a customer or load the sample shop below.',
  noMatchingCustomers: 'No customers match your search.',
  noOverdueCustomers: 'All customers are settled — no overdue balances.',
  loadSampleShop: 'Load Sample Shop',
  importTitle: 'Import Shop JSON',
  importSubtitle: 'Paste shop JSON data or upload a .json file to replace the current ledger.',
  importPlaceholder: '{"shop": "...", "customers": [...], "entries": [...]}',
  importButton: 'Import JSON',
  uploadJsonFile: 'Choose .json file',
  shopSettings: 'Shop & UPI Details',
  shopNameLabel: 'Shop Name',
  upiIdLabel: 'Shop UPI ID (for payment links)',
  upiIdHint: 'Included in WhatsApp reminders as upi://pay?pa=...',
  saveSettings: 'Save',
  daysSincePayment: (days) => `${days}d since last payment`,
  noPaymentsYet: 'No payment yet',
  lastPaidOn: (date) => `Last paid ${date}`,
  edit: 'Edit',
  delete: 'Delete',
  confirmDelete: 'Delete?',
  removeShot: 'Remove image',
  viewShot: 'View receipt',
  close: 'Close',
  clearSearch: 'Clear',
  invalidPhone: 'Enter a valid 10-digit mobile number.',
  duplicatePhone: 'A customer with this phone number already exists.',
  invalidName: 'Please enter the customer name.',
  invalidAmount: 'Enter a valid amount greater than 0.',
  invalidDate: 'Select a valid date.',
  importSuccess: (custCount, entryCount) => `Loaded ${custCount} customers and ${entryCount} entries.`,
  importError: 'Invalid JSON format. Expected customers array and entries array.',
  copyUpiLink: 'Copy UPI Link',
  upiCopied: 'Copied',
};

const HI: Translations = {
  appName: 'हिसाब',
  ledgerSubtitle: 'किराना उधार खाता',
  totalOutstanding: 'कुल बकाया राशि',
  customersOwing: 'ग्राहकों पर बकाया',
  totalCustomers: 'ग्राहक',
  addCustomer: 'ग्राहक जोड़ें',
  customerName: 'ग्राहक का नाम',
  customerNamePlaceholder: 'जैसे रमेश शर्मा',
  phone10Digit: '10 अंकों का फ़ोन नंबर',
  phonePlaceholder: '9876543210',
  saveCustomer: 'ग्राहक सहेजें',
  cancel: 'रद्द करें',
  searchPlaceholder: 'नाम या फ़ोन से खोजें...',
  allCustomers: 'सभी ग्राहक',
  overdueList: 'बकाया सूची',
  exportCsv: 'CSV डाउनलोड',
  remind: 'रिमाइंडर',
  addEntry: 'एंट्री जोड़ें',
  creditLabel: 'उधार',
  paymentLabel: 'जमा',
  creditHint: 'सामान दिया',
  paymentHint: 'पैसा मिला',
  amountRs: 'राशि (रु)',
  dateLabel: 'तारीख',
  noteLabel: 'विवरण',
  notePlaceholderCredit: 'जैसे राशन, आटा, तेल',
  notePlaceholderPayment: 'जैसे UPI से जमा, नकद',
  screenshotLabel: 'पेमेंट स्क्रीनशॉट (वैकल्पिक)',
  readingScreenshot: 'स्क्रीनशॉट से राशि पढ़ी जा रही है...',
  detectedAmountPrefix: 'स्क्रीनशॉट से मिली राशि:',
  ocrNoAmount: 'राशि अपने आप नहीं पढ़ी जा सकी — कृपया खुद दर्ज करें।',
  saveEntry: 'एंट्री सहेजें',
  updateEntry: 'एंट्री अपडेट करें',
  backToLedger: 'खाते पर वापस',
  balanceDue: 'बकाया',
  settled: 'चुकाया',
  advancePaid: 'अग्रिम',
  entriesHeading: 'लेन-देन विवरण',
  newestFirst: 'नया सबसे ऊपर',
  noEntriesYet: 'इस ग्राहक के लिए अभी कोई एंट्री नहीं है।',
  noCustomersYet: 'खाता खाली है। नया ग्राहक जोड़ें या नीचे सैंपल दुकान लोड करें।',
  noMatchingCustomers: 'खोज से मिलता कोई ग्राहक नहीं मिला।',
  noOverdueCustomers: 'कोई बकाया ग्राहक नहीं है।',
  loadSampleShop: 'सैंपल दुकान लोड करें',
  importTitle: 'JSON डेटा इम्पोर्ट करें',
  importSubtitle: 'नया खाता लोड करने के लिए JSON पेस्ट करें या .json फ़ाइल चुनें।',
  importPlaceholder: '{"shop": "...", "customers": [...], "entries": [...]}',
  importButton: 'इम्पोर्ट करें',
  uploadJsonFile: '.json फ़ाइल चुनें',
  shopSettings: 'दुकान और UPI जानकारी',
  shopNameLabel: 'दुकान का नाम',
  upiIdLabel: 'दुकान की UPI ID',
  upiIdHint: 'WhatsApp रिमाइंडर में upi://pay?pa=... लिंक जोड़ा जाएगा',
  saveSettings: 'सहेजें',
  daysSincePayment: (days) => `अंतिम भुगतान को ${days} दिन`,
  noPaymentsYet: 'अभी तक कोई जमा नहीं',
  lastPaidOn: (date) => `अंतिम जमा ${date}`,
  edit: 'बदलें',
  delete: 'हटाएं',
  confirmDelete: 'हटाएं?',
  removeShot: 'फोटो हटाएं',
  viewShot: 'रसीद देखें',
  close: 'बंद करें',
  clearSearch: 'साफ़ करें',
  invalidPhone: 'सही 10 अंकों का मोबाइल नंबर दर्ज करें।',
  duplicatePhone: 'इस नंबर का ग्राहक पहले से मौजूद है।',
  invalidName: 'कृपया ग्राहक का नाम दर्ज करें।',
  invalidAmount: '0 से बड़ी सही राशि दर्ज करें।',
  invalidDate: 'सही तारीख चुनें।',
  importSuccess: (custCount, entryCount) => `${custCount} ग्राहक और ${entryCount} एंट्री लोड हो गईं।`,
  importError: 'गलत JSON फ़ॉर्मेट। customers और entries ज़रूरी हैं।',
  copyUpiLink: 'UPI लिंक कॉपी',
  upiCopied: 'कॉपी हुआ',
};

export function getTranslations(lang: Language): Translations {
  return lang === 'hi' ? HI : EN;
}
