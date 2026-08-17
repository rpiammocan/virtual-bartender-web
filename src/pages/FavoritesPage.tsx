import { useMemo } from "react";
import { BUILTIN_RECIPES } from "../catalog/catalog";
import { applyRecipeOverride, getFavorites, isRecipeHidden } from "../storage/recipeUserData";

type Props = { onHome: () => void; openRecipe: (key: string) => void };

export default function FavoritesPage({ onHome, openRecipe }: Props) {
  const items = useMemo(() => {
    const favorites = new Set(getFavorites());
    return BUILTIN_RECIPES
      .filter((recipe) => favorites.has(recipe.key) && !isRecipeHidden(recipe.key))
      .map(applyRecipeOverride)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  return (
    <main className="page">
      <header className="app-header">
        <button className="back-button" onClick={onHome}>← Home</button>
        <div className="page-heading"><span className="page-heading-icon">♥</span><h1>Favorites</h1></div>
      </header>
      <div className="result-list">
        {items.map((item) => (
          <button className="recipe-list-button" key={item.key} onClick={() => openRecipe(item.key)}>
            <strong>{item.name}</strong>
          </button>
        ))}
        {items.length === 0 && <p className="empty-state">No favorites yet.</p>}
      </div>
    </main>
  );
}
