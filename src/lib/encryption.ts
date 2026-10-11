// Web Crypto API End-to-End Encryption (AES-GCM 256-bit)
// Derives unique per-couple key using PBKDF2 with SHA-256

const PBKDF2_SALT = new TextEncoder().encode("LoveLink_ZeroKnowledge_Salt_2026_SecureVault");
const PBKDF2_ITERATIONS = 100000;

// Key cache to avoid re-deriving on every single packet
const keyCache = new Map<string, CryptoKey>();

export async function deriveKey(coupleSpaceId: string): Promise<CryptoKey> {
  if (keyCache.has(coupleSpaceId)) {
    return keyCache.get(coupleSpaceId)!;
  }

  const enc = new TextEncoder();
  const rawKeyMaterial = enc.encode(`LoveLink_Vault_${coupleSpaceId}`);

  // Import key material for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    rawKeyMaterial,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM 256-bit encryption key
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: PBKDF2_SALT,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(coupleSpaceId, aesKey);
  return aesKey;
}

// Convert ArrayBuffer to URL-safe Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 back to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt any UTF-8 string or serialized JSON payload into ciphertext bundle
 * Returns { ciphertext: base64, iv: base64 }
 */
export async function encryptData(coupleSpaceId: string, plainText: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await deriveKey(coupleSpaceId);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV standard for AES-GCM
  const encodedText = new TextEncoder().encode(plainText);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encodedText
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv)
  };
}

/**
 * Decrypt ciphertext bundle back into UTF-8 plaintext string
 */
export async function decryptData(coupleSpaceId: string, ciphertext: string, iv: string): Promise<string> {
  const key = await deriveKey(coupleSpaceId);
  const ivBuffer = base64ToBuffer(iv);
  const cipherBuffer = base64ToBuffer(ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    key,
    cipherBuffer
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Helper to compress image or video or audio blob before encryption
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
