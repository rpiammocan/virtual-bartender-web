import { useEffect, useMemo, useState } from "react";
import { BUILTIN_INGREDIENTS } from "../catalog/ingredients";
import { BUILTIN_RECIPES } from "../catalog/catalog";
import { getInventory } from "../storage/db";
import { addShoppingItem, getShoppingItems, markShoppingPurchased, removeShoppingItem, type ShoppingItem } from "../storage/shoppingData";

type Props = { onHome: () => void };
type Suggestion = { ingredientId: string; ingredientName: string; category: string; unlocks: string[] };

export default function ShoppingPage({ onHome }: Props) {
  const [items,setItems]=useState<ShoppingItem[]>([]); const [suggestions,setSuggestions]=useState<Suggestion[]>([]); const [name,setName]=useState("");
  async function load(){
    const shopping=getShoppingItems(); setItems(shopping);
    const inventory=await getInventory("my_bar"); const have=new Set(inventory.filter(i=>i.have).map(i=>i.ingredientId));
    const existingIds=new Set(shopping.map(i=>i.ingredientId).filter(Boolean)); const existingNames=new Set(shopping.map(i=>i.name.toLowerCase()));
    const map=new Map<string,Suggestion>();
    for(const recipe of BUILTIN_RECIPES){ const required=recipe.ingredients.filter(i=>!i.optional); const missing=required.filter(i=>!have.has(i.ingredientId)); if(missing.length!==1)continue; const m=missing[0]; if(existingIds.has(m.ingredientId)||existingNames.has(m.ingredientName.toLowerCase()))continue; const ingredient=BUILTIN_INGREDIENTS.find(i=>i.id===m.ingredientId); const current=map.get(m.ingredientId)??{ingredientId:m.ingredientId,ingredientName:m.ingredientName,category:ingredient?.category??"Other",unlocks:[]}; current.unlocks.push(recipe.name); map.set(m.ingredientId,current); }
    setSuggestions([...map.values()].sort((a,b)=>b.unlocks.length-a.unlocks.length||a.ingredientName.localeCompare(b.ingredientName)));
  }
  useEffect(()=>{void load()},[]);
  const grouped=useMemo(()=>items.reduce<Record<string,ShoppingItem[]>>((acc,item)=>{(acc[item.category||"Other"]??=[]).push(item);return acc},{}),[items]);
  return <main className="page">
    <header className="app-header"><button className="back-button" onClick={onHome}>← Home</button><div className="page-heading"><span className="page-heading-icon">🛒</span><h1>Shopping List</h1></div></header>
    <div className="toolbar no-print"><input className="wide-input" placeholder="Add item manually..." value={name} onChange={e=>setName(e.target.value)}/><button className="primary" onClick={()=>{if(!name.trim())return;addShoppingItem({name:name.trim(),category:"Other"});setName("");void load()}}>Add</button><button onClick={()=>window.print()}>Print Shopping List</button></div>
    <section className="shopping-list-print-area"><h1 className="print-only">Shopping List</h1>{items.length===0?<p className="empty-state">Your shopping list is empty.</p>:Object.entries(grouped).map(([category,rows])=><section className="result-section" key={category}><h2>{category}</h2><div className="inventory-list">{rows.map(item=><article className="inventory-row" key={item.id}><label className="shopping-label"><input type="checkbox" checked={item.purchased} onChange={e=>{markShoppingPurchased(item.id,e.target.checked);void load()}}/><span className={item.purchased?"purchased":""}>{item.name}</span></label><button className="danger-link no-print" onClick={()=>{removeShoppingItem(item.id);void load()}}>Remove</button></article>)}</div></section>)}</section>
    <section className="result-section no-print"><h2>Suggested Items</h2><div className="result-list">{suggestions.length===0?<p className="empty-state">No smart suggestions yet.</p>:suggestions.map(item=><article className="recipe-card" key={item.ingredientId}><div><strong>{item.ingredientName}</strong><p>Unlocks {item.unlocks.length} recipe{item.unlocks.length===1?"":"s"}</p><small>{item.unlocks.join(", ")}</small></div><button onClick={()=>{addShoppingItem({ingredientId:item.ingredientId,name:item.ingredientName,category:item.category});void load()}}>+ Add</button></article>)}</div></section>
  </main>;
}
