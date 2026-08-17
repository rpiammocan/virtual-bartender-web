import { useState } from "react";
import { importRecipeFromUrl, scanRecipeCollection, type CollectionResult, type ImportDraft } from "../catalog/browserImporter";
import { createCustomRecipe, ingredientFromName, saveCustomRecipe } from "../storage/customRecipes";

type Props = { onHome: () => void; onBack: () => void; openRecipe: (key: string) => void };

export default function RecipeManagePage({ onHome, onBack, openRecipe }: Props) {
  const [mode,setMode]=useState<"single"|"bulk">("single");
  const [url,setUrl]=useState("");
  const [draft,setDraft]=useState<ImportDraft|null>(null);
  const [collection,setCollection]=useState<CollectionResult|null>(null);
  const [selected,setSelected]=useState<string[]>([]);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState("");
  const [savedKey,setSavedKey]=useState<string|null>(null);

  async function importRecipe(target=url){setBusy(true);setError("");setDraft(null);setSavedKey(null);try{setDraft(await importRecipeFromUrl(target));}catch(err){setError(err instanceof Error?err.message:"Import failed.");}finally{setBusy(false);}}
  async function scan(){setBusy(true);setError("");setCollection(null);setProgress("");try{const result=await scanRecipeCollection(url);setCollection(result);setSelected(result.recipes.map(r=>r.url));}catch(err){setError(err instanceof Error?err.message:"Collection scan failed.");}finally{setBusy(false);}}
  function updateIngredient(index:number,key:"quantity"|"unit"|"name",value:number|string|null){setDraft(current=>{if(!current)return current;const ingredients=[...current.ingredients];ingredients[index]={...ingredients[index],[key]:value};return{...current,ingredients};});}
  function saveDraft(item:ImportDraft){const recipe=createCustomRecipe({name:item.name,type:item.recipe_type,source:item.source_name,sourceUrl:item.source_url,instructions:item.instructions.join("\n"),ingredients:item.ingredients.filter(i=>i.name.trim()).map(i=>ingredientFromName(i.name,i.quantity??1,i.unit??"pc"))});saveCustomRecipe(recipe);return recipe.key;}
  function saveRecipe(){if(!draft?.name.trim())return;setError("");try{setSavedKey(saveDraft(draft));}catch(err){setError(err instanceof Error?err.message:"Unable to save recipe.");}}
  async function bulkImport(){setBusy(true);setError("");let done=0;let skipped=0;for(const target of selected){try{setProgress(`Importing ${done+skipped+1} of ${selected.length}…`);const item=await importRecipeFromUrl(target);if(item.possible_duplicates.some(d=>d.score>=95)){skipped++;continue;}saveDraft(item);done++;}catch{skipped++;}}setProgress(`Finished: ${done} imported, ${skipped} skipped/review needed.`);setBusy(false);}

  return <main className="page theme-recipes">
    <header className="app-header"><button className="back-button" onClick={onHome}>← Home</button><button className="back-button" onClick={onBack}>← Recipes</button><div className="page-heading"><span className="page-heading-icon">📖</span><h1>Import Recipe</h1></div></header>
    <div className="theme-prop recipe-ledger"><strong>Recipe Desk</strong><span>Add your own formula or bring in recipes from the outside.</span></div>
    <div className="toolbar"><button className={mode==="single"?"primary":""} onClick={()=>setMode("single")}>Single Recipe</button><button className={mode==="bulk"?"primary":""} onClick={()=>setMode("bulk")}>Bulk Import from Website</button></div>
    <p className="lede">{mode==="single"?"Paste one recipe URL. Review and edit everything before saving it locally.":"Paste a recipe collection page. Scan it, select recipes, and save them to your local Virtual Bartender browser database."}</p>
    <div className="toolbar"><input className="wide-input" placeholder="https://..." value={url} onChange={e=>setUrl(e.target.value)}/><button className="primary" disabled={busy||!url.trim()} onClick={()=>void(mode==="single"?importRecipe():scan())}>{busy?"Working…":mode==="single"?"Import & Review":"Scan Website"}</button></div>
    {error&&<p className="error">{error}</p>}

    {mode==="bulk"&&collection&&<section className="detail-card"><h2>{collection.count} recipes found</h2><div className="toolbar"><button onClick={()=>setSelected(collection.recipes.map(r=>r.url))}>Select All</button><button onClick={()=>setSelected([])}>Clear</button><button className="primary" disabled={busy||selected.length===0} onClick={()=>void bulkImport()}>Import Selected ({selected.length})</button></div><div className="result-list">{collection.recipes.map(item=><label className="recipe-card" key={item.url}><span><input type="checkbox" checked={selected.includes(item.url)} onChange={e=>setSelected(current=>e.target.checked?[...current,item.url]:current.filter(x=>x!==item.url))}/> {item.name}</span><small>{item.url}</small></label>)}</div>{progress&&<p className="success">{progress}</p>}</section>}

    {mode==="single"&&draft&&<section className="detail-card"><p className="eyebrow">Review import</p><label>Recipe name<input className="wide-input" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label> Type <select value={draft.recipe_type} onChange={e=>setDraft({...draft,recipe_type:e.target.value as "cocktail"|"mocktail"})}><option value="cocktail">Cocktail</option><option value="mocktail">Mocktail</option></select></label><p><strong>Source:</strong> {draft.source_name}</p>{draft.warnings.length>0&&<div className="notice">{draft.warnings.map(w=><p key={w}>{w}</p>)}</div>}<h3>Ingredients</h3><div className="import-ingredients">{draft.ingredients.map((item,index)=><div className="import-row" key={index}><input value={item.quantity??""} onChange={e=>updateIngredient(index,"quantity",e.target.value===""?null:Number(e.target.value))} placeholder="Qty"/><select value={item.unit??""} onChange={e=>updateIngredient(index,"unit",e.target.value||null)}><option value="">Unit</option><option value="oz">oz</option><option value="ml">ml</option><option value="tsp">tsp</option><option value="tbsp">tbsp</option><option value="dash">dash</option><option value="pc">pc</option><option value="cup">cup</option></select><input value={item.name} onChange={e=>updateIngredient(index,"name",e.target.value)} placeholder="Ingredient"/></div>)}</div><h3>Instructions</h3><textarea rows={8} value={draft.instructions.join("\n")} onChange={e=>setDraft({...draft,instructions:e.target.value.split("\n").filter(x=>x.trim())})}/>{draft.possible_duplicates.length>0&&<><h3>Possible duplicates</h3>{draft.possible_duplicates.map(dup=><p key={dup.key}>{dup.name} — {dup.score}% match</p>)}</>}<div className="toolbar"><button className="primary" disabled={busy||!draft.name.trim()} onClick={saveRecipe}>Save Recipe</button></div>{savedKey&&<p className="success">Recipe saved successfully. <button className="link-button" onClick={()=>openRecipe(savedKey)}>View Recipe</button></p>}</section>}
  </main>;
}
