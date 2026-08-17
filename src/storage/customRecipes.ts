import { BUILTIN_INGREDIENTS } from "../catalog/ingredients";
import type { CatalogRecipe, RecipeIngredient } from "../catalog/recipes";

const KEY = "virtual-bartender-custom-recipes";

function read(): CatalogRecipe[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as CatalogRecipe[]; }
  catch { return []; }
}
function write(items: CatalogRecipe[]) { localStorage.setItem(KEY, JSON.stringify(items)); }
function slug(value: string) { return value.trim().toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export function getCustomRecipes(): CatalogRecipe[] { return read(); }
export function getCustomRecipe(key: string): CatalogRecipe | undefined { return read().find((item) => item.key === key); }
export function saveCustomRecipe(recipe: CatalogRecipe) {
  const items = read();
  const index = items.findIndex((item) => item.key === recipe.key);
  if (index >= 0) items[index] = recipe; else items.push(recipe);
  write(items);
}
export function deleteCustomRecipe(key: string) { write(read().filter((item) => item.key !== key)); }

export function ingredientFromName(name: string, quantity = 1, unit = "pc", optional = false): RecipeIngredient {
  const normalized = name.trim().toLowerCase();
  const builtIn = BUILTIN_INGREDIENTS.find((item) => item.name.toLowerCase() === normalized);
  return {
    ingredientId: builtIn?.id ?? `user:${slug(name) || crypto.randomUUID()}`,
    ingredientName: name.trim(),
    quantity,
    unit,
    optional,
  };
}

export function createCustomRecipe(input: {
  name: string;
  type: "cocktail" | "mocktail";
  description?: string;
  instructions?: string;
  source?: string;
  sourceUrl?: string;
  ingredients: RecipeIngredient[];
}): CatalogRecipe {
  return {
    key: `user:${crypto.randomUUID()}`,
    name: input.name.trim(),
    type: input.type,
    version: "user",
    description: input.description?.trim() ?? "",
    instructions: input.instructions?.trim() ?? "",
    source: input.source?.trim() || "User Added",
    sourceUrl: input.sourceUrl?.trim() || "",
    ingredients: input.ingredients,
  };
}
