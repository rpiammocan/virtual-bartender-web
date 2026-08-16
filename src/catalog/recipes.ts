export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  optional: boolean;
}

export interface CatalogRecipe {
  key: string;
  name: string;
  type: "cocktail" | "mocktail";
  version: string;
  description: string;
  instructions: string;
  source: string;
  sourceUrl: string;
  parentKey?: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeMatch {
  recipe: CatalogRecipe;
  status: "make-now" | "almost-there" | "missing";
  requiredCount: number;
  haveCount: number;
  missing: RecipeIngredient[];
}

export function matchRecipes(recipes: CatalogRecipe[], inventoryIds: Iterable<string>): RecipeMatch[] {
  const have = new Set(inventoryIds);
  return recipes.map((recipe) => {
    const required = recipe.ingredients.filter((item) => !item.optional);
    const missing = required.filter((item) => !have.has(item.ingredientId));
    const status: RecipeMatch["status"] = missing.length === 0 ? "make-now" : missing.length === 1 ? "almost-there" : "missing";
    return { recipe, status, requiredCount: required.length, haveCount: required.length - missing.length, missing };
  }).sort((a, b) => {
    const rank = { "make-now": 0, "almost-there": 1, missing: 2 } as const;
    return rank[a.status] - rank[b.status] || a.missing.length - b.missing.length || a.recipe.name.localeCompare(b.recipe.name);
  });
}
