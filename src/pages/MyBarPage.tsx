import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { BUILTIN_INGREDIENTS, type CatalogIngredient } from "../catalog/ingredients";
import {
  getInventory,
  putInventoryItem,
  removeInventoryItem,
  updateInventoryQuantity,
} from "../storage/db";
import {
  buildInventoryShareFile,
  downloadInventoryShareFile,
  IMPORT_OVERWRITE_WARNING,
  importInventoryShareFile,
  parseInventoryShareFile,
} from "../storage/inventoryShare";
import type { InventoryItem } from "../storage/types";

type Props = { onHome: () => void };

function slug(value: string): string {
  return value.trim().toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function MyBarPage({ onHome }: Props) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      setError("");
      setInventory(await getInventory("my_bar"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load My Bar.");
    }
  }

  useEffect(() => { void load(); }, []);

  const usedIds = useMemo(() => new Set(inventory.map((item) => item.ingredientId)), [inventory]);
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return BUILTIN_INGREDIENTS
      .filter((item) => !usedIds.has(item.id))
      .filter((item) => item.name.toLowerCase().includes(value))
      .slice(0, 20);
  }, [query, usedIds]);
  const exactCatalogMatch = useMemo(
    () => BUILTIN_INGREDIENTS.some((item) => item.name.toLowerCase() === query.trim().toLowerCase()),
    [query],
  );

  async function addCatalogIngredient(ingredient: CatalogIngredient) {
    const item: InventoryItem = {
      id: `my_bar:default:${ingredient.id}`,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      context: "my_bar",
      have: true,
      updatedAt: new Date().toISOString(),
    };
    await putInventoryItem(item);
    setQuery("");
    setNotice(`${ingredient.name} added to My Bar.`);
    await load();
  }

  async function addManualIngredient() {
    const ingredientName = query.trim();
    if (!ingredientName || exactCatalogMatch) return;
    const ingredientId = `user:${slug(ingredientName) || crypto.randomUUID()}`;
    const item: InventoryItem = {
      id: `my_bar:default:${ingredientId}`,
      ingredientId,
      ingredientName,
      context: "my_bar",
      have: true,
      updatedAt: new Date().toISOString(),
    };
    await putInventoryItem(item);
    setQuery("");
    setNotice(`${ingredientName} added to My Bar as a custom ingredient.`);
    await load();
  }

  async function exportInventory() {
    const data = await buildInventoryShareFile("my_bar", undefined, "My Bar");
    downloadInventoryShareFile(data);
    setNotice(`Exported ${data.items.length} inventory item${data.items.length === 1 ? "" : "s"}.`);
  }

  async function importInventory(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const data = parseInventoryShareFile(await file.text());
      if (!window.confirm(IMPORT_OVERWRITE_WARNING)) return;
      const count = await importInventoryShareFile(data, "my_bar");
      setNotice(`Imported ${count} inventory item${count === 1 ? "" : "s"}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import inventory.");
    }
  }

  return (
    <main className="page">
      <header className="app-header">
        <button onClick={onHome} aria-label="Return home">Home</button>
        <h1>My Bar</h1>
      </header>
      <p className="lede">Your permanent inventory. It is stored locally in this browser.</p>

      <section className="inventory-share" aria-label="Inventory import and export">
        <button type="button" onClick={exportInventory}>Export Inventory</button>
        <button type="button" onClick={() => fileInput.current?.click()}>Import Inventory</button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importInventory} />
        <small>Import replaces your current My Bar inventory. Export first if you want to keep a copy.</small>
      </section>

      <section className="picker">
        <label htmlFor="ingredient-search">Add ingredient</label>
        <input
          id="ingredient-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search bourbon, tonic, lime..."
          autoComplete="off"
        />
        {query.trim() && (
          <div className="picker-results">
            {results.map((ingredient) => (
              <button type="button" key={ingredient.id} onClick={() => void addCatalogIngredient(ingredient)}>
                <span>{ingredient.name}</span>
                <small>{ingredient.category}</small>
              </button>
            ))}
            {!exactCatalogMatch && (
              <button type="button" className="manual-add" onClick={() => void addManualIngredient()}>
                <span>Add “{query.trim()}” manually</span>
                <small>User-created ingredient</small>
              </button>
            )}
          </div>
        )}
      </section>

      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      <section className="inventory-list">
        {inventory.length === 0 ? (
          <p className="empty-state">Your bar is empty. Add your first ingredient above or import an inventory.</p>
        ) : inventory.map((item) => (
          <article className="inventory-row" key={item.id}>
            <div className="inventory-main">
              <strong>{item.ingredientName}</strong>
              <small>{item.quantity == null ? "Quantity optional" : `Quantity: ${item.quantity}`}</small>
            </div>
            <input
              aria-label={`Quantity of ${item.ingredientName}`}
              type="number"
              min="0"
              step="any"
              value={item.quantity ?? ""}
              placeholder="Qty"
              onChange={async (event) => {
                const value = event.target.value === "" ? undefined : Number(event.target.value);
                await updateInventoryQuantity(item.id, value);
                await load();
              }}
            />
            <button className="danger-link" onClick={async () => { await removeInventoryItem(item.id); await load(); }}>
              Remove
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
