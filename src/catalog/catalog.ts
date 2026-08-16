import { BASE_RECIPES } from "./baseRecipes";
import { RECIPES_V2 } from "./catalogV2";
import { RECIPES_V3 } from "./catalogV3";
import { RECIPES_V4 } from "./catalogV4";
import type { CatalogRecipe } from "./recipes";

// Each migrated catalog generation is kept separate so it can be audited
// against the canonical Virtual Bartender source while the UI sees one list.
export const BUILTIN_RECIPES: CatalogRecipe[] = [
  ...BASE_RECIPES,
  ...RECIPES_V2,
  ...RECIPES_V3,
  ...RECIPES_V4,
];

export const BUILTIN_RECIPES_BY_KEY = new Map(
  BUILTIN_RECIPES.map((recipe) => [recipe.key, recipe]),
);
