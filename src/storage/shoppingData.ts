export type ShoppingItem = {
  id: string;
  ingredientId?: string;
  name: string;
  category: string;
  purchased: boolean;
};

const KEY = "virtual-bartender-shopping-list";

function read(): ShoppingItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as ShoppingItem[]; }
  catch { return []; }
}

function write(items: ShoppingItem[]) { localStorage.setItem(KEY, JSON.stringify(items)); }

export function getShoppingItems(): ShoppingItem[] { return read(); }
export function addShoppingItem(item: Omit<ShoppingItem, "id" | "purchased">) {
  write([...read(), { ...item, id: crypto.randomUUID(), purchased: false }]);
}
export function markShoppingPurchased(id: string, purchased: boolean) {
  write(read().map((item) => item.id === id ? { ...item, purchased } : item));
}
export function removeShoppingItem(id: string) { write(read().filter((item) => item.id !== id)); }
