const DB_NAME = 'invoiceKitPhotos';
const DB_VERSION = 1;
const STORE = 'photos';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        e.target.result.createObjectStore(STORE);
      };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => {
        dbPromise = null;
        reject(e.target.error);
      };
    });
  }
  return dbPromise;
}

export async function savePhoto(id, dataUrl) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(dataUrl, id);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

export async function getPhoto(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = e => resolve(e.target.result || null);
    req.onerror = e => reject(e.target.error);
  });
}

export async function getPhotos(ids) {
  if (!ids || !ids.length) return {};
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const result = {};
    let pending = ids.length;
    for (const id of ids) {
      const req = store.get(id);
      req.onsuccess = e => {
        if (e.target.result) result[id] = e.target.result;
        if (--pending === 0) resolve(result);
      };
      req.onerror = () => {
        if (--pending === 0) resolve(result);
      };
    }
  });
}

export async function deletePhoto(id) {
  if (!id) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

export async function deletePhotos(ids) {
  if (!ids || !ids.length) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const id of ids) store.delete(id);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}
