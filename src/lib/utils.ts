/** Utility helpers for ZQ Ops Brain v2 */

/** Format a Date object as YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Return today's date string (YYYY-MM-DD) */
export function today(): string {
  return formatDate(new Date());
}

/** Generate a random UUID-style ID */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Truncate a string to maxLen characters, appending '…' if needed */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

/** Priority levels used across the app */
export type Priority = "low" | "medium" | "high" | "critical";

/** Map a priority to a display colour (CSS custom-property name) */
export function priorityColor(priority: Priority): string {
  const map: Record<Priority, string> = {
    low: "var(--color-low)",
    medium: "var(--color-medium)",
    high: "var(--color-high)",
    critical: "var(--color-critical)",
  };
  return map[priority];
}

/** Task status types */
export type TaskStatus = "pending" | "in-progress" | "completed" | "cancelled";

/** Simple AES-256-GCM helpers using the Web Crypto API (Keyhole Vault) */
export async function encryptSecret(
  plaintext: string,
  password: string
): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  // Encode as base64: salt | iv | ciphertext
  const combined = new Uint8Array(
    salt.byteLength + iv.byteLength + ciphertext.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptSecret(
  encoded: string,
  password: string
): Promise<string> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return dec.decode(plaintext);
}
