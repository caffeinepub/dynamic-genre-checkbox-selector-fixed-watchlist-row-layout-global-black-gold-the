// IndexedDB helper utilities for per-principal caching

const DB_NAME = 'MangaWatchlistDB';
const DB_VERSION = 1;

export interface IndexedDBConfig {
  storeName: string;
  keyPath?: string;
}

/**
 * Opens an IndexedDB database with the specified store configuration
 */
export async function openDB(config: IndexedDBConfig): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('mangaMetadata')) {
        db.createObjectStore('mangaMetadata', { keyPath: 'principal' });
      }
      if (!db.objectStoreNames.contains('coverImages')) {
        db.createObjectStore('coverImages', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Generic get operation from IndexedDB
 */
export async function getFromStore<T>(
  storeName: string,
  key: string
): Promise<T | null> {
  try {
    const db = await openDB({ storeName });
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to get from store ${storeName}:`, error);
    return null;
  }
}

/**
 * Generic put operation to IndexedDB
 */
export async function putToStore<T>(
  storeName: string,
  value: T
): Promise<void> {
  try {
    const db = await openDB({ storeName });
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to put to store ${storeName}:`, error);
    throw error;
  }
}

/**
 * Generic delete operation from IndexedDB
 */
export async function deleteFromStore(
  storeName: string,
  key: string
): Promise<void> {
  try {
    const db = await openDB({ storeName });
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to delete from store ${storeName}:`, error);
    throw error;
  }
}

/**
 * Get all keys from a store
 */
export async function getAllKeysFromStore(storeName: string): Promise<string[]> {
  try {
    const db = await openDB({ storeName });
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to get all keys from store ${storeName}:`, error);
    return [];
  }
}
