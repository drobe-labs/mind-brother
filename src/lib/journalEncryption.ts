/**
 * Journal Encryption Utility
 * 
 * Uses Web Crypto API for client-side encryption of journal entries.
 * The encryption key is derived from the user's passphrase and never leaves the device.
 * Even the developer cannot read encrypted entries without the passphrase.
 */

// Convert string to ArrayBuffer
function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to string
function bufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

// Convert ArrayBuffer to Base64 string (for storage)
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 string to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a random salt
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

// Generate a random IV (Initialization Vector)
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

// Derive encryption key from passphrase using PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    stringToBuffer(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    passphraseKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt content
export async function encryptContent(content: string, passphrase: string): Promise<string> {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(passphrase, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    stringToBuffer(content)
  );

  // Combine salt + iv + encrypted data into one string
  // Format: base64(salt):base64(iv):base64(encrypted)
  const combined = `${bufferToBase64(salt.buffer)}:${bufferToBase64(iv.buffer)}:${bufferToBase64(encryptedBuffer)}`;
  
  return combined;
}

// Decrypt content
export async function decryptContent(encryptedData: string, passphrase: string): Promise<string> {
  try {
    const [saltB64, ivB64, encryptedB64] = encryptedData.split(':');
    
    if (!saltB64 || !ivB64 || !encryptedB64) {
      throw new Error('Invalid encrypted data format');
    }

    const salt = new Uint8Array(base64ToBuffer(saltB64));
    const iv = new Uint8Array(base64ToBuffer(ivB64));
    const encryptedBuffer = base64ToBuffer(encryptedB64);

    const key = await deriveKey(passphrase, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedBuffer
    );

    return bufferToString(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt. Incorrect passphrase or corrupted data.');
  }
}

// Check if content is encrypted (simple check for our format)
export function isEncrypted(content: string): boolean {
  if (!content) return false;
  const parts = content.split(':');
  // Our encrypted format has exactly 3 parts: salt:iv:encrypted
  // Each part should be valid base64
  if (parts.length !== 3) return false;
  
  try {
    // Try to decode each part as base64
    atob(parts[0]);
    atob(parts[1]);
    atob(parts[2]);
    return true;
  } catch {
    return false;
  }
}

// Hash passphrase to create a verification token (stored to verify correct passphrase)
export async function createPassphraseHash(passphrase: string): Promise<string> {
  const salt = generateSalt();
  const key = await deriveKey(passphrase, salt);
  
  // Encrypt a known string to verify passphrase later
  const verificationString = 'MIND_BROTHER_JOURNAL_VERIFICATION';
  const iv = generateIV();
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    stringToBuffer(verificationString)
  );
  
  return `${bufferToBase64(salt.buffer)}:${bufferToBase64(iv.buffer)}:${bufferToBase64(encryptedBuffer)}`;
}

// Verify passphrase against stored hash
export async function verifyPassphrase(passphrase: string, storedHash: string): Promise<boolean> {
  try {
    const [saltB64, ivB64, encryptedB64] = storedHash.split(':');
    
    const salt = new Uint8Array(base64ToBuffer(saltB64));
    const iv = new Uint8Array(base64ToBuffer(ivB64));
    const encryptedBuffer = base64ToBuffer(encryptedB64);
    
    const key = await deriveKey(passphrase, salt);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedBuffer
    );
    
    const decrypted = bufferToString(decryptedBuffer);
    return decrypted === 'MIND_BROTHER_JOURNAL_VERIFICATION';
  } catch {
    return false;
  }
}

// Encryption status interface
export interface EncryptionStatus {
  isEnabled: boolean;
  isUnlocked: boolean;
  passphraseHash: string | null;
}

// Local storage keys
const ENCRYPTION_ENABLED_KEY = 'journal_encryption_enabled';
const PASSPHRASE_HASH_KEY = 'journal_passphrase_hash';
const SESSION_KEY_KEY = 'journal_session_key'; // Temporary session storage

// Check encryption status
export function getEncryptionStatus(): EncryptionStatus {
  const isEnabled = localStorage.getItem(ENCRYPTION_ENABLED_KEY) === 'true';
  const passphraseHash = localStorage.getItem(PASSPHRASE_HASH_KEY);
  const isUnlocked = sessionStorage.getItem(SESSION_KEY_KEY) !== null;
  
  return {
    isEnabled,
    isUnlocked,
    passphraseHash
  };
}

// Enable encryption with a new passphrase
export async function enableEncryption(passphrase: string): Promise<void> {
  if (passphrase.length < 8) {
    throw new Error('Passphrase must be at least 8 characters');
  }
  
  const hash = await createPassphraseHash(passphrase);
  localStorage.setItem(ENCRYPTION_ENABLED_KEY, 'true');
  localStorage.setItem(PASSPHRASE_HASH_KEY, hash);
  
  // Store passphrase in session (cleared when browser closes)
  sessionStorage.setItem(SESSION_KEY_KEY, passphrase);
}

// Unlock journal with passphrase
export async function unlockJournal(passphrase: string): Promise<boolean> {
  const hash = localStorage.getItem(PASSPHRASE_HASH_KEY);
  if (!hash) {
    throw new Error('Encryption not set up');
  }
  
  const isValid = await verifyPassphrase(passphrase, hash);
  if (isValid) {
    sessionStorage.setItem(SESSION_KEY_KEY, passphrase);
    return true;
  }
  return false;
}

// Lock journal (clear session key)
export function lockJournal(): void {
  sessionStorage.removeItem(SESSION_KEY_KEY);
}

// Get current session passphrase (for encryption/decryption)
export function getSessionPassphrase(): string | null {
  return sessionStorage.getItem(SESSION_KEY_KEY);
}

// Disable encryption (requires correct passphrase)
export async function disableEncryption(passphrase: string): Promise<boolean> {
  const hash = localStorage.getItem(PASSPHRASE_HASH_KEY);
  if (!hash) return true;
  
  const isValid = await verifyPassphrase(passphrase, hash);
  if (isValid) {
    localStorage.removeItem(ENCRYPTION_ENABLED_KEY);
    localStorage.removeItem(PASSPHRASE_HASH_KEY);
    sessionStorage.removeItem(SESSION_KEY_KEY);
    return true;
  }
  return false;
}

// Change passphrase (requires current passphrase)
export async function changePassphrase(currentPassphrase: string, newPassphrase: string): Promise<boolean> {
  const hash = localStorage.getItem(PASSPHRASE_HASH_KEY);
  if (!hash) return false;
  
  const isValid = await verifyPassphrase(currentPassphrase, hash);
  if (!isValid) return false;
  
  if (newPassphrase.length < 8) {
    throw new Error('New passphrase must be at least 8 characters');
  }
  
  const newHash = await createPassphraseHash(newPassphrase);
  localStorage.setItem(PASSPHRASE_HASH_KEY, newHash);
  sessionStorage.setItem(SESSION_KEY_KEY, newPassphrase);
  
  return true;
}

export default {
  encryptContent,
  decryptContent,
  isEncrypted,
  getEncryptionStatus,
  enableEncryption,
  unlockJournal,
  lockJournal,
  getSessionPassphrase,
  disableEncryption,
  changePassphrase
};

