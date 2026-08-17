import { useEffect, useMemo, useState } from "react";
import { BUILTIN_RECIPES } from "../catalog/catalog";
import { matchRecipes, type RecipeMatch } from "../catalog/recipes";
import { getInventory } from "../storage/db";
import type { InventoryItem } from "../storage/types";

function MatchCard({ match }: { match: RecipeMatch }) {
  const label = match.status === "make-now" ? "Make Now" : match.status === "almost-there" ? "Almost There" : `Missing ${match.missing.length}`;
  return (
    <article className={`recipe-match recipe-match--${match.status}`}>
      <div><h3>{match.recipe.name}</h3><p>{match.recipe.description}</p></div>
      <strong>{label}</strong>
      {match.missing.length > 0 && <p>Missing: {match.missing.map((item) => item.ingredientName).join(", ")}</p>}
      <details><summary>Recipe</summary><ul>{match.recipe.ingredients.map((item) => <li key={`${match.recipe.key}-${item.ingredientId}`}>{item.quantity} {item.unit} {item.ingredientName}{item.optional ? " (optional)" : ""}</li>)}</ul><p>{match.recipe.instructions}</p></details>
    </article>
  );
}

export default function WhatCanIMakePage({ onHome }: { onHome: () => void }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "make-now" | "almost-there">("all");
  useEffect(() => { getInventory("my_bar").then(setInventory).catch(console.error); }, []);
  const matches = useMemo(() => matchRecipes(BUILTIN_RECIPES, inventory.filter((item) => item.have).map((item) => item.ingredientId)), [inventory]);
  const visible = filter === "all" ? matches : matches.filter((match) => match.status === filter);
  const makeNow = matches.filter((match) => match.status === "make-now").length;
  const almost = matches.filter((match) => match.status === "almost-there").length;

  return <main className="page">
    <header className="app-header"><button className="back-button" onClick={onHome}>← Home</button><div className="page-heading"><span className="page-heading-icon">🍸</span><h1>What Can I Make?</h1></div></header>
    <p className="lede">Find drinks based on your current bar.</p>
    <div className="toolbar" aria-label="Recipe match filters">
      <button type="button" onClick={() => setFilter("all")}>All ({matches.length})</button>
      <button type="button" onClick={() => setFilter("make-now")}>Make Now ({makeNow})</button>
      <button type="button" onClick={() => setFilter("almost-there")}>Almost There ({almost})</button>
    </div>
    {inventory.length === 0 && <p className="empty-state">Add ingredients to My Bar to see what you can make.</p>}
    <section className="recipe-match-list">{visible.map((match) => <MatchCard key={match.recipe.key} match={match} />)}</section>
  </main>;
}
