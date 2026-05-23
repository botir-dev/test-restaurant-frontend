// IndexedDB — offline ma'lumotlarni saqlash
// Barcha pending amallar shu yerda saqlanadi

const DB_NAME = "restoran-offline";
const DB_VERSION = 1;

export type ActionType =
  | "create_order"
  | "update_order"
  | "prepare_item"
  | "complete_payment";

export interface PendingAction {
  id: string;
  type: ActionType;
  payload: Record<string, unknown>;
  createdAt: number;
  retries: number;
  status: "pending" | "syncing" | "failed";
}

export interface CachedMenu {
  branchId: string;
  items: unknown[];
  cachedAt: number;
}

export interface CachedTable {
  branchId: string;
  tables: unknown[];
  cachedAt: number;
}

// ─── DB ochish ────────────────────────────────────────────────
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // Pending amallar
      if (!db.objectStoreNames.contains("pending_actions")) {
        const store = db.createObjectStore("pending_actions", {
          keyPath: "id",
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Cache: menu
      if (!db.objectStoreNames.contains("menu_cache")) {
        db.createObjectStore("menu_cache", { keyPath: "branchId" });
      }

      // Cache: stollar
      if (!db.objectStoreNames.contains("table_cache")) {
        db.createObjectStore("table_cache", { keyPath: "branchId" });
      }

      // Cache: buyurtmalar
      if (!db.objectStoreNames.contains("order_cache")) {
        db.createObjectStore("order_cache", { keyPath: "branchId" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

// ─── Yordamchi: transaction ───────────────────────────────────
const tx = (
  db: IDBDatabase,
  stores: string | string[],
  mode: IDBTransactionMode = "readonly",
) => db.transaction(stores, mode);

// ─── PENDING ACTIONS ──────────────────────────────────────────
export const addPendingAction = async (
  action: Omit<PendingAction, "id" | "createdAt" | "retries" | "status">,
): Promise<string> => {
  const db = await openDB();
  const id = `${action.type}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const record: PendingAction = {
    ...action,
    id,
    createdAt: Date.now(),
    retries: 0,
    status: "pending",
  };
  return new Promise((resolve, reject) => {
    const req = tx(db, "pending_actions", "readwrite")
      .objectStore("pending_actions")
      .add(record);
    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
  });
};

export const getPendingActions = async (): Promise<PendingAction[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "pending_actions")
      .objectStore("pending_actions")
      .getAll();
    req.onsuccess = () =>
      resolve(
        (req.result as PendingAction[]).sort(
          (a, b) => a.createdAt - b.createdAt,
        ),
      );
    req.onerror = () => reject(req.error);
  });
};

export const updatePendingAction = async (
  id: string,
  updates: Partial<PendingAction>,
): Promise<void> => {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    const store = tx(db, "pending_actions", "readwrite").objectStore(
      "pending_actions",
    );
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = { ...getReq.result, ...updates };
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

export const deletePendingAction = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "pending_actions", "readwrite")
      .objectStore("pending_actions")
      .delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getPendingCount = async (): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "pending_actions")
      .objectStore("pending_actions")
      .count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

// ─── MENU CACHE ───────────────────────────────────────────────
export const cacheMenu = async (
  branchId: string,
  items: unknown[],
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "menu_cache", "readwrite")
      .objectStore("menu_cache")
      .put({ branchId, items, cachedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getCachedMenu = async (
  branchId: string,
): Promise<CachedMenu | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "menu_cache").objectStore("menu_cache").get(branchId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
};

// ─── TABLE CACHE ──────────────────────────────────────────────
export const cacheTables = async (
  branchId: string,
  tables: unknown[],
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "table_cache", "readwrite")
      .objectStore("table_cache")
      .put({ branchId, tables, cachedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getCachedTables = async (
  branchId: string,
): Promise<CachedTable | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "table_cache").objectStore("table_cache").get(branchId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
};

// ─── ORDER CACHE ──────────────────────────────────────────────
export const cacheOrders = async (
  branchId: string,
  orders: unknown[],
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "order_cache", "readwrite")
      .objectStore("order_cache")
      .put({ branchId, orders, cachedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getCachedOrders = async (
  branchId: string,
): Promise<unknown[] | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "order_cache").objectStore("order_cache").get(branchId);
    req.onsuccess = () => resolve(req.result?.orders || null);
    req.onerror = () => reject(req.error);
  });
};
