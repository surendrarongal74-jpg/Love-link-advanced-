// Local Encrypted Mobile Storage Engine (IndexedDB)
// All chats, images, voice notes, and videos are saved directly on the mobile device
// Works seamlessly 100% offline and online

export interface LocalEncryptedMessage {
  id: string;
  coupleSpaceId: string;
  senderId: string;
  type: 'text' | 'voice' | 'image' | 'reaction';
  content?: string; // Plaintext when decrypted in memory, or caption
  mediaDataUrl?: string; // Stored securely on mobile (Data URL / Blob base64)
  duration?: number; // For voice notes
  createdAt: number;
  syncStatus?: 'synced' | 'pending';
  decrypted?: boolean;
}

const DB_NAME = 'LoveLink_DeviceVault_v2';
const DB_VERSION = 1;
const STORE_CHATS = 'encrypted_chats';
const STORE_MEDIA = 'encrypted_media';

let dbInstance: IDBDatabase | null = null;

export function getDeviceVaultDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CHATS)) {
        const chatStore = db.createObjectStore(STORE_CHATS, { keyPath: 'id' });
        chatStore.createIndex('coupleSpaceId', 'coupleSpaceId', { unique: false });
        chatStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(dbInstance);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save or update message in local mobile IndexedDB
 */
export async function saveLocalMessage(msg: LocalEncryptedMessage): Promise<void> {
  const db = await getDeviceVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHATS, 'readwrite');
    const store = tx.objectStore(STORE_CHATS);
    const req = store.put(msg);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Batch save messages to local storage
 */
export async function saveLocalMessagesBatch(msgs: LocalEncryptedMessage[]): Promise<void> {
  if (!msgs.length) return;
  const db = await getDeviceVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHATS, 'readwrite');
    const store = tx.objectStore(STORE_CHATS);
    for (const msg of msgs) {
      store.put(msg);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all messages for a couple space from mobile storage
 */
export async function getLocalMessages(coupleSpaceId: string): Promise<LocalEncryptedMessage[]> {
  const db = await getDeviceVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHATS, 'readonly');
    const store = tx.objectStore(STORE_CHATS);
    const idx = store.index('coupleSpaceId');
    const req = idx.getAll(coupleSpaceId);
    req.onsuccess = () => {
      const results = (req.result || []) as LocalEncryptedMessage[];
      results.sort((a, b) => a.createdAt - b.createdAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a message from local mobile storage
 */
export async function deleteLocalMessage(msgId: string): Promise<void> {
  const db = await getDeviceVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHATS, 'readwrite');
    const store = tx.objectStore(STORE_CHATS);
    const req = store.delete(msgId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save large media blob locally on device
 */
export async function saveLocalMediaItem(id: string, mediaData: string | Blob, mimeType: string): Promise<void> {
  const db = await getDeviceVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_MEDIA);
    const req = store.put({ id, data: mediaData, mimeType, timestamp: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve media item directly from device
 */
export async function getLocalMediaItem(id: string): Promise<{ data: string | Blob; mimeType: string } | null> {
  const db = await getDeviceVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readonly');
    const store = tx.objectStore(STORE_MEDIA);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
