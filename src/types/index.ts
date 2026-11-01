/**
 * Core Type Definitions for Zahid Hisab Book
 */

export type AccountType = 'cash' | 'easypaisa' | 'jazzcash' | 'bank';

export interface Account {
  id: AccountType;
  name: string;
  nameUrdu: string;
  balance: number;
  initialBalance: number;
  accountNumber?: string;
  color: string;
  iconName: string;
}

export type TransactionType =
  | 'money_in'
  | 'money_out'
  | 'send_money'
  | 'withdrawal'
  | 'shop_income'
  | 'shop_expense'
  | 'khata_credit'
  | 'khata_payment';

export interface Transaction {
  id: string;
  type: TransactionType;
  accountId: AccountType;
  secondaryAccountId?: AccountType;
  amount: number;             // Principal amount (amount sent, amount received, income, expense)
  cashAmount?: number;        // Cash handed/received in Send Money or Withdrawal
  commission: number;         // Commission earned (0 if not applicable)
  customerName: string;
  customerPhone: string;      // Strictly text to preserve leading zeroes, e.g. "03001234567"
  referenceId: string;        // Ref / TRX ID
  category: string;
  description?: string;
  date: string;               // YYYY-MM-DD
  time: string;               // HH:mm:ss
  timestamp: number;
  createdAt: number;
  updatedAt: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  totalUdhar: number;         // Total credit given
  totalPaid: number;          // Total payment received
  currentBalance: number;     // Remaining balance owed to shop (totalUdhar - totalPaid)
  createdAt: number;
  updatedAt: number;
}

export interface KhataEntry {
  id: string;
  customerId: string;
  type: 'credit_given' | 'payment_received';
  amount: number;
  accountId?: AccountType;    // Account where payment was deposited (if payment_received)
  note?: string;
  date: string;
  time: string;
  timestamp: number;
  transactionId?: string;     // Reference to ledger transaction if connected
}

export interface AppSettings {
  shopName: string;
  shopNameUrdu: string;
  ownerName: string;
  phone: string;
  language: 'en' | 'ur';
  theme: 'dark' | 'light';
  pinEnabled: boolean;
  pinHash: string;            // SHA-256 hashed PIN
  allowOverdraft: boolean;    // Allow balances to go negative or reject
  defaultSendRatePer1000: number;      // e.g. 10
  defaultWithdrawRatePer1000: number;  // e.g. 20
  isSetupComplete: boolean;   // Whether initial setup was completed
}

export interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'initial_balance_set';
  entity: 'transaction' | 'account' | 'customer' | 'khata' | 'settings';
  entityId: string;
  details: string;
  timestamp: number;
}

export interface DailyAccountReconciliation {
  openingBalance: number;
  moneyIn: number;
  moneyOut: number;
  closingBalance: number;
  netChange: number;
}

export interface DailyReportData {
  date: string;
  accounts: Record<AccountType, DailyAccountReconciliation>;
  totalOpeningBalance: number;
  totalClosingBalance: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  sendMoneyTotal: number;
  sendMoneyCount: number;
  sendMoneyCommission: number;
  withdrawalTotal: number;
  withdrawalCount: number;
  withdrawalCommission: number;
  totalCommission: number;
  shopIncomeTotal: number;
  shopExpenseTotal: number;
  netProfit: number;
  transactions: Transaction[];
}

export interface BackupData {
  version: number;
  exportDate: string;
  exportTimestamp: number;
  appName: string;
  shopName: string;
  accounts: Account[];
  transactions: Transaction[];
  customers: Customer[];
  khataEntries: KhataEntry[];
  settings: AppSettings;
  auditLogs: AuditLog[];
  checksum: string;
}

export interface TestResultItem {
  id: string;
  title: string;
  status: 'pending' | 'passed' | 'failed';
  expected: string;
  actual: string;
  details?: string;
}
