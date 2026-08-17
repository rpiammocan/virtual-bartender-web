import { useEffect, useMemo, useState } from "react";
import { BUILTIN_RECIPES } from "../catalog/catalog";
import { matchRecipes } from "../catalog/recipes";
import { getInventory } from "../storage/db";
import { applyRecipeOverride, isRecipeHidden } from "../storage/recipeUserData";
import type { InventoryItem } from "../storage/types";

type Props = { onHome: () => void; openRecipe: (key: string) => void };
type Session = { id: string; name: string; session_date: string };
const SESSION_KEY = "virtual-bartender-tonights-bar-sessions";

function readSessions(): Session[] {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "[]") as Session[]; }
  catch { return []; }
}

export default function SurprisePage({ onHome, openRecipe }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [context, setContext] = useState("my_bar");
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { setSessions(readSessions()); }, []);
  const tonight = sessions[0] ?? null;
  const result = useMemo(() => resultKey ? BUILTIN_RECIPES.find(r => r.key === resultKey) ?? null : null, [resultKey]);

  async function surprise() {
    try {
      setError("");
      let inventory: InventoryItem[];
      if (context === "my_bar") inventory = await getInventory("my_bar");
      else {
        if (!tonight) throw new Error("Create a Tonight's Bar first.");
        inventory = await getInventory("tonight_bar", tonight.id);
      }

      const available = inventory.filter(i => i.have).map(i => i.ingredientId);
      const eligible = matchRecipes(
        BUILTIN_RECIPES.filter(recipe => !isRecipeHidden(recipe.key)),
        available,
      ).filter(match => match.status === "exact" || match.status === "substitution" || match.status === "variant");

      if (!eligible.length) throw new Error("No eligible drinks found.");
      const picked = eligible[Math.floor(Math.random() * eligible.length)].recipe;
      setResultKey(picked.key);
    } catch (err) {
      setResultKey(null);
      setError(err instanceof Error ? err.message : "No eligible drinks found.");
    }
  }

  const displayRecipe = result ? applyRecipeOverride(result) : null;

  return (
    <main className="page">
      <header className="app-header"><button className="back-button" onClick={onHome}>← Home</button><div className="page-heading"><span className="page-heading-icon">🎲</span><h1>Surprise Me</h1></div></header>
      <div className="toolbar"><select value={context} onChange={(e) => setContext(e.target.value)}><option value="my_bar">My Bar</option><option value="tonight" disabled={!tonight}>Tonight's Bar</option></select><button className="primary" onClick={() => void surprise()}>Surprise Me</button></div>
      {displayRecipe && <section className="surprise-card"><p className="eyebrow">Your drink</p><h2>{displayRecipe.name}</h2><p>Picked at random from drinks you can make with the selected bar.</p><button onClick={() => openRecipe(displayRecipe.key)}>View Recipe</button></section>}
      {error && <p className="error">{error}</p>}
    </main>
  );
}
