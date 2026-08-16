export type InventoryContext = "my_bar" | "tonight_bar";

export interface InventoryItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  context: InventoryContext;
  contextId?: string;
  quantity?: number;
  unit?: string;
  have: boolean;
  notes?: string;
  updatedAt: string;
}

export interface InventoryShareFile {
  format: "virtual-bartender-inventory";
  version: 1;
  exportedAt: string;
  source: "my_bar" | "tonight_bar";
  name?: string;
  items: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity?: number;
    unit?: string;
    have: boolean;
    notes?: string;
  }>;
}
