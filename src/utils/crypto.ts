/**
 * Secure PIN Hashing Utility using Web Crypto API (SHA-256 with Salt)
 */

const PIN_SALT = 'zahid_mobiles_secure_salt_v1';

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + PIN_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  const hash = await hashPin(pin);
  return hash === storedHash;
}
