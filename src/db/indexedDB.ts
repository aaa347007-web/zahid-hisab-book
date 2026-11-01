/**
 * Reliable Offline-First IndexedDB Database Engine with LocalStorage Fallback
 */

import { Account, AppSettings, AuditLog, BackupData, Customer, KhataEntry, Transaction } from '../types';
import { generateUUID } from '../utils/formatters';

const DB_NAME = 'ZahidHisabDB';
const DB_VERSION = 1;
const LOCAL_STORAGE_BACKUP_KEY = 'zahid_hisab_offline_snapshot';

// Default initial accounts (Rs. 0 balance, ready for user setup)
export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'cash',
    name: 'Cash in Hand',
    nameUrdu: 'نقد رقم (کیش ان ہینڈ)',
    balance: 0,
    initialBalance: 0,
    color: '#10b981', // emerald
    iconName: 'Banknote'
  },
  {
    id: 'easypaisa',
    name: 'EasyPaisa',
    nameUrdu: 'ایزی پیسہ',
    balance: 0,
    initialBalance: 0,
    accountNumber: '',
    color: '#22c55e', // green
    iconName: 'Smartphone'
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    nameUrdu: 'جاز کیش',
    balance: 0,
    initialBalance: 0,
    accountNumber: '',
    color: '#ef4444', // red/orange
    iconName: 'CreditCard'
  },
  {
    id: 'bank',
    name: 'Bank Account',
    nameUrdu: 'بینک اکاؤنٹ',
    balance: 0,
    initialBalance: 0,
    accountNumber: '',
    color: '#3b82f6', // blue
    iconName: 'Building2'
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: 'Zahid Mobiles and Photo State',
  shopNameUrdu: 'زاہد موبائلز اینڈ فوٹو اسٹیٹ',
  ownerName: 'Zahid',
  phone: '03001234567',
  language: 'en',
  theme: 'dark',
  pinEnabled: false,
  pinHash: '',
  allowOverdraft: false,
  defaultSendRatePer1000: 10,
  defaultWithdrawRatePer1000: 20,
  isSetupComplete: false
};

class DatabaseService {
  private db: IDBDatabase | null = null;
  private isFallbackMode = false;

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not supported, using localStorage fallback');
      this.isFallbackMode = true;
      return;
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('accounts')) {
            db.createObjectStore('accounts', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('transactions')) {
            const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
            txStore.createIndex('date', 'date', { unique: false });
            txStore.createIndex('accountId', 'accountId', { unique: false });
            txStore.createIndex('type', 'type', { unique: false });
            txStore.createIndex('customerPhone', 'customerPhone', { unique: false });
          }
          if (!db.objectStoreNames.contains('customers')) {
            const custStore = db.createObjectStore('customers', { keyPath: 'id' });
            custStore.createIndex('phone', 'phone', { unique: false });
          }
          if (!db.objectStoreNames.contains('khata_entries')) {
            const khataStore = db.createObjectStore('khata_entries', { keyPath: 'id' });
            khataStore.createIndex('customerId', 'customerId', { unique: false });
            khataStore.createIndex('date', 'date', { unique: false });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains('audit_logs')) {
            const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
            auditStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve();
        };

        request.onerror = (e) => {
          console.error('IndexedDB open error, falling back to LocalStorage', e);
          this.isFallbackMode = true;
          resolve();
        };
      } catch (err) {
        console.error('IndexedDB init caught error', err);
        this.isFallbackMode = true;
        resolve();
      }
    });
  }

  // --- ACCOUNTS ---
  async getAccounts(): Promise<Account[]> {
    if (this.isFallbackMode || !this.db) {
      const stored = localStorage.getItem('zahid_accounts');
      if (stored) {
        try { return JSON.parse(stored); } catch { /* ignore */ }
      }
      return DEFAULT_ACCOUNTS;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('accounts', 'readonly');
        const store = tx.objectStore('accounts');
        const req = store.getAll();
        req.onsuccess = () => {
          const accounts = req.result as Account[];
          if (!accounts || accounts.length === 0) {
            // Seed defaults
            this.saveAccounts(DEFAULT_ACCOUNTS).then(() => resolve(DEFAULT_ACCOUNTS));
          } else {
            resolve(accounts);
          }
        };
        req.onerror = () => resolve(DEFAULT_ACCOUNTS);
      } catch {
        resolve(DEFAULT_ACCOUNTS);
      }
    });
  }

  async saveAccounts(accounts: Account[]): Promise<void> {
    // Redundant backup to localStorage
    try {
      localStorage.setItem('zahid_accounts', JSON.stringify(accounts));
    } catch { /* ignore */ }

    if (this.isFallbackMode || !this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('accounts', 'readwrite');
        const store = tx.objectStore('accounts');
        accounts.forEach((acc) => store.put(acc));
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // --- TRANSACTIONS ---
  async getTransactions(): Promise<Transaction[]> {
    if (this.isFallbackMode || !this.db) {
      const stored = localStorage.getItem('zahid_transactions');
      if (stored) {
        try { return JSON.parse(stored); } catch { /* ignore */ }
      }
      return [];
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result || []) as Transaction[];
          // Sort newest first
          items.sort((a, b) => b.timestamp - a.timestamp);
          resolve(items);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    const list = await this.getTransactions();
    const existingIndex = list.findIndex(t => t.id === transaction.id);
    if (existingIndex >= 0) {
      list[existingIndex] = transaction;
    } else {
      list.unshift(transaction);
    }

    try {
      localStorage.setItem('zahid_transactions', JSON.stringify(list));
    } catch { /* ignore */ }

    if (this.isFallbackMode || !this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('transactions', 'readwrite');
        const store = tx.objectStore('transactions');
        store.put(transaction);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    const list = (await this.getTransactions()).filter(t => t.id !== id);
    try {
      localStorage.setItem('zahid_transactions', JSON.stringify(list));
    } catch { /* ignore */ }

    if (this.isFallbackMode || !this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('transactions', 'readwrite');
        const store = tx.objectStore('transactions');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // --- CUSTOMERS ---
  async getCustomers(): Promise<Customer[]> {
    if (this.isFallbackMode || !this.db) {
      const stored = localStorage.getItem('zahid_customers');
      if (stored) {
        try { return JSON.parse(stored); } catch { /* ignore */ }
      }
      return [];
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('customers', 'readonly');
        const store = tx.objectStore('customers');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async saveCustomer(customer: Customer): Promise<void> {
    const list = await this.getCustomers();
    const idx = list.findIndex(c => c.id === customer.id);
    if (idx >= 0) list[idx] = customer;
    else list.push(customer);

    try {
      localStorage.setItem('zahid_customers', JSON.stringify(list));
    } catch { /* ignore */ }

    if (this.isFallbackMode || !this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('customers', 'readwrite');
        const store = tx.objectStore('customers');
        store.put(customer);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    const list = (await this.getCustomers()).filter(c => c.id !== id);
    try {
      localStorage.setItem('zahid_customers', JSON.stringify(list));
    } catch { /* ignore */ }

    if (this.isFallbackMode || !this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('customers', 'readwrite');
        const store = tx.objectStore('customers');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // --- KHATA ENTRIES ---
  async getKhataEntries(customerId?: string): Promise<KhataEntry[]> {
    let allEntries: KhataEntry[] = [];
    if (this.isFallbackMode || !this.db) {
      const stored = localStorage.getItem('zahid_khata_entries');
      if (stored) {
        try { allEntries = JSON.parse(stored); } catch { /* ignore */ }
      }
    } else {
      allEntries = await new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('khata_entries', 'readonly');
          const store = tx.objectStore('khata_entries');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });
    }

    if (customerId) {
      return allEntries.filter(e => e.customerId === customerId).sort((a, b) => b.timestamp - a.timestamp);
    }
    return allEntries.sort((a, b) => b.timestamp - a.timestamp);
  }

  async saveKhataEntry(entry: KhataEntry): Promise<void> {
    const all = await this.getKhataEntries();
    const idx = all.findIndex(e => e.id === entry.id);
    if (idx >= 0) all[idx] = entry;
    else all.unshift(entry);

    try {
      localStorage.setItem('zahid_khata_entries', JSON.stringify(all));
    } catch { /* ignore */ }

    if (this.isFallbackMode || !this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('khata_entries', 'readwrite');
        const store = tx.objectStore('khata_entries');
        store.put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async deleteKhataEntry(id: string): Promise<void> {
    const all = (await this.getKhataEntries()).filter(e => e.id !== id);
    try {
      localStorage.setItem('zahid_khata_entries', JSON.stringify(all));
    } catch { /* ignore */ }

    if (this.isFallbackMode || !this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('khata_entries', 'readwrite');
        const store = tx.objectStore('khata_entries');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // --- SETTINGS ---
  async getSettings(): Promise<AppSettings> {
    if (this.isFallbackMode || !this.db) {
      const stored = localStorage.getItem('zahid_settings');
      if (stored) {
        try { return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }; } catch { /* ignore */ }
      }
      return DEFAULT_SETTINGS;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const req = store.get('app_config');
        req.onsuccess = () => {
          if (req.result && req.result.value) {
            resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
          } else {
            resolve(DEFAULT_SETTINGS);
          }
        };
        req.onerror = () => resolve(DEFAULT_SETTINGS);
      } catch {
        resolve(DEFAULT_SETTINGS);
      }
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      localStorage.setItem('zahid_settings', JSON.stringify(settings));
    } catch { /* ignore */ }

    if (this.isFallbackMode || !this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        store.put({ key: 'app_config', value: settings });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // --- AUDIT LOGS ---
  async logAction(action: AuditLog['action'], entity: AuditLog['entity'], entityId: string, details: string): Promise<void> {
    const entry: AuditLog = {
      id: generateUUID(),
      action,
      entity,
      entityId,
      details,
      timestamp: Date.now()
    };

    if (this.isFallbackMode || !this.db) {
      const stored = localStorage.getItem('zahid_audit_logs');
      const list: AuditLog[] = stored ? JSON.parse(stored) : [];
      list.unshift(entry);
      if (list.length > 500) list.pop(); // keep last 500
      try { localStorage.setItem('zahid_audit_logs', JSON.stringify(list)); } catch { /* ignore */ }
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('audit_logs', 'readwrite');
        const store = tx.objectStore('audit_logs');
        store.put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    if (this.isFallbackMode || !this.db) {
      const stored = localStorage.getItem('zahid_audit_logs');
      return stored ? JSON.parse(stored) : [];
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('audit_logs', 'readonly');
        const store = tx.objectStore('audit_logs');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result || []) as AuditLog[];
          list.sort((a, b) => b.timestamp - a.timestamp);
          resolve(list);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  // --- FULL BACKUP & RESTORE ---
  async exportFullBackup(): Promise<BackupData> {
    const accounts = await this.getAccounts();
    const transactions = await this.getTransactions();
    const customers = await this.getCustomers();
    const khataEntries = await this.getKhataEntries();
    const settings = await this.getSettings();
    const auditLogs = await this.getAuditLogs();

    const payload = JSON.stringify({ accounts, transactions, customers, khataEntries, settings });
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }

    const backup: BackupData = {
      version: 1,
      appName: 'Zahid Hisab Book',
      shopName: settings.shopName,
      exportDate: new Date().toISOString(),
      exportTimestamp: Date.now(),
      accounts,
      transactions,
      customers,
      khataEntries,
      settings,
      auditLogs,
      checksum: Math.abs(hash).toString(16)
    };

    // Also mirror to fallback local snapshot
    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(backup));
    } catch { /* ignore */ }

    return backup;
  }

  async restoreFullBackup(backup: BackupData): Promise<boolean> {
    if (!backup || !backup.accounts || !backup.transactions) {
      throw new Error('Invalid backup file structure: missing accounts or transactions');
    }

    // Save all stores
    await this.saveAccounts(backup.accounts);
    for (const tx of backup.transactions) {
      await this.saveTransaction(tx);
    }
    if (backup.customers) {
      for (const cust of backup.customers) {
        await this.saveCustomer(cust);
      }
    }
    if (backup.khataEntries) {
      for (const k of backup.khataEntries) {
        await this.saveKhataEntry(k);
      }
    }
    if (backup.settings) {
      await this.saveSettings(backup.settings);
    }

    await this.logAction('restore', 'settings', 'backup', `Restored backup from ${backup.exportDate}`);
    return true;
  }

  async clearAllData(): Promise<void> {
    await this.saveAccounts(DEFAULT_ACCOUNTS);
    if (!this.isFallbackMode && this.db) {
      const stores = ['transactions', 'customers', 'khata_entries', 'audit_logs'];
      for (const storeName of stores) {
        try {
          const tx = this.db.transaction(storeName, 'readwrite');
          tx.objectStore(storeName).clear();
        } catch { /* ignore */ }
      }
    }
    localStorage.removeItem('zahid_transactions');
    localStorage.removeItem('zahid_customers');
    localStorage.removeItem('zahid_khata_entries');
    localStorage.removeItem('zahid_audit_logs');
    await this.saveSettings(DEFAULT_SETTINGS);
  }
}

export const dbService = new DatabaseService();
