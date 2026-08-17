import { BUILTIN_RECIPES } from "./catalog";
import { getCustomRecipes } from "../storage/customRecipes";

export type ImportIngredient = { quantity: number | null; unit: string | null; name: string };
export type ImportDraft = {
  source_url: string;
  source_name: string;
  name: string;
  recipe_type: "cocktail" | "mocktail";
  instructions: string[];
  ingredients: ImportIngredient[];
  warnings: string[];
  extraction_method: "json_ld" | "fallback";
  possible_duplicates: { key: string; name: string; score: number }[];
};
export type CollectionResult = { source_url: string; source_name: string; recipes: { url: string; name: string }[]; count: number };

function asList<T>(value: T | T[] | null | undefined): T[] { return value == null ? [] : Array.isArray(value) ? value : [value]; }
function sourceName(url: string) { try { return new URL(url).hostname; } catch { return url; } }

function similarity(a: string, b: string): number {
  const x=a.toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); const y=b.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  if(x===y)return 100; const xs=new Set(x.split(/\s+/)); const ys=new Set(y.split(/\s+/)); const common=[...xs].filter(v=>ys.has(v)).length; return Math.round(100*(2*common)/Math.max(1,xs.size+ys.size));
}
function duplicates(name: string) { return [...BUILTIN_RECIPES,...getCustomRecipes()].map(r=>({key:r.key,name:r.name,score:similarity(name,r.name)})).filter(r=>r.score>=60).sort((a,b)=>b.score-a.score).slice(0,5); }

function parseIngredient(raw: string): ImportIngredient {
  const text=raw.replace(/\s+/g," ").trim();
  const m=text.match(/^\s*(\d+(?:\.\d+)?|\d+\/\d+)?\s*(oz|ounces?|ml|tsp|teaspoons?|tbsp|tablespoons?|dash(?:es)?|cups?|pc|pieces?)?\s*(.*)$/i);
  let quantity:number|null=null; if(m?.[1]) quantity=m[1].includes("/")?Number(m[1].split("/")[0])/Number(m[1].split("/")[1]):Number(m[1]);
  const unitRaw=(m?.[2]||"").toLowerCase(); const units:Record<string,string>={ounce:"oz",ounces:"oz",oz:"oz",teaspoon:"tsp",teaspoons:"tsp",tsp:"tsp",tablespoon:"tbsp",tablespoons:"tbsp",tbsp:"tbsp",dash:"dash",dashes:"dash",piece:"pc",pieces:"pc",pc:"pc",ml:"ml",cup:"cup",cups:"cup"};
  return { quantity:Number.isFinite(quantity as number)?quantity:null, unit:units[unitRaw]||unitRaw||null, name:(m?.[3]||text).replace(/^[-–—,:]+\s*/,"").trim()||text };
}

function findRecipeJsonLd(doc: Document): any | null {
  for(const script of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))){ try{const data=JSON.parse(script.textContent||""); const candidates:any[]=[]; if(data&&typeof data==="object"&&!Array.isArray(data)&&Array.isArray(data["@graph"]))candidates.push(...data["@graph"]); else candidates.push(...asList(data)); for(const item of candidates){const types=asList(item?.["@type"]); if(item&&typeof item==="object"&&types.includes("Recipe"))return item;}}catch{/* skip malformed JSON-LD */} }
  return null;
}

async function fetchHtml(url: string): Promise<{text:string;finalUrl:string}> {
  let parsed:URL; try{parsed=new URL(url);}catch{throw new Error("Enter a valid http or https recipe URL.");}
  if(!["http:","https:"].includes(parsed.protocol))throw new Error("Only http and https URLs are supported.");
  try{const response=await fetch(parsed.toString(),{method:"GET",mode:"cors",credentials:"omit",redirect:"follow"}); if(!response.ok)throw new Error(`Website returned ${response.status}.`); return {text:await response.text(),finalUrl:response.url||parsed.toString()};}
  catch(err){throw new Error(`This website blocked direct recipe import from the browser. ${err instanceof Error?err.message:"Browser access was denied."}`);}
}

export async function importRecipeFromUrl(url:string):Promise<ImportDraft>{
  const {text,finalUrl}=await fetchHtml(url); const doc=new DOMParser().parseFromString(text,"text/html"); const recipe=findRecipeJsonLd(doc); const warnings:string[]=[]; let name=""; let rawIngredients:string[]=[]; let instructions:string[]=[]; let method:"json_ld"|"fallback"="fallback";
  if(recipe){ method="json_ld"; name=String(recipe.name||"").trim(); rawIngredients=asList(recipe.recipeIngredient).map(String); for(const step of asList<any>(recipe.recipeInstructions)){if(typeof step==="string")instructions.push(step);else if(step&&typeof step==="object"){const t=step.text||step.name;if(t)instructions.push(String(t));}} if(!rawIngredients.length)warnings.push("Structured recipe data did not include ingredients."); if(!instructions.length)warnings.push("Structured recipe data did not include instructions."); }
  else { warnings.push("No structured Recipe data found; used webpage fallback extraction."); name=(doc.querySelector("h1")?.textContent||doc.title||"").trim(); const nodes=Array.from(doc.querySelectorAll('[class*="ingredient"],[id*="ingredient"],li')); rawIngredients=nodes.map(n=>(n.textContent||"").trim()).filter(t=>t.length>=2&&t.length<=160&&/\b(oz|ounce|ml|tsp|tbsp|dash|cup|teaspoon|tablespoon)\b/i.test(t)).filter((v,i,a)=>a.indexOf(v)===i).slice(0,30); const steps=Array.from(doc.querySelectorAll('[class*="instruction"],[class*="direction"],[id*="instruction"],[id*="direction"]')); instructions=steps.map(n=>(n.textContent||"").trim()).filter(t=>t.length>=10&&t.length<=1000).filter((v,i,a)=>a.indexOf(v)===i).slice(0,20); }
  const finalName=name||"Imported Recipe"; return {source_url:finalUrl,source_name:sourceName(finalUrl),name:finalName,recipe_type:"cocktail",instructions,ingredients:rawIngredients.map(parseIngredient),warnings,extraction_method:method,possible_duplicates:duplicates(finalName)};
}

export async function scanRecipeCollection(url:string,limit=250):Promise<CollectionResult>{
  const {text,finalUrl}=await fetchHtml(url); const doc=new DOMParser().parseFromString(text,"text/html"); const base=new URL(finalUrl); const found=new Map<string,string>();
  for(const anchor of Array.from(doc.querySelectorAll<HTMLAnchorElement>("a[href]"))){ if(found.size>=limit)break; try{const u=new URL(anchor.href,finalUrl); if(u.hostname!==base.hostname)continue; const path=u.pathname.replace(/\/$/,""); if(!path.toLowerCase().includes("/recipe/")||path.toLowerCase().includes("/collection/"))continue; u.search="";u.hash=""; const clean=u.toString(); if(!found.has(clean))found.set(clean,(anchor.textContent||path.split("/").pop()||"Recipe").trim());}catch{/* ignore malformed links */} }
  const recipes=[...found.entries()].map(([recipeUrl,name])=>({url:recipeUrl,name})); return {source_url:finalUrl,source_name:base.hostname,recipes,count:recipes.length};
}
