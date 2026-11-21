import { Language } from '../types/ledger';

export interface Translations {
  appName: string;
  ledgerSubtitle: string;
  navLedger: string;
  navReports: string;
  navSettings: string;

  totalOutstanding: string;
  customersOwing: string;
  totalCustomers: string;
  customersHeading: string;
  overdueAmount: string;
  dueSoonAmount: string;
  totalOverdue: string;
  collectPayment: string;
  viewOverdue: string;
  todayLabel: string;

  addCustomer: string;
  customerName: string;
  customerNamePlaceholder: string;
  phone10Digit: string;
  phonePlaceholder: string;
  saveCustomer: string;
  cancel: string;
  close: string;
  save: string;
  done: string;
  edit: string;
  delete: string;
  confirmDelete: string;
  clearSearch: string;

  searchPlaceholder: string;
  allCustomers: string;
  overdueList: string;
  dueSoon: string;
  exportCsv: string;
  noCustomersYet: string;
  noMatchingCustomers: string;
  noOverdueCustomers: string;
  noDueSoonCustomers: string;
  addFirstCustomer: string;
  sortBy: string;
  sortName: string;
  sortBalance: string;
  sortOverdue: string;

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
  removeShot: string;
  viewShot: string;
  receiptLabel: string;
  method: string;
  cashMethod: string;
  upiMethod: string;
  otherMethod: string;

  backToLedger: string;
  balanceDue: string;
  settled: string;
  advancePaid: string;
  entriesHeading: string;
  newestFirst: string;
  noEntriesYet: string;
  collect: string;
  addCredit: string;
  viewLedger: string;
  editCustomer: string;
  saveChanges: string;
  phoneCannotChange: string;
  notesLabel: string;
  creditLimitLabel: string;
  reminderLanguage: string;
  noNotes: string;
  overdueBy: (days: number) => string;
  dueIn: (days: number) => string;
  dueToday: string;
  dueTomorrow: string;
  lastReminded: (value: string) => string;
  neverReminded: string;
  totalCreditLabel: string;
  totalPaidLabel: string;
  overdueLabel: string;
  dueOn: (date: string) => string;
  noDueDate: string;
  upiLink: string;

  daysSincePayment: (days: number) => string;
  noPaymentsYet: string;
  lastPaidOn: (date: string) => string;

  loadSampleShop: string;
  importTitle: string;
  importSubtitle: string;
  importPlaceholder: string;
  importButton: string;
  uploadJsonFile: string;
  pasteJsonLabel: string;
  validateFile: string;
  importPreview: string;
  importErrors: string;
  importWarnings: string;
  replaceLedger: string;
  replaceWarning: string;
  confirmReplace: string;
  customerCount: (count: number) => string;
  entryCount: (count: number) => string;
  totalOutstandingShort: string;
  importValid: string;
  importInvalid: string;
  rowNumber: (row: number) => string;
  backupCreated: string;

  shopSettings: string;
  shopNameLabel: string;
  upiIdLabel: string;
  upiIdHint: string;
  saveSettings: string;
  creditPeriod: string;
  creditPeriodHint: string;
  daysUnit: string;

  settingsTitle: string;
  accountSection: string;
  backupSection: string;
  localBackups: string;
  deletedLabel: string;
  moreActions: string;
  storageSection: string;
  demoSection: string;
  cloudConnected: string;
  localOnly: string;
  signedInAs: (email: string) => string;
  signIn: string;
  signOut: string;
  syncNow: string;
  lastSavedAt: (value: string) => string;
  notBackedUp: string;
  backUpToCloud: string;
  cloudNotConfiguredHint: string;
  cloudSetupTitle: string;
  cloudSetupBody: string;
  cloudSetupShort: string;
  openSqlEditor: string;
  copySetupSql: string;
  setupSqlCopied: string;
  exportBackup: string;
  importRestore: string;
  backupNow: string;
  lastBackup: (value: string) => string;
  noBackups: string;
  restore: string;
  restoreConfirm: string;
  storageUsed: (used: string, quota: string) => string;
  persistentStorage: string;
  persistentOn: string;
  persistentOff: string;
  requestPersistent: string;
  loadSampleHint: string;
  clearSearchLabel: string;

  loadingLedger: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  sendLink: string;
  sendingLink: string;
  checkEmail: string;
  checkEmailBody: (email: string) => string;
  resend: string;
  useOffline: string;
  offlineNote: string;
  cloudNotConfigured: string;
  privacyNote: string;
  back: string;
  featureCloud: string;
  featureBackup: string;
  featurePrivate: string;
  featureHindi: string;

  syncStatusSaved: string;
  syncStatusSaving: string;
  syncStatusOffline: string;
  syncStatusError: string;
  syncStatusIdle: string;
  syncConflict: string;
  reminderOpened: string;

  reportsTitle: string;
  reportsSubtitle: string;
  thisMonth: string;
  creditGiven: string;
  collected: string;
  netChange: string;
  aging: string;
  agingCurrent: string;
  aging1to15: string;
  aging16to30: string;
  aging31to60: string;
  aging60plus: string;
  topDebtors: string;
  last6Months: string;
  noData: string;
  cashVsUpi: string;
  overdueCustomers: string;
  dueSoonCustomers: string;

  invalidPhone: string;
  duplicatePhone: string;
  invalidName: string;
  invalidAmount: string;
  invalidDate: string;
  invalidShopName: string;
  invalidUpi: string;
  invalidCreditDays: string;
  invalidEmail: string;
  importSuccess: (custCount: number, entryCount: number) => string;
  importError: string;
  copyUpiLink: string;
  upiCopied: string;
  chooseCustomerError: string;
  noCustomersForEntry: string;
  fullBalance: string;
  receivePayment: string;
  giveCredit: string;
  chooseCustomer: string;
  savePayment: string;
  saveCredit: string;
  paymentSaved: string;
  creditSaved: string;
  entryUpdated: string;
  customerSaved: string;
  signedOut: string;
}

const EN: Translations = {
  appName: 'Hisaab',
  ledgerSubtitle: 'Kirana Credit Ledger',
  navLedger: 'Ledger',
  navReports: 'Reports',
  navSettings: 'Settings',

  totalOutstanding: 'Total outstanding',
  customersOwing: 'customers with balance',
  totalCustomers: 'customers',
  customersHeading: 'Customers',
  overdueAmount: 'Overdue',
  dueSoonAmount: 'Due in 7 days',
  totalOverdue: 'Total overdue',
  collectPayment: 'Collect payment',
  viewOverdue: 'View overdue',
  todayLabel: 'Today',

  addCustomer: 'Add customer',
  customerName: 'Customer name',
  customerNamePlaceholder: 'e.g. Ramesh Sharma',
  phone10Digit: '10-digit phone number',
  phonePlaceholder: '9876543210',
  saveCustomer: 'Save customer',
  cancel: 'Cancel',
  close: 'Close',
  save: 'Save',
  done: 'Done',
  edit: 'Edit',
  delete: 'Delete',
  confirmDelete: 'Delete?',
  clearSearch: 'Clear',

  searchPlaceholder: 'Search by name or phone...',
  allCustomers: 'All',
  overdueList: 'Overdue',
  dueSoon: 'Due soon',
  exportCsv: 'Export CSV',
  noCustomersYet: 'Your ledger is empty. Add your first customer or load the sample shop.',
  noMatchingCustomers: 'No customers match your search.',
  noOverdueCustomers: 'Nothing is overdue. Every credit is still inside its credit period.',
  noDueSoonCustomers: 'Nothing is due in the next seven days.',
  addFirstCustomer: 'Add your first customer',
  sortBy: 'Sort',
  sortName: 'Name',
  sortBalance: 'Balance',
  sortOverdue: 'Days late',

  remind: 'Remind',
  addEntry: 'Add entry',
  creditLabel: 'Credit',
  paymentLabel: 'Payment',
  creditHint: 'Goods given',
  paymentHint: 'Money received',
  amountRs: 'Amount',
  dateLabel: 'Date',
  noteLabel: 'Note',
  notePlaceholderCredit: 'e.g. atta, oil, rice',
  notePlaceholderPayment: 'e.g. UPI, cash',
  screenshotLabel: 'Payment screenshot (optional)',
  readingScreenshot: 'Reading the amount from the screenshot...',
  detectedAmountPrefix: 'Detected amount',
  ocrNoAmount: 'Could not read an amount. Enter it manually.',
  saveEntry: 'Save entry',
  updateEntry: 'Update entry',
  removeShot: 'Remove image',
  viewShot: 'View receipt',
  receiptLabel: 'Receipt',
  method: 'Paid by',
  cashMethod: 'Cash',
  upiMethod: 'UPI',
  otherMethod: 'Other',

  backToLedger: 'Back to ledger',
  balanceDue: 'Balance due',
  settled: 'Settled',
  advancePaid: 'Advance',
  entriesHeading: 'Ledger entries',
  newestFirst: 'Newest first',
  noEntriesYet: 'No entries yet. Add the first credit or payment.',
  collect: 'Collect',
  addCredit: 'Add credit',
  viewLedger: 'View ledger',
  editCustomer: 'Edit customer',
  saveChanges: 'Save changes',
  phoneCannotChange: 'Phone is the customer key and cannot be changed here.',
  notesLabel: 'Notes',
  creditLimitLabel: 'Credit limit (optional)',
  reminderLanguage: 'Reminder language',
  noNotes: 'No notes yet.',
  overdueBy: (days) => `${days}d overdue`,
  dueIn: (days) => `Due in ${days}d`,
  dueToday: 'Due today',
  dueTomorrow: 'Due tomorrow',
  lastReminded: (value) => `Last reminded ${value}`,
  neverReminded: 'Never reminded',
  totalCreditLabel: 'Total credit',
  totalPaidLabel: 'Total paid',
  overdueLabel: 'Overdue',
  dueOn: (date) => `Due ${date}`,
  noDueDate: 'No due date',
  upiLink: 'UPI link',

  daysSincePayment: (days) => `${days}d since last payment`,
  noPaymentsYet: 'No payment yet',
  lastPaidOn: (date) => `Last paid ${date}`,

  loadSampleShop: 'Load sample shop',
  importTitle: 'Import or restore',
  importSubtitle:
    'Paste a Hisaab backup or a shop JSON file. Nothing is replaced until you review it.',
  importPlaceholder: '{"shop": "...", "customers": [...], "entries": [...]}',
  importButton: 'Validate file',
  uploadJsonFile: 'Choose .json file',
  pasteJsonLabel: 'Paste JSON',
  validateFile: 'Validate',
  importPreview: 'Review import',
  importErrors: 'Problems found',
  importWarnings: 'Notes',
  replaceLedger: 'Replace ledger',
  replaceWarning:
    'This replaces the ledger on this phone. A backup of the current ledger is saved first.',
  confirmReplace: 'Yes, replace ledger',
  customerCount: (count) => `${count} customer${count === 1 ? '' : 's'}`,
  entryCount: (count) => `${count} entr${count === 1 ? 'y' : 'ies'}`,
  totalOutstandingShort: 'Outstanding in this file',
  importValid: 'File is valid. Review the counts below.',
  importInvalid: 'Fix these problems before importing.',
  rowNumber: (row) => `Row ${row}`,
  backupCreated: 'Backup saved on this device.',

  shopSettings: 'Shop & UPI',
  shopNameLabel: 'Shop name',
  upiIdLabel: 'Shop UPI ID',
  upiIdHint: 'Used in payment links and WhatsApp reminders.',
  saveSettings: 'Save',
  creditPeriod: 'Credit period',
  creditPeriodHint: 'A credit becomes overdue after this many days.',
  daysUnit: 'days',

  settingsTitle: 'Settings',
  accountSection: 'Account & sync',
  backupSection: 'Backup & restore',
  localBackups: 'Local backups',
  deletedLabel: 'Deleted',
  moreActions: 'More actions',
  storageSection: 'Device storage',
  demoSection: 'Sample data',
  cloudConnected: 'Cloud backup is on',
  localOnly: 'This phone only',
  signedInAs: (email) => `Signed in as ${email}`,
  signIn: 'Sign in to back up',
  signOut: 'Sign out',
  syncNow: 'Sync now',
  lastSavedAt: (value) => `Saved ${value}`,
  notBackedUp: 'Not backed up',
  backUpToCloud: 'Back up to cloud',
  cloudNotConfiguredHint:
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to turn on cloud backup.',
  cloudSetupTitle: 'Cloud tables are not set up yet',
  cloudSetupBody:
    'Run the Supabase setup SQL once, then tap Sync now. Your local ledger is safe and nothing has been lost.',
  cloudSetupShort: 'Cloud setup required',
  openSqlEditor: 'Open Supabase SQL editor',
  copySetupSql: 'Copy setup SQL',
  setupSqlCopied: 'Setup SQL copied',
  exportBackup: 'Export backup',
  importRestore: 'Import or restore',
  backupNow: 'Create a backup now',
  lastBackup: (value) => `Last backup ${value}`,
  noBackups: 'No local backups yet.',
  restore: 'Restore',
  restoreConfirm: 'Replace the current ledger with this backup?',
  storageUsed: (used, quota) => `${used} used${quota ? ` of ${quota}` : ''}`,
  persistentStorage: 'Persistent storage',
  persistentOn: 'On — the browser is less likely to evict this ledger.',
  persistentOff: 'Off — the browser may clear data when space is low.',
  requestPersistent: 'Ask browser to keep data',
  loadSampleHint: 'Loads sample customers and entries. Review before replacing.',
  clearSearchLabel: 'Clear search',

  loadingLedger: 'Opening your ledger...',
  welcomeTitle: 'Your kirana ledger, calm and backed up.',
  welcomeSubtitle:
    'Track credit, see what is really overdue, and send a polite WhatsApp reminder in one tap.',
  emailLabel: 'Email address',
  emailPlaceholder: 'you@example.com',
  sendLink: 'Email me a sign-in link',
  sendingLink: 'Sending link...',
  checkEmail: 'Check your email',
  checkEmailBody: (email) => `We sent a sign-in link to ${email}. Open it on this phone.`,
  resend: 'Send again',
  useOffline: 'Use on this phone only',
  offlineNote: 'No account. Data stays in this browser until you back it up.',
  cloudNotConfigured: 'Cloud backup is not configured for this build.',
  privacyNote:
    'Your shop is private. Row-level security means only your signed-in account can read it.',
  back: 'Back',
  featureCloud: 'Cloud backup and restore',
  featureBackup: 'A real backup before every import',
  featurePrivate: 'Private by default',
  featureHindi: 'English and हिंदी',

  syncStatusSaved: 'Saved',
  syncStatusSaving: 'Saving...',
  syncStatusOffline: 'Offline',
  syncStatusError: 'Sync failed',
  syncStatusIdle: 'On this phone',
  syncConflict: 'Merged — sync again',
  reminderOpened: 'Reminder opened',

  reportsTitle: 'Reports',
  reportsSubtitle: 'Know what came in, what is stuck, and who needs a nudge.',
  thisMonth: 'This month',
  creditGiven: 'Credit given',
  collected: 'Payments received',
  netChange: 'Net change',
  aging: 'Overdue aging',
  agingCurrent: 'Not due',
  aging1to15: '1–15 days',
  aging16to30: '16–30 days',
  aging31to60: '31–60 days',
  aging60plus: '60+ days',
  topDebtors: 'Top balances',
  last6Months: 'Last six months',
  noData: 'No entries yet. Add a credit or payment to see reports.',
  cashVsUpi: 'Cash vs UPI',
  overdueCustomers: 'overdue customers',
  dueSoonCustomers: 'due in 7 days',

  invalidPhone: 'Enter a valid 10-digit mobile number.',
  duplicatePhone: 'A customer with this phone number already exists.',
  invalidName: 'Please enter the customer name.',
  invalidAmount: 'Enter a valid amount greater than 0.',
  invalidDate: 'Select a valid date.',
  invalidShopName: 'Enter the shop name.',
  invalidUpi: 'Enter a UPI ID with no spaces.',
  invalidCreditDays: 'Credit period must be between 1 and 365 days.',
  invalidEmail: 'Enter a valid email address.',
  importSuccess: (custCount, entryCount) =>
    `Loaded ${custCount} customers and ${entryCount} entries.`,
  importError: 'Invalid JSON format. Expected customers and entries arrays.',
  copyUpiLink: 'Copy UPI link',
  upiCopied: 'Copied',
  chooseCustomerError: 'Choose a customer first.',
  noCustomersForEntry: 'Add a customer before recording an entry.',
  fullBalance: 'Full balance',
  receivePayment: 'Receive payment',
  giveCredit: 'Give credit',
  chooseCustomer: 'Choose customer',
  savePayment: 'Save payment',
  saveCredit: 'Save credit',
  paymentSaved: 'Payment recorded',
  creditSaved: 'Credit recorded',
  entryUpdated: 'Entry updated',
  customerSaved: 'Customer saved',
  signedOut: 'Signed out',
};

const HI: Translations = {
  appName: 'हिसाब',
  ledgerSubtitle: 'किराना उधार खाता',
  navLedger: 'खाता',
  navReports: 'रिपोर्ट',
  navSettings: 'सेटिंग',

  totalOutstanding: 'कुल बकाया',
  customersOwing: 'ग्राहकों पर बकाया',
  totalCustomers: 'ग्राहक',
  customersHeading: 'ग्राहक',
  overdueAmount: 'बकाया',
  dueSoonAmount: '7 दिन में देय',
  totalOverdue: 'कुल बकाया',
  collectPayment: 'पैसा मिला',
  viewOverdue: 'बकाया देखें',
  todayLabel: 'आज',

  addCustomer: 'ग्राहक जोड़ें',
  customerName: 'ग्राहक का नाम',
  customerNamePlaceholder: 'जैसे रमेश शर्मा',
  phone10Digit: '10 अंकों का फ़ोन नंबर',
  phonePlaceholder: '9876543210',
  saveCustomer: 'ग्राहक सहेजें',
  cancel: 'रद्द करें',
  close: 'बंद करें',
  save: 'सहेजें',
  done: 'ठीक है',
  edit: 'बदलें',
  delete: 'हटाएं',
  confirmDelete: 'हटाएं?',
  clearSearch: 'साफ़ करें',

  searchPlaceholder: 'नाम या फ़ोन से खोजें...',
  allCustomers: 'सभी',
  overdueList: 'बकाया',
  dueSoon: 'जल्द देय',
  exportCsv: 'CSV डाउनलोड',
  noCustomersYet: 'खाता खाली है। पहला ग्राहक जोड़ें या सैंपल दुकान लोड करें।',
  noMatchingCustomers: 'खोज से मिलता कोई ग्राहक नहीं मिला।',
  noOverdueCustomers: 'कोई बकाया नहीं है। हर उधार अपनी अवधि के अंदर है।',
  noDueSoonCustomers: 'अगले सात दिनों में कुछ देय नहीं है।',
  addFirstCustomer: 'पहला ग्राहक जोड़ें',
  sortBy: 'क्रम',
  sortName: 'नाम',
  sortBalance: 'बकाया',
  sortOverdue: 'दिन',

  remind: 'रिमाइंडर',
  addEntry: 'एंट्री जोड़ें',
  creditLabel: 'उधार',
  paymentLabel: 'जमा',
  creditHint: 'सामान दिया',
  paymentHint: 'पैसा मिला',
  amountRs: 'राशि',
  dateLabel: 'तारीख',
  noteLabel: 'विवरण',
  notePlaceholderCredit: 'जैसे राशन, आटा, तेल',
  notePlaceholderPayment: 'जैसे UPI, नकद',
  screenshotLabel: 'पेमेंट स्क्रीनशॉट (वैकल्पिक)',
  readingScreenshot: 'स्क्रीनशॉट से राशि पढ़ी जा रही है...',
  detectedAmountPrefix: 'मिली राशि',
  ocrNoAmount: 'राशि अपने आप नहीं पढ़ी जा सकी — कृपया खुद दर्ज करें।',
  saveEntry: 'एंट्री सहेजें',
  updateEntry: 'एंट्री अपडेट करें',
  removeShot: 'फोटो हटाएं',
  viewShot: 'रसीद देखें',
  receiptLabel: 'रसीद',
  method: 'भुगतान',
  cashMethod: 'नकद',
  upiMethod: 'UPI',
  otherMethod: 'अन्य',

  backToLedger: 'खाते पर वापस',
  balanceDue: 'बकाया',
  settled: 'चुकाया',
  advancePaid: 'अग्रिम',
  entriesHeading: 'लेन-देन',
  newestFirst: 'नया सबसे ऊपर',
  noEntriesYet: 'अभी कोई एंट्री नहीं है। पहला उधार या जमा जोड़ें।',
  collect: 'जमा',
  addCredit: 'उधार दें',
  viewLedger: 'खाता देखें',
  editCustomer: 'ग्राहक बदलें',
  saveChanges: 'बदलाव सहेजें',
  phoneCannotChange: 'फ़ोन ग्राहक की पहचान है; इसे यहां नहीं बदला जा सकता।',
  notesLabel: 'टिप्पणी',
  creditLimitLabel: 'उधार सीमा (वैकल्पिक)',
  reminderLanguage: 'रिमाइंडर भाषा',
  noNotes: 'अभी कोई टिप्पणी नहीं।',
  overdueBy: (days) => `${days} दिन बकाया`,
  dueIn: (days) => `${days} दिन में देय`,
  dueToday: 'आज देय',
  dueTomorrow: 'कल देय',
  lastReminded: (value) => `पिछला रिमाइंडर ${value}`,
  neverReminded: 'अभी रिमाइंडर नहीं भेजा',
  totalCreditLabel: 'कुल उधार',
  totalPaidLabel: 'कुल जमा',
  overdueLabel: 'बकाया',
  dueOn: (date) => `देय ${date}`,
  noDueDate: 'कोई देय तारीख नहीं',
  upiLink: 'UPI लिंक',

  daysSincePayment: (days) => `अंतिम भुगतान को ${days} दिन`,
  noPaymentsYet: 'अभी तक कोई जमा नहीं',
  lastPaidOn: (date) => `अंतिम जमा ${date}`,

  loadSampleShop: 'सैंपल दुकान लोड करें',
  importTitle: 'इम्पोर्ट या रिस्टोर',
  importSubtitle:
    'हिसाब बैकअप या दुकान की JSON फ़ाइल चुनें। समीक्षा से पहले कुछ नहीं बदलेगा।',
  importPlaceholder: '{"shop": "...", "customers": [...], "entries": [...]}',
  importButton: 'फ़ाइल जांचें',
  uploadJsonFile: '.json फ़ाइल चुनें',
  pasteJsonLabel: 'JSON पेस्ट करें',
  validateFile: 'जांचें',
  importPreview: 'इम्पोर्ट की समीक्षा',
  importErrors: 'समस्याएं',
  importWarnings: 'ध्यान दें',
  replaceLedger: 'खाता बदलें',
  replaceWarning:
    'यह इस फ़ोन का खाता बदल देगा। पहले मौजूदा खाते का बैकअप सेव होगा।',
  confirmReplace: 'हां, खाता बदलें',
  customerCount: (count) => `${count} ग्राहक`,
  entryCount: (count) => `${count} एंट्री`,
  totalOutstandingShort: 'इस फ़ाइल में बकाया',
  importValid: 'फ़ाइल सही है। नीचे की गिनती देखें।',
  importInvalid: 'इम्पोर्ट से पहले ये समस्याएं ठीक करें।',
  rowNumber: (row) => `पंक्ति ${row}`,
  backupCreated: 'बैकअप इस फ़ोन पर सेव हो गया।',

  shopSettings: 'दुकान और UPI',
  shopNameLabel: 'दुकान का नाम',
  upiIdLabel: 'दुकान की UPI ID',
  upiIdHint: 'पेमेंट लिंक और WhatsApp रिमाइंडर में इस्तेमाल होती है।',
  saveSettings: 'सहेजें',
  creditPeriod: 'उधार अवधि',
  creditPeriodHint: 'इतने दिनों के बाद उधार बकाया माना जाएगा।',
  daysUnit: 'दिन',

  settingsTitle: 'सेटिंग',
  accountSection: 'खाता और सिंक',
  backupSection: 'बैकअप और रिस्टोर',
  localBackups: 'लोकल बैकअप',
  deletedLabel: 'हटाया',
  moreActions: 'और विकल्प',
  storageSection: 'डिवाइस स्टोरेज',
  demoSection: 'सैंपल डेटा',
  cloudConnected: 'क्लाउड बैकअप चालू है',
  localOnly: 'सिर्फ़ इस फ़ोन पर',
  signedInAs: (email) => `${email} से साइन इन`,
  signIn: 'बैकअप के लिए साइन इन करें',
  signOut: 'साइन आउट',
  syncNow: 'अभी सिंक करें',
  lastSavedAt: (value) => `${value} सेव हुआ`,
  notBackedUp: 'बैकअप नहीं है',
  backUpToCloud: 'क्लाउड में बैकअप',
  cloudNotConfiguredHint:
    'क्लाउड बैकअप के लिए VITE_SUPABASE_URL और VITE_SUPABASE_ANON_KEY जोड़ें।',
  cloudSetupTitle: 'क्लाउड टेबल अभी सेट नहीं हैं',
  cloudSetupBody:
    'Supabase सेटअप SQL एक बार चलाएं, फिर Sync now दबाएं। आपका लोकल खाता सुरक्षित है।',
  cloudSetupShort: 'क्लाउड सेटअप ज़रूरी',
  openSqlEditor: 'Supabase SQL एडिटर खोलें',
  copySetupSql: 'सेटअप SQL कॉपी करें',
  setupSqlCopied: 'सेटअप SQL कॉपी हुआ',
  exportBackup: 'बैकअप डाउनलोड',
  importRestore: 'इम्पोर्ट या रिस्टोर',
  backupNow: 'अभी बैकअप बनाएं',
  lastBackup: (value) => `पिछला बैकअप ${value}`,
  noBackups: 'अभी कोई लोकल बैकअप नहीं है।',
  restore: 'रिस्टोर',
  restoreConfirm: 'मौजूदा खाते को इस बैकअप से बदलें?',
  storageUsed: (used, quota) => `${used} इस्तेमाल${quota ? ` / ${quota}` : ''}`,
  persistentStorage: 'स्थायी स्टोरेज',
  persistentOn: 'चालू — ब्राउज़र इस खाते को कम हटाएगा।',
  persistentOff: 'बंद — जगह कम होने पर ब्राउज़र डेटा हटा सकता है।',
  requestPersistent: 'ब्राउज़र से डेटा रखने को कहें',
  loadSampleHint: 'सैंपल ग्राहक और एंट्री लोड होंगी। बदलने से पहले देखें।',
  clearSearchLabel: 'खोज साफ़ करें',

  loadingLedger: 'खाता खुल रहा है...',
  welcomeTitle: 'आपका किराना खाता, शांत और सुरक्षित।',
  welcomeSubtitle:
    'उधार लिखें, सच में बकाया देखें, और एक टैप में WhatsApp रिमाइंडर भेजें।',
  emailLabel: 'ईमेल पता',
  emailPlaceholder: 'you@example.com',
  sendLink: 'साइन-इन लिंक भेजें',
  sendingLink: 'लिंक भेजा जा रहा है...',
  checkEmail: 'ईमेल देखें',
  checkEmailBody: (email) => `${email} पर साइन-इन लिंक भेजा गया है। इसे इस फ़ोन पर खोलें।`,
  resend: 'फिर भेजें',
  useOffline: 'सिर्फ़ इस फ़ोन पर इस्तेमाल करें',
  offlineNote: 'कोई खाता नहीं। बैकअप लेने तक डेटा इस ब्राउज़र में रहेगा।',
  cloudNotConfigured: 'इस बिल्ड में क्लाउड बैकअप सेट नहीं है।',
  privacyNote:
    'आपकी दुकान निजी है। Row-level security से सिर्फ़ आपका खाता इसे पढ़ सकता है।',
  back: 'वापस',
  featureCloud: 'क्लाउड बैकअप और रिस्टोर',
  featureBackup: 'हर इम्पोर्ट से पहले असली बैकअप',
  featurePrivate: 'शुरू से निजी',
  featureHindi: 'अंग्रेज़ी और हिंदी',

  syncStatusSaved: 'सेव हुआ',
  syncStatusSaving: 'सेव हो रहा है...',
  syncStatusOffline: 'ऑफ़लाइन',
  syncStatusError: 'सिंक नहीं हुआ',
  syncStatusIdle: 'इस फ़ोन पर',
  syncConflict: 'मर्ज हुआ — फिर सिंक करें',
  reminderOpened: 'रिमाइंडर खुला',

  reportsTitle: 'रिपोर्ट',
  reportsSubtitle: 'क्या आया, क्या अटका है, और किसे याद दिलाना है।',
  thisMonth: 'इस महीने',
  creditGiven: 'दिया उधार',
  collected: 'मिला भुगतान',
  netChange: 'शुद्ध बदलाव',
  aging: 'बकाया की उम्र',
  agingCurrent: 'देय नहीं',
  aging1to15: '1–15 दिन',
  aging16to30: '16–30 दिन',
  aging31to60: '31–60 दिन',
  aging60plus: '60+ दिन',
  topDebtors: 'सबसे ज़्यादा बकाया',
  last6Months: 'पिछले छह महीने',
  noData: 'अभी कोई एंट्री नहीं। रिपोर्ट के लिए उधार या जमा जोड़ें।',
  cashVsUpi: 'नकद और UPI',
  overdueCustomers: 'बकाया ग्राहक',
  dueSoonCustomers: '7 दिन में देय',

  invalidPhone: 'सही 10 अंकों का मोबाइल नंबर दर्ज करें।',
  duplicatePhone: 'इस नंबर का ग्राहक पहले से मौजूद है।',
  invalidName: 'कृपया ग्राहक का नाम दर्ज करें।',
  invalidAmount: '0 से बड़ी सही राशि दर्ज करें।',
  invalidDate: 'सही तारीख चुनें।',
  invalidShopName: 'दुकान का नाम दर्ज करें।',
  invalidUpi: 'बिना स्पेस वाली UPI ID दर्ज करें।',
  invalidCreditDays: 'उधार अवधि 1 से 365 दिनों के बीच होनी चाहिए।',
  invalidEmail: 'सही ईमेल पता दर्ज करें।',
  importSuccess: (custCount, entryCount) => `${custCount} ग्राहक और ${entryCount} एंट्री लोड हुईं।`,
  importError: 'गलत JSON फ़ॉर्मेट। customers और entries ज़रूरी हैं।',
  copyUpiLink: 'UPI लिंक कॉपी',
  upiCopied: 'कॉपी हुआ',
  chooseCustomerError: 'पहले ग्राहक चुनें।',
  noCustomersForEntry: 'एंट्री से पहले ग्राहक जोड़ें।',
  fullBalance: 'पूरा बकाया',
  receivePayment: 'पैसा मिला',
  giveCredit: 'उधार दें',
  chooseCustomer: 'ग्राहक चुनें',
  savePayment: 'जमा सहेजें',
  saveCredit: 'उधार सहेजें',
  paymentSaved: 'जमा दर्ज हुआ',
  creditSaved: 'उधार दर्ज हुआ',
  entryUpdated: 'एंट्री अपडेट हुई',
  customerSaved: 'ग्राहक सहेजा गया',
  signedOut: 'साइन आउट हुआ',
};

export function getTranslations(lang: Language): Translations {
  return lang === 'hi' ? HI : EN;
}
