import { useEffect, useMemo, useState } from "react";
import { BUILTIN_RECIPES } from "../catalog/catalog";
import { matchRecipes, type RecipeMatch } from "../catalog/recipes";
import { getInventory } from "../storage/db";
import type { InventoryItem } from "../storage/types";

function MatchCard({ match }: { match: RecipeMatch }) {
  const label = match.status === "make-now" ? "Make Now" : match.status === "almost-there" ? "Almost There" : `Missing ${match.missing.length}`;
  return (
    <article className={`recipe-match recipe-match--${match.status}`}>
      <div>
        <h3>{match.recipe.name}</h3>
        <p>{match.recipe.description}</p>
      </div>
      <strong>{label}</strong>
      {match.missing.length > 0 && (
        <p>Missing: {match.missing.map((item) => item.ingredientName).join(", ")}</p>
      )}
      <details>
        <summary>Recipe</summary>
        <ul>
          {match.recipe.ingredients.map((item) => (
            <li key={`${match.recipe.key}-${item.ingredientId}`}>
              {item.quantity} {item.unit} {item.ingredientName}{item.optional ? " (optional)" : ""}
            </li>
          ))}
        </ul>
        <p>{match.recipe.instructions}</p>
      </details>
    </article>
  );
}

export default function WhatCanIMakePage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "make-now" | "almost-there">("all");

  useEffect(() => {
    getInventory("my_bar").then(setInventory).catch(console.error);
  }, []);

  const matches = useMemo(
    () => matchRecipes(BUILTIN_RECIPES, inventory.filter((item) => item.have).map((item) => item.ingredientId)),
    [inventory],
  );

  const visible = filter === "all" ? matches : matches.filter((match) => match.status === filter);
  const makeNow = matches.filter((match) => match.status === "make-now").length;
  const almost = matches.filter((match) => match.status === "almost-there").length;

  return (
    <main className="what-can-i-make-page">
      <header>
        <h1>What Can I Make?</h1>
        <p>Compared locally against the ingredients saved in My Bar.</p>
      </header>

      <nav aria-label="Recipe match filters">
        <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"}>All ({matches.length})</button>
        <button type="button" onClick={() => setFilter("make-now")} aria-pressed={filter === "make-now"}>Make Now ({makeNow})</button>
        <button type="button" onClick={() => setFilter("almost-there")} aria-pressed={filter === "almost-there"}>Almost There ({almost})</button>
      </nav>

      {inventory.length === 0 && <p>Add ingredients to My Bar to see what you can make.</p>}
      <section className="recipe-match-list">
        {visible.map((match) => <MatchCard key={match.recipe.key} match={match} />)}
      </section>
    </main>
  );
}
