/**
 * Firebase Realtime Database & Authentication Integration
 * Enables cross-device sync, cloud backup, and data preservation on reinstall.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  onValue, 
  Database 
} from 'firebase/database';
import { Account, AppSettings, Customer, KhataEntry, Transaction } from '../types';

export interface FirebaseHisabData {
  accounts: Account[];
  transactions: Transaction[];
  customers: Customer[];
  khataEntries: KhataEntry[];
  settings: AppSettings;
  lastSyncedAt?: number;
}

// User-provided Firebase Configuration (Updated with complete 39-character Web API Key)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBwbZnusof9eo7JUeFHPABwC58kPTGMbp0",
  authDomain: "pubg-tournmenrnt.firebaseapp.com",
  databaseURL: "https://pubg-tournmenrnt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pubg-tournmenrnt",
  storageBucket: "pubg-tournmenrnt.firebasestorage.app",
  messagingSenderId: "154563136635",
  appId: "1:154563136635:web:d32d55e8c3486d039da6de",
  measurementId: "G-XPRF2WL2Z6"
};

const CONFIG_STORAGE_KEY = 'zahid_custom_firebase_config';

/**
 * Validates Firebase Web API Key format.
 * Real Google Web API keys start with 'AIzaSy' and are 39 characters long.
 * Keys with '...' or fewer than 35 characters are truncated/invalid.
 */
export function isFirebaseApiKeyValid(apiKey?: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false;
  const trimmed = apiKey.trim();
  if (trimmed.includes('...') || trimmed.endsWith('.')) return false;
  if (!trimmed.startsWith('AIzaSy')) return false;
  if (trimmed.length < 35 || trimmed.length > 45) return false;
  return true;
}

export function getStoredFirebaseConfig() {
  let config = { ...DEFAULT_FIREBASE_CONFIG };

  // 1. Check environment variable if available
  try {
    const envKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
    if (envKey && isFirebaseApiKeyValid(envKey)) {
      config.apiKey = envKey.trim();
    }
  } catch {
    // ignore
  }

  // 2. Check localStorage custom config
  try {
    const custom = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (custom) {
      const parsed = JSON.parse(custom);
      // Only override apiKey if the stored key is valid
      if (parsed.apiKey && !isFirebaseApiKeyValid(parsed.apiKey)) {
        delete parsed.apiKey;
      }
      config = { ...config, ...parsed };
    }
  } catch {
    // fallback
  }

  // 3. Check direct API key storage
  try {
    const directKey = localStorage.getItem('FIREBASE_CUSTOM_API_KEY');
    if (directKey && isFirebaseApiKeyValid(directKey)) {
      config.apiKey = directKey.trim();
    } else if (directKey && !isFirebaseApiKeyValid(directKey)) {
      localStorage.removeItem('FIREBASE_CUSTOM_API_KEY');
    }
  } catch {
    // ignore
  }

  return config;
}

export function isFirebaseConfigured(): boolean {
  const config = getStoredFirebaseConfig();
  return isFirebaseApiKeyValid(config.apiKey);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;

export function initFirebase(forceReload = false) {
  if (!forceReload && app && auth && db) {
    return { app, auth, db };
  }

  const config = getStoredFirebaseConfig();

  try {
    const existingApps = getApps();
    if (forceReload && existingApps.length > 0) {
      // In force reload, pick default or recreate
      app = existingApps[0];
    } else if (existingApps.length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getDatabase(app, config.databaseURL);
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }

  return { app, auth, db };
}

export async function resetAndReinitFirebase(newApiKey?: string) {
  if (newApiKey && newApiKey.trim()) {
    saveStoredFirebaseConfig({ apiKey: newApiKey.trim() });
  }
  
  app = null;
  auth = null;
  db = null;
  return initFirebase(true);
}

export function saveStoredFirebaseConfig(config: Partial<typeof DEFAULT_FIREBASE_CONFIG>) {
  try {
    if (config.apiKey) {
      localStorage.setItem('FIREBASE_CUSTOM_API_KEY', config.apiKey.trim());
    }
    const current = getStoredFirebaseConfig();
    const merged = { ...current, ...config };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged));
    
    // Clear cached instances
    app = null;
    auth = null;
    db = null;
    initFirebase(true);
    return merged;
  } catch {
    return DEFAULT_FIREBASE_CONFIG;
  }
}

// Initialize on module load
initFirebase();

export { app, auth, db };

/**
 * Authentication Methods
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const config = getStoredFirebaseConfig();
  if (!isFirebaseApiKeyValid(config.apiKey)) {
    const error: any = new Error(
      'Firebase API Key نا مکمل ہے۔ پرامپٹ میں دی گئی کی "AIzaSyBwbZnvso..." ادھوری ہے۔ براہ کرم فائر بیس کنسول سے 39 ہندسوں کی مکمل Web API Key درج کریں۔'
    );
    error.code = 'auth/api-key-not-valid';
    throw error;
  }

  const { auth: currentAuth } = initFirebase();
  if (!currentAuth) {
    const error: any = new Error('Firebase Auth is not initialized');
    error.code = 'auth/internal-error';
    throw error;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(currentAuth, email.trim(), pass);
    return userCredential.user;
  } catch (err: any) {
    if (
      err?.code === 'auth/api-key-not-valid' || 
      err?.message?.includes('api-key-not-valid') ||
      err?.message?.includes('API key')
    ) {
      const customErr: any = new Error(
        'Firebase API Key is invalid or truncated. Please paste your complete 39-character Web API Key.'
      );
      customErr.code = 'auth/api-key-not-valid';
      throw customErr;
    }
    throw err;
  }
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  const config = getStoredFirebaseConfig();
  if (!isFirebaseApiKeyValid(config.apiKey)) {
    const error: any = new Error(
      'Firebase API Key نا مکمل ہے۔ پرامپٹ میں دی گئی کی "AIzaSyBwbZnvso..." ادھوری ہے۔ براہ کرم فائر بیس کنسول سے 39 ہندسوں کی مکمل Web API Key درج کریں۔'
    );
    error.code = 'auth/api-key-not-valid';
    throw error;
  }

  const { auth: currentAuth } = initFirebase();
  if (!currentAuth) {
    const error: any = new Error('Firebase Auth is not initialized');
    error.code = 'auth/internal-error';
    throw error;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(currentAuth, email.trim(), pass);
    return userCredential.user;
  } catch (err: any) {
    if (
      err?.code === 'auth/api-key-not-valid' || 
      err?.message?.includes('api-key-not-valid') ||
      err?.message?.includes('API key')
    ) {
      const customErr: any = new Error(
        'Firebase API Key is invalid or truncated. Please paste your complete 39-character Web API Key.'
      );
      customErr.code = 'auth/api-key-not-valid';
      throw customErr;
    }
    throw err;
  }
}

/**
 * Mobile Number to Firebase Internal Email Mapper
 * Allows users to register and sign in directly with their phone number & password
 * without third-party SMS OTP setup, while preserving valid Firebase Auth email standard.
 */
export function formatPhoneToFirebaseEmail(mobileOrEmail: string): string {
  const trimmed = mobileOrEmail.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length === 12) {
    digits = '0' + digits.slice(2);
  }
  return `${digits}@zahidhisab.com`;
}

export function formatFirebaseEmailToPhone(email?: string | null): string {
  if (!email) return '';
  if (email.endsWith('@zahidhisab.com')) {
    return email.replace('@zahidhisab.com', '');
  }
  return email;
}

export async function loginWithMobile(mobileOrEmail: string, pass: string): Promise<User> {
  const email = formatPhoneToFirebaseEmail(mobileOrEmail);
  return loginWithEmail(email, pass);
}

export async function registerWithMobile(mobileOrEmail: string, pass: string): Promise<User> {
  const email = formatPhoneToFirebaseEmail(mobileOrEmail);
  return registerWithEmail(email, pass);
}

export async function logoutFirebase(): Promise<void> {
  const { auth: currentAuth } = initFirebase();
  if (!currentAuth) return;
  await signOut(currentAuth);
}

export function onFirebaseAuthStateChange(callback: (user: User | null) => void) {
  const { auth: currentAuth } = initFirebase();
  if (!currentAuth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(currentAuth, callback);
}

export function getCurrentFirebaseUser(): User | null {
  const { auth: currentAuth } = initFirebase();
  return currentAuth?.currentUser || null;
}

/**
 * Realtime Database CRUD Methods
 * Target Path: users/${user.uid}/hisab
 */

export async function saveHisabToCloud(userId: string, data: FirebaseHisabData): Promise<void> {
  if (!userId) return;
  try {
    const { db: currentDb } = initFirebase();
    if (!currentDb) return;

    const hisabRef = ref(currentDb, `users/${userId}/hisab`);
    const payload = {
      accounts: data.accounts || [],
      transactions: data.transactions || [],
      customers: data.customers || [],
      khataEntries: data.khataEntries || [],
      settings: data.settings || {},
      lastSyncedAt: Date.now()
    };

    await set(hisabRef, payload);
  } catch (err) {
    console.warn('Realtime Database save notice:', err);
  }
}

export async function loadHisabFromCloud(userId: string): Promise<FirebaseHisabData | null> {
  if (!userId) return null;
  try {
    const { db: currentDb } = initFirebase();
    if (!currentDb) return null;

    const hisabRef = ref(currentDb, `users/${userId}/hisab`);
    const snapshot = await get(hisabRef);

    if (snapshot.exists()) {
      const val = snapshot.val();
      return {
        accounts: Array.isArray(val.accounts) ? val.accounts : Object.values(val.accounts || {}),
        transactions: Array.isArray(val.transactions) ? val.transactions : Object.values(val.transactions || {}),
        customers: Array.isArray(val.customers) ? val.customers : Object.values(val.customers || {}),
        khataEntries: Array.isArray(val.khataEntries) ? val.khataEntries : Object.values(val.khataEntries || {}),
        settings: val.settings || {},
        lastSyncedAt: val.lastSyncedAt || Date.now()
      } as FirebaseHisabData;
    }
  } catch (err) {
    console.warn('Realtime Database load notice:', err);
  }

  return null;
}

export function subscribeToHisabCloud(
  userId: string, 
  onData: (data: FirebaseHisabData) => void,
  onError?: (err: Error) => void
) {
  if (!userId) return () => {};
  const { db: currentDb } = initFirebase();
  if (!currentDb) return () => {};

  const hisabRef = ref(currentDb, `users/${userId}/hisab`);
  const unsubscribe = onValue(
    hisabRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        onData({
          accounts: Array.isArray(val.accounts) ? val.accounts : Object.values(val.accounts || {}),
          transactions: Array.isArray(val.transactions) ? val.transactions : Object.values(val.transactions || {}),
          customers: Array.isArray(val.customers) ? val.customers : Object.values(val.customers || {}),
          khataEntries: Array.isArray(val.khataEntries) ? val.khataEntries : Object.values(val.khataEntries || {}),
          settings: val.settings || {},
          lastSyncedAt: val.lastSyncedAt || Date.now()
        } as FirebaseHisabData);
      }
    },
    (error) => {
      if (onError) onError(error);
      console.warn('Realtime Database sync listener warning:', error);
    }
  );

  return unsubscribe;
}
