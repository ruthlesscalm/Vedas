import { openDB } from 'idb';

const DB_NAME = 'vedas-offline';
const STORE_NAME = 'pending-scans';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    },
  });
};

export const savePendingScan = async (scan) => {
  const db = await initDB();
  return db.add(STORE_NAME, scan);
};

export const getPendingScans = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const deletePendingScan = async (id) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};

export const clearPendingScans = async () => {
  const db = await initDB();
  return db.clear(STORE_NAME);
};
