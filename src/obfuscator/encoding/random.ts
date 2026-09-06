// Secure random utilities for obfuscation
import crypto from 'crypto';

export function randomBytes(length: number): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.randomBytes) {
    // Node.js environment
    return new Uint8Array(crypto.randomBytes(length));
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    // Browser environment
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  } else {
    // Fallback (not cryptographically secure)
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }
}

export function randomInt(min: number, max: number): number {
  const bytes = randomBytes(4);
  const value = new DataView(bytes.buffer).getUint32(0);
  return min + (value % (max - min + 1));
}

export function randomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export function randomIdentifier(): string {
  const prefix = ['_', 'l', 'v', 'x', 'f', 't'][randomInt(0, 5)];
  const suffix = randomString(8);
  return `${prefix}_${suffix}`;
}
