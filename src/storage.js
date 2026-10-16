// src/storage.js
import { openDB } from 'idb';

const DB_NAME = 'instasaldo-db';
const STORE_NAME = 'services';

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function getAllServices() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function addService(service) {
  const db = await getDB();
  await db.add(STORE_NAME, service);
}

export async function updateService(service) {
  const db = await getDB();
  await db.put(STORE_NAME, service);
}

export async function deleteService(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}
