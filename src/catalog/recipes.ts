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

export type MatchStatus = "exact" | "substitution" | "variant" | "almost-there" | "missing";

export interface RecipeMatch {
  recipe: CatalogRecipe;
  status: MatchStatus;
  requiredCount: number;
  haveCount: number;
  missing: RecipeIngredient[];
  substitutions: string[];
  optionalMissing: RecipeIngredient[];
  variantRecipe?: CatalogRecipe;
  explanation: string;
}

const SUBSTITUTIONS: Record<string, string[]> = {
  "builtin:triple-sec": ["builtin:cointreau"],
  "builtin:cointreau": ["builtin:triple-sec"],
  "builtin:simple-syrup": ["builtin:agave-syrup", "builtin:honey-syrup"],
  "builtin:club-soda": ["builtin:tonic-water"],
  "builtin:white-rum": ["builtin:gold-rum"],
  "builtin:bourbon": ["builtin:rye-whiskey"],
  "builtin:rye-whiskey": ["builtin:bourbon"],
};

function directMatch(recipe: CatalogRecipe, have: Set<string>): RecipeMatch {
  const required = recipe.ingredients.filter((item) => !item.optional);
  const optionalMissing = recipe.ingredients.filter((item) => item.optional && !have.has(item.ingredientId));
  const missing: RecipeIngredient[] = [];
  const substitutions: string[] = [];
  let haveCount = 0;

  for (const item of required) {
    if (have.has(item.ingredientId)) {
      haveCount += 1;
      continue;
    }
    const substituteId = (SUBSTITUTIONS[item.ingredientId] ?? []).find((id) => have.has(id));
    if (substituteId) {
      haveCount += 1;
      const substituteName = substituteId.replace(/^builtin:/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      substitutions.push(`${item.ingredientName} → ${substituteName}`);
      continue;
    }
    missing.push(item);
  }

  if (missing.length === 0) {
    return {
      recipe,
      status: substitutions.length ? "substitution" : "exact",
      requiredCount: required.length,
      haveCount,
      missing,
      substitutions,
      optionalMissing,
      explanation: substitutions.length ? "You can make this using approved substitutions." : "You have all required ingredients.",
    };
  }
  if (missing.length === 1) {
    return {
      recipe,
      status: "almost-there",
      requiredCount: required.length,
      haveCount,
      missing,
      substitutions,
      optionalMissing,
      explanation: "You are one required ingredient short.",
    };
  }
  return {
    recipe,
    status: "missing",
    requiredCount: required.length,
    haveCount,
    missing,
    substitutions,
    optionalMissing,
    explanation: `You are missing ${missing.length} required ingredients.`,
  };
}

export function matchRecipes(recipes: CatalogRecipe[], inventoryIds: Iterable<string>): RecipeMatch[] {
  const have = new Set(inventoryIds);
  const parents = recipes.filter((recipe) => !recipe.parentKey);
  const variantsByParent = new Map<string, CatalogRecipe[]>();
  recipes.filter((recipe) => recipe.parentKey).forEach((recipe) => {
    const rows = variantsByParent.get(recipe.parentKey!) ?? [];
    rows.push(recipe);
    variantsByParent.set(recipe.parentKey!, rows);
  });

  const results = parents.map((recipe) => {
    const direct = directMatch(recipe, have);
    if (direct.status !== "missing") return direct;
    for (const variant of variantsByParent.get(recipe.key) ?? []) {
      const variantMatch = directMatch(variant, have);
      if (variantMatch.status === "exact" || variantMatch.status === "substitution") {
        return {
          ...direct,
          status: "variant" as const,
          substitutions: variantMatch.substitutions,
          optionalMissing: variantMatch.optionalMissing,
          variantRecipe: variant,
          explanation: `You can make the linked variant: ${variant.name}.`,
        };
      }
    }
    return direct;
  });

  const rank: Record<MatchStatus, number> = { exact: 0, substitution: 1, variant: 2, "almost-there": 3, missing: 4 };
  return results.sort((a, b) => rank[a.status] - rank[b.status] || a.recipe.name.localeCompare(b.recipe.name));
}
