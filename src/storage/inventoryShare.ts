import { getInventory, replaceInventory } from "./db";
import type { InventoryItem, InventoryShareFile } from "./types";

export const INVENTORY_IMPORT_WARNING =
  "Importing this inventory will replace your existing inventory. Your current inventory will be removed. Export it first if you want to keep a copy.";

function makeId(ingredientId: string, context: InventoryItem["context"], contextId?: string): string {
  return `${context}:${contextId ?? "default"}:${ingredientId}`;
}

export async function buildInventoryShareFile(
  source: "my_bar" | "tonight_bar",
  contextId?: string,
  name?: string,
): Promise<InventoryShareFile> {
  const inventory = await getInventory(source, contextId);
  return {
    format: "virtual-bartender-inventory",
    version: 1,
    exportedAt: new Date().toISOString(),
    source,
    name,
    items: inventory.map(({ ingredientId, ingredientName, quantity, unit, have, notes }) => ({
      ingredientId,
      ingredientName,
      quantity,
      unit,
      have,
      notes,
    })),
  };
}

export function downloadInventoryShareFile(data: InventoryShareFile): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = data.source === "my_bar"
    ? "virtual-bartender-inventory.json"
    : "virtual-bartender-tonights-bar.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function parseInventoryShareFile(text: string): InventoryShareFile {
  const value = JSON.parse(text) as Partial<InventoryShareFile>;
  if (value.format !== "virtual-bartender-inventory" || value.version !== 1 || !Array.isArray(value.items)) {
    throw new Error("This is not a supported Virtual Bartender inventory file.");
  }
  for (const item of value.items) {
    if (!item || typeof item.ingredientId !== "string" || typeof item.ingredientName !== "string") {
      throw new Error("The inventory file contains an invalid ingredient entry.");
    }
  }
  return value as InventoryShareFile;
}

/**
 * Import always overwrites the destination inventory. The UI must show
 * INVENTORY_IMPORT_WARNING and obtain confirmation before calling this.
 */
export async function importInventoryShareFile(
  data: InventoryShareFile,
  destination: "my_bar" | "tonight_bar" = "my_bar",
  contextId?: string,
): Promise<number> {
  const now = new Date().toISOString();
  const incoming: InventoryItem[] = data.items.map((item) => ({
    id: makeId(item.ingredientId, destination, contextId),
    ingredientId: item.ingredientId,
    ingredientName: item.ingredientName,
    context: destination,
    contextId,
    quantity: item.quantity,
    unit: item.unit,
    have: item.have,
    notes: item.notes,
    updatedAt: now,
  }));

  await replaceInventory(destination, incoming, contextId);
  return incoming.length;
}
