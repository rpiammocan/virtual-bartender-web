import type { InventoryItem } from "./types";

const DB_NAME = "virtual-bartender";
const DB_VERSION = 1;
const INVENTORY = "inventory";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INVENTORY)) {
        const store = db.createObjectStore(INVENTORY, { keyPath: "id" });
        store.createIndex("context", "context", { unique: false });
        store.createIndex("ingredientId", "ingredientId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function getInventory(context: InventoryItem["context"], contextId?: string): Promise<InventoryItem[]> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(INVENTORY, "readonly");
    const request = transaction.objectStore(INVENTORY).index("context").getAll(context);
    const items = await new Promise<InventoryItem[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as InventoryItem[]);
      request.onerror = () => reject(request.error);
    });
    return items.filter((item) => (contextId ? item.contextId === contextId : !item.contextId));
  } finally {
    db.close();
  }
}

export async function putInventoryItem(item: InventoryItem): Promise<void> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(INVENTORY, "readwrite");
    transaction.objectStore(INVENTORY).put(item);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

export async function replaceInventory(
  context: InventoryItem["context"],
  items: InventoryItem[],
  contextId?: string,
): Promise<void> {
  const existing = await getInventory(context, contextId);
  const db = await openDatabase();
  try {
    const transaction = db.transaction(INVENTORY, "readwrite");
    const store = transaction.objectStore(INVENTORY);
    existing.forEach((item) => store.delete(item.id));
    items.forEach((item) => store.put(item));
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}
