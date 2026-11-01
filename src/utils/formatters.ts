/**
 * Formatting and Financial Calculation Utilities
 */

import { TransactionType } from '../types';

/**
 * Safely format currency in Pakistani Rupees (Rs.)
 * Handles undefined, null, NaN, and negative values cleanly without throwing.
 */
export function formatCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return 'Rs. 0';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return 'Rs. 0';

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(absNum);

  return `${isNegative ? '-' : ''}Rs. ${formatted}`;
}

/**
 * Format plain number with thousand separators
 */
export function formatNumber(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(num);
}

/**
 * Safely format date into readable format (e.g. 31 Oct 2026)
 */
export function formatDate(dateStr: string | number | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = typeof dateStr === 'number' ? new Date(dateStr) : new Date(dateStr + (typeof dateStr === 'string' && !dateStr.includes('T') ? 'T00:00:00' : ''));
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Format time to 12-hour AM/PM
 */
export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  try {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
  } catch {
    return timeStr || '';
  }
}

/**
 * Today's date string YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Current time string HH:mm
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculate commission based on transaction rules:
 * A. Send Money: Commission = Cash received from customer - Amount sent to customer
 * B. Withdrawal: Commission = Amount received in account - Cash paid to customer
 */
export function calculateCommission(
  type: TransactionType,
  amount: number,
  cashAmount: number | undefined
): number {
  if (type === 'send_money') {
    if (cashAmount === undefined || isNaN(cashAmount)) return 0;
    const diff = cashAmount - amount;
    return diff > 0 ? diff : 0;
  }
  if (type === 'withdrawal') {
    if (cashAmount === undefined || isNaN(cashAmount)) return 0;
    const diff = amount - cashAmount;
    return diff > 0 ? diff : 0;
  }
  return 0;
}

/**
 * Auto-suggest cash amount based on standard rate per Rs. 1000
 * Send Money default: Rs. 10 per 1000 (e.g. 1000 sent -> 1010 cash collected)
 * Withdrawal default: Rs. 20 per 1000 (e.g. 1020 received in account -> 1000 cash paid)
 */
export function suggestCashAmount(
  type: TransactionType,
  amount: number,
  sendRate: number = 10,
  withdrawRate: number = 20
): number {
  if (amount <= 0 || isNaN(amount)) return 0;
  const thousandUnits = Math.ceil(amount / 1000);

  if (type === 'send_money') {
    return amount + thousandUnits * sendRate;
  }
  if (type === 'withdrawal') {
    // If customer sends 1020, cash paid is 1000
    // If user enters principal amount sent by customer:
    const calculatedFee = thousandUnits * withdrawRate;
    return Math.max(0, amount - calculatedFee);
  }
  return amount;
}

/**
 * Clean phone number while strictly preserving leading zero
 * Input: " 0300 1234567 " -> Output: "03001234567"
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '').trim();
}

/**
 * Validate Pakistani / international phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return true; // Phone is often optional or checked if provided
  const clean = sanitizePhoneNumber(phone);
  return clean.length >= 7 && clean.length <= 15;
}

/**
 * Generate unique ID
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Generate human-friendly reference ID
 */
export function generateRefId(prefix: string = 'TRX'): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix.toUpperCase()}-${randomNum}`;
}

/**
 * Trigger browser file download for backup export
 */
export function downloadFile(filename: string, content: string, contentType: string = 'application/json') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
