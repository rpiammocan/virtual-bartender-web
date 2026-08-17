import { useEffect, useMemo, useState } from "react";
import { BUILTIN_INGREDIENTS, type CatalogIngredient } from "../catalog/ingredients";
import { getInventory, putInventoryItem, removeInventoryItem, replaceInventory, updateInventoryQuantity } from "../storage/db";
import type { InventoryItem } from "../storage/types";

type Props = { onHome: () => void };

function todayLocal() { return new Date().toISOString().slice(0, 10); }
function slug(value: string) { return value.trim().toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
const SESSION_KEY = "virtual-bartender-tonights-bar-sessions";
type Session = { id: string; name: string; session_date: string };
function readSessions(): Session[] { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "[]") as Session[]; } catch { return []; } }
function writeSessions(items: Session[]) { localStorage.setItem(SESSION_KEY, JSON.stringify(items)); }

export default function TonightsBarPage({ onHome }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function loadInventory(id: string | null) { setInventory(id ? await getInventory("tonight_bar", id) : []); }
  useEffect(() => { const items = readSessions(); setSessions(items); if (items.length) setSelected(items[0].id); }, []);
  useEffect(() => { void loadInventory(selected).catch((err) => setError(err instanceof Error ? err.message : "Unable to load session inventory.")); }, [selected]);

  const usedIds = useMemo(() => new Set(inventory.map((item) => item.ingredientId)), [inventory]);
  const results = useMemo(() => { const value=query.trim().toLowerCase(); if(!value) return []; return BUILTIN_INGREDIENTS.filter(i=>!usedIds.has(i.id)&&i.name.toLowerCase().includes(value)).slice(0,20); }, [query,usedIds]);

  function createSession() { const created={id:crypto.randomUUID(),name:"Tonight's Bar",session_date:todayLocal()}; const next=[created,...sessions]; writeSessions(next); setSessions(next); setSelected(created.id); }
  async function addIngredient(ingredient: CatalogIngredient) { if(!selected)return; await putInventoryItem({id:`tonight_bar:${selected}:${ingredient.id}`,ingredientId:ingredient.id,ingredientName:ingredient.name,context:"tonight_bar",contextId:selected,have:true,updatedAt:new Date().toISOString()}); setQuery(""); await loadInventory(selected); }
  async function addManualIngredient() { if(!selected||!query.trim())return; const name=query.trim(); const id=`user:${slug(name)||crypto.randomUUID()}`; await putInventoryItem({id:`tonight_bar:${selected}:${id}`,ingredientId:id,ingredientName:name,context:"tonight_bar",contextId:selected,have:true,updatedAt:new Date().toISOString()}); setQuery(""); await loadInventory(selected); }
  async function copyMyBar() { if(!selected)return; const source=await getInventory("my_bar"); const now=new Date().toISOString(); await replaceInventory("tonight_bar",source.map(i=>({...i,id:`tonight_bar:${selected}:${i.ingredientId}`,context:"tonight_bar",contextId:selected,updatedAt:now})),selected); await loadInventory(selected); }
  async function deleteSession() { if(!selected||!window.confirm("Delete this Tonight's Bar session? This cannot be undone."))return; await replaceInventory("tonight_bar",[],selected); const next=sessions.filter(s=>s.id!==selected); writeSessions(next); setSessions(next); setSelected(next[0]?.id??null); }

  return <main className="page">
    <header className="app-header"><button className="back-button" onClick={onHome}>← Home</button><div className="page-heading"><span className="page-heading-icon">🌙</span><h1>Tonight's Bar</h1></div></header>
    <p className="lede">Persistent sessions that never change My Bar.</p>
    <div className="toolbar"><button className="primary" onClick={createSession}>+ New Tonight's Bar</button>{sessions.length>0&&<select value={selected??""} onChange={e=>setSelected(e.target.value)}>{sessions.map(s=><option key={s.id} value={s.id}>{s.name} — {s.session_date}</option>)}</select>}{selected&&<><button onClick={()=>void copyMyBar()}>Copy My Bar</button><button className="danger-link" onClick={()=>void deleteSession()}>Delete Session</button></>}</div>
    {selected ? <><section className="picker"><label htmlFor="tonight-ingredient-search">Add ingredient</label><input id="tonight-ingredient-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search bourbon, tonic, lime..." autoComplete="off"/>{query.trim()&&<div className="picker-results">{results.map(i=><button type="button" key={i.id} onClick={()=>void addIngredient(i)}><span>{i.name}</span><small>{i.category}</small></button>)}<button type="button" onClick={()=>void addManualIngredient()}><span>Add “{query.trim()}” manually</span><small>User-created ingredient</small></button></div>}</section><section className="inventory-list">{inventory.length===0?<p className="empty-state">This session is empty. Add what is available tonight.</p>:inventory.map(item=><article className="inventory-row" key={item.id}><div className="inventory-main"><strong>{item.ingredientName}</strong><small>{item.quantity==null?"Quantity optional":`Quantity: ${item.quantity}`}</small></div><input type="number" min="0" step="any" value={item.quantity??""} placeholder="Qty" onChange={async e=>{await updateInventoryQuantity(item.id,e.target.value===""?undefined:Number(e.target.value));await loadInventory(selected);}}/><button className="danger-link" onClick={async()=>{await removeInventoryItem(item.id);await loadInventory(selected);}}>Remove</button></article>)}</section></>:<p className="empty-state">Create a Tonight's Bar session to get started.</p>}
    {error&&<p className="error">{error}</p>}
  </main>;
}
