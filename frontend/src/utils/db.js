import { openDB } from 'idb';

const DB_NAME = 'vedas-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-logs';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  },
});

/**
 * Save a scan log to IndexedDB for later sync.
 * @param {Object} log - The log object containing batchId, scannedBy, location, timeStamp, logHash
 * @returns {Promise<number>} The auto-incremented ID of the saved log
 */
export const saveOfflineLog = async (log) => {
  const db = await dbPromise;
  return db.add(STORE_NAME, { ...log, savedAt: new Date().toISOString() });
};

/**
 * Get all pending offline logs.
 * @returns {Promise<Array>} Array of pending log objects
 */
export const getOfflineLogs = async () => {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
};

/**
 * Get count of pending offline logs.
 * @returns {Promise<number>} Number of pending logs
 */
export const getPendingCount = async () => {
  const db = await dbPromise;
  return db.count(STORE_NAME);
};

/**
 * Delete a specific offline log by ID (after successful sync).
 * @param {number} id - The auto-incremented ID of the log to delete
 */
export const deleteOfflineLog = async (id) => {
  const db = await dbPromise;
  return db.delete(STORE_NAME, id);
};

/**
 * Clear all pending offline logs (after successful bulk sync).
 */
export const clearOfflineLogs = async () => {
  const db = await dbPromise;
  return db.clear(STORE_NAME);
};
