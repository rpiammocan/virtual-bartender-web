import type { CatalogRecipe } from "../catalog/recipes";

const FAVORITES = "virtual-bartender-favorites";
const HISTORY = "virtual-bartender-history";
const OVERRIDES = "virtual-bartender-recipe-overrides";
const HIDDEN = "virtual-bartender-hidden-recipes";

export type HistoryEntry = {
  id: string;
  recipeKey: string;
  recipeName: string;
  rating: number;
  notes?: string;
  madeAt: string;
};

export type RecipeOverride = Partial<Pick<CatalogRecipe, "name" | "description" | "type" | "instructions">>;

function readJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}
function writeJson(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }

export function getFavorites(): string[] { return readJson<string[]>(FAVORITES, []); }
export function isFavorite(key: string): boolean { return getFavorites().includes(key); }
export function setFavorite(key: string, favorite: boolean) {
  const set = new Set(getFavorites()); favorite ? set.add(key) : set.delete(key); writeJson(FAVORITES, [...set]);
}

export function getHistory(): HistoryEntry[] { return readJson<HistoryEntry[]>(HISTORY, []); }
export function addHistory(entry: Omit<HistoryEntry, "id" | "madeAt">) {
  const next: HistoryEntry = { ...entry, id: crypto.randomUUID(), madeAt: new Date().toISOString() };
  writeJson(HISTORY, [next, ...getHistory()]);
}

export function getOverrides(): Record<string, RecipeOverride> { return readJson<Record<string, RecipeOverride>>(OVERRIDES, {}); }
export function saveRecipeOverride(key: string, override: RecipeOverride) { writeJson(OVERRIDES, { ...getOverrides(), [key]: override }); }
export function applyRecipeOverride(recipe: CatalogRecipe): CatalogRecipe { return { ...recipe, ...(getOverrides()[recipe.key] || {}) }; }

export function getHiddenRecipes(): string[] { return readJson<string[]>(HIDDEN, []); }
export function hideRecipe(key: string) { const set = new Set(getHiddenRecipes()); set.add(key); writeJson(HIDDEN, [...set]); }
export function isRecipeHidden(key: string): boolean { return getHiddenRecipes().includes(key); }
