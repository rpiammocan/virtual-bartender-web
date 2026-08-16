// Generated browser catalog helpers. Recipe data is migrated from the canonical Virtual Bartender catalog.
import type { CatalogRecipe } from "./recipes";

export function ingredientId(name: string): string {
  return `builtin:${name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function recipe(
  key: string,
  name: string,
  type: "cocktail" | "mocktail",
  description: string,
  instructions: string,
  source: string,
  sourceUrl: string,
  ingredients: Array<[string, number, string, boolean]>,
  parentKey?: string,
): CatalogRecipe {
  return {
    key, name, type, version: "1.0", description, instructions, source, sourceUrl, parentKey,
    ingredients: ingredients.map(([ingredientName, quantity, unit, optional]) => ({
      ingredientId: ingredientId(ingredientName), ingredientName, quantity, unit, optional,
    })),
  };
}
