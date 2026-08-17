import { useState } from "react";
import {
  importRecipeFromUrl,
  scanRecipeCollection,
  type CollectionResult,
  type ImportDraft,
} from "../catalog/browserImporter";
import {
  createCustomRecipe,
  ingredientFromName,
  saveCustomRecipe,
} from "../storage/customRecipes";

type Props = {
  onHome: () => void;
  onBack: () => void;
  openRecipe: (key: string) => void;
};

type Mode = "manual" | "single" | "bulk";
type ManualIngredient = { quantity: string; unit: string; name: string };

export default function RecipeManagePage({ onHome, onBack, openRecipe }: Props) {
  const [mode, setMode] = useState<Mode>("manual");
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [collection, setCollection] = useState<CollectionResult | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const [manualName, setManualName] = useState("");
  const [manualType, setManualType] = useState<"cocktail" | "mocktail">("cocktail");
  const [manualInstructions, setManualInstructions] = useState("");
  const [manualIngredients, setManualIngredients] = useState<ManualIngredient[]>([
    { quantity: "1", unit: "oz", name: "" },
  ]);

  async function importRecipe(target = url) {
    setBusy(true);
    setError("");
    setDraft(null);
    setSavedKey(null);
    try {
      setDraft(await importRecipeFromUrl(target));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  async function scan() {
    setBusy(true);
    setError("");
    setCollection(null);
    setProgress("");
    try {
      const result = await scanRecipeCollection(url);
      setCollection(result);
      setSelected(result.recipes.map((recipe) => recipe.url));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Collection scan failed.");
    } finally {
      setBusy(false);
    }
  }

  function updateIngredient(
    index: number,
    key: "quantity" | "unit" | "name",
    value: number | string | null,
  ) {
    setDraft((current) => {
      if (!current) return current;
      const ingredients = [...current.ingredients];
      ingredients[index] = { ...ingredients[index], [key]: value };
      return { ...current, ingredients };
    });
  }

  function saveDraft(item: ImportDraft) {
    const recipe = createCustomRecipe({
      name: item.name,
      type: item.recipe_type,
      source: item.source_name,
      sourceUrl: item.source_url,
      instructions: item.instructions.join("\n"),
      ingredients: item.ingredients
        .filter((ingredient) => ingredient.name.trim())
        .map((ingredient) =>
          ingredientFromName(
            ingredient.name,
            ingredient.quantity ?? 1,
            ingredient.unit ?? "pc",
          ),
        ),
    });
    saveCustomRecipe(recipe);
    return recipe.key;
  }

  function saveRecipe() {
    if (!draft?.name.trim()) return;
    setError("");
    try {
      setSavedKey(saveDraft(draft));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save recipe.");
    }
  }

  async function bulkImport() {
    setBusy(true);
    setError("");
    let done = 0;
    let skipped = 0;

    for (const target of selected) {
      try {
        setProgress(`Importing ${done + skipped + 1} of ${selected.length}…`);
        const item = await importRecipeFromUrl(target);
        if (item.possible_duplicates.some((duplicate) => duplicate.score >= 95)) {
          skipped += 1;
          continue;
        }
        saveDraft(item);
        done += 1;
      } catch {
        skipped += 1;
      }
    }

    setProgress(`Finished: ${done} imported, ${skipped} skipped/review needed.`);
    setBusy(false);
  }

  function updateManualIngredient(
    index: number,
    key: keyof ManualIngredient,
    value: string,
  ) {
    setManualIngredients((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  }

  function saveManual() {
    setError("");
    setSavedKey(null);
    const valid = manualIngredients.filter((item) => item.name.trim());

    if (!manualName.trim() || valid.length === 0) {
      setError("Enter a recipe name and at least one ingredient.");
      return;
    }

    try {
      const recipe = createCustomRecipe({
        name: manualName.trim(),
        type: manualType,
        instructions: manualInstructions.trim(),
        source: "Manual Entry",
        ingredients: valid.map((item) =>
          ingredientFromName(
            item.name,
            Number(item.quantity) || 1,
            item.unit || "pc",
          ),
        ),
      });
      saveCustomRecipe(recipe);
      setSavedKey(recipe.key);
      setManualName("");
      setManualType("cocktail");
      setManualInstructions("");
      setManualIngredients([{ quantity: "1", unit: "oz", name: "" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save recipe.");
    }
  }

  return (
    <main className="page theme-recipes">
      <header className="app-header">
        <button className="back-button" onClick={onHome}>← Home</button>
        <button className="back-button" onClick={onBack}>← Recipes</button>
        <div className="page-heading">
          <span className="page-heading-icon">📖</span>
          <h1>Add / Import Recipe</h1>
        </div>
      </header>

      <div className="theme-prop recipe-ledger">
        <strong>Recipe Desk</strong>
        <span>Type your own recipe or bring in recipes from the outside.</span>
      </div>

      <div className="toolbar">
        <button className={mode === "manual" ? "primary" : ""} onClick={() => setMode("manual")}>Add Recipe Manually</button>
        <button className={mode === "single" ? "primary" : ""} onClick={() => setMode("single")}>Import One Recipe</button>
        <button className={mode === "bulk" ? "primary" : ""} onClick={() => setMode("bulk")}>Bulk Import from Website</button>
      </div>

      <p className="lede">
        {mode === "manual"
          ? "Enter the same recipe details you would review after an import, but type them in yourself."
          : mode === "single"
            ? "Paste one recipe URL. Review and edit everything before saving it locally."
            : "Paste a recipe collection page. Scan it, select recipes, and save them to your local Virtual Bartender browser database."}
      </p>

      {mode !== "manual" && (
        <div className="toolbar">
          <input className="wide-input" placeholder="https://..." value={url} onChange={(event) => setUrl(event.target.value)} />
          <button
            className="primary"
            disabled={busy || !url.trim()}
            onClick={() => {
              if (mode === "single") void importRecipe();
              else void scan();
            }}
          >
            {busy ? "Working…" : mode === "single" ? "Import & Review" : "Scan Website"}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {mode === "manual" && (
        <section className="detail-card">
          <p className="eyebrow">Add Recipe Manually</p>
          <label>
            Recipe name
            <input className="wide-input" value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="Recipe name" />
          </label>
          <label>
            Type
            <select value={manualType} onChange={(event) => setManualType(event.target.value as "cocktail" | "mocktail")}>
              <option value="cocktail">Cocktail</option>
              <option value="mocktail">Mocktail</option>
            </select>
          </label>

          <h3>Ingredients</h3>
          <div className="import-ingredients">
            {manualIngredients.map((item, index) => (
              <div className="import-row" key={index}>
                <input value={item.quantity} onChange={(event) => updateManualIngredient(index, "quantity", event.target.value)} placeholder="Qty" />
                <select value={item.unit} onChange={(event) => updateManualIngredient(index, "unit", event.target.value)}>
                  <option value="oz">oz</option>
                  <option value="ml">ml</option>
                  <option value="tsp">tsp</option>
                  <option value="tbsp">tbsp</option>
                  <option value="dash">dash</option>
                  <option value="pc">pc</option>
                  <option value="cup">cup</option>
                </select>
                <input value={item.name} onChange={(event) => updateManualIngredient(index, "name", event.target.value)} placeholder="Ingredient" />
                <button className="danger-link" type="button" onClick={() => setManualIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <button type="button" onClick={() => setManualIngredients((current) => [...current, { quantity: "1", unit: "oz", name: "" }])}>+ Ingredient</button>
          </div>

          <h3>Instructions</h3>
          <textarea rows={8} value={manualInstructions} onChange={(event) => setManualInstructions(event.target.value)} placeholder="Mixing instructions" />
          <div className="toolbar">
            <button className="primary" onClick={saveManual}>Save Recipe</button>
          </div>
          {savedKey && (
            <p className="success">
              Recipe saved successfully. <button className="link-button" onClick={() => openRecipe(savedKey)}>View Recipe</button>
            </p>
          )}
        </section>
      )}

      {mode === "bulk" && collection && (
        <section className="detail-card">
          <h2>{collection.count} recipes found</h2>
          <div className="toolbar">
            <button onClick={() => setSelected(collection.recipes.map((recipe) => recipe.url))}>Select All</button>
            <button onClick={() => setSelected([])}>Clear</button>
            <button className="primary" disabled={busy || selected.length === 0} onClick={() => void bulkImport()}>Import Selected ({selected.length})</button>
          </div>
          <div className="result-list">
            {collection.recipes.map((item) => (
              <label className="recipe-card" key={item.url}>
                <span>
                  <input
                    type="checkbox"
                    checked={selected.includes(item.url)}
                    onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.url] : current.filter((value) => value !== item.url))}
                  /> {item.name}
                </span>
                <small>{item.url}</small>
              </label>
            ))}
          </div>
          {progress && <p className="success">{progress}</p>}
        </section>
      )}

      {mode === "single" && draft && (
        <section className="detail-card">
          <p className="eyebrow">Review import</p>
          <label>
            Recipe name
            <input className="wide-input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label>
            Type
            <select value={draft.recipe_type} onChange={(event) => setDraft({ ...draft, recipe_type: event.target.value as "cocktail" | "mocktail" })}>
              <option value="cocktail">Cocktail</option>
              <option value="mocktail">Mocktail</option>
            </select>
          </label>
          <p><strong>Source:</strong> {draft.source_name}</p>
          {draft.warnings.length > 0 && (
            <div className="notice">{draft.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>
          )}

          <h3>Ingredients</h3>
          <div className="import-ingredients">
            {draft.ingredients.map((item, index) => (
              <div className="import-row" key={index}>
                <input value={item.quantity ?? ""} onChange={(event) => updateIngredient(index, "quantity", event.target.value === "" ? null : Number(event.target.value))} placeholder="Qty" />
                <select value={item.unit ?? ""} onChange={(event) => updateIngredient(index, "unit", event.target.value || null)}>
                  <option value="">Unit</option>
                  <option value="oz">oz</option>
                  <option value="ml">ml</option>
                  <option value="tsp">tsp</option>
                  <option value="tbsp">tbsp</option>
                  <option value="dash">dash</option>
                  <option value="pc">pc</option>
                  <option value="cup">cup</option>
                </select>
                <input value={item.name} onChange={(event) => updateIngredient(index, "name", event.target.value)} placeholder="Ingredient" />
              </div>
            ))}
          </div>

          <h3>Instructions</h3>
          <textarea rows={8} value={draft.instructions.join("\n")} onChange={(event) => setDraft({ ...draft, instructions: event.target.value.split("\n").filter((line) => line.trim()) })} />
          <div className="toolbar">
            <button className="primary" disabled={busy || !draft.name.trim()} onClick={saveRecipe}>Save Recipe</button>
          </div>
          {savedKey && (
            <p className="success">
              Recipe saved successfully. <button className="link-button" onClick={() => openRecipe(savedKey)}>View Recipe</button>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
