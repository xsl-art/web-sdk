import { OfflineReportData } from "@websdk/types";

const DB_NAME = "web-sdk";
const STORE_NAME = "offlineReports";
const DB_VERSION = 1;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** 等待事务完成 */
function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/**
 * 离线缓存
 */
export class OfflineReportCache {
  private dbPromise?: Promise<IDBDatabase | null>;

  private getDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === "undefined") return Promise.resolve(null);
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise(resolve => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          // 创建索引名createdAt，字段路径为创建时间
          store.createIndex("createdAt", "createdAt");
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });

    return this.dbPromise;
  }

  async add(record: Omit<OfflineReportData, "id">): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.add(record);
    await transactionDone(transaction);
  }

  /** 获取所有缓存记录 */
  async list(): Promise<OfflineReportData[]> {
    const db = await this.getDb();
    if (!db) return [];
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const records = await requestToPromise<OfflineReportData[]>(store.getAll());
    return records.sort((a, b) => a.createdAt - b.createdAt);
  }

  async remove(id: number): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    await transactionDone(transaction);
  }

  async update(record: OfflineReportData): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(record);
    await transactionDone(transaction);
  }

  async clearExpired(expireTime: number): Promise<void> {
    if (expireTime <= 0) return;
    const now = Date.now();
    const records = await this.list();
    const expiredRecords = records.filter(record => now - record.createdAt > expireTime);
    await Promise.all(expiredRecords.map(record => this.remove(record.id as number)));
  }

  async trimToMaxSize(maxSize: number): Promise<void> {
    if (maxSize <= 0) return;
    const records = await this.list();
    const overflow = records.length - maxSize;
    if (overflow <= 0) return;
    const removeRecords = records.slice(0, overflow);
    await Promise.all(removeRecords.map(record => this.remove(record.id as number)));
  }
}

export const offlineReportCache = new OfflineReportCache();
