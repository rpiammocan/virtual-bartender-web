import { BASE_RECIPES } from "./baseRecipes";
import type { CatalogRecipe } from "./recipes";

// Each migrated catalog generation is added here. Keeping the generations
// separate makes it easy to audit the browser catalog against the canonical
// Virtual Bartender source while exposing one list to the UI.
export const BUILTIN_RECIPES: CatalogRecipe[] = [
  ...BASE_RECIPES,
];

export const BUILTIN_RECIPES_BY_KEY = new Map(
  BUILTIN_RECIPES.map((recipe) => [recipe.key, recipe]),
);
