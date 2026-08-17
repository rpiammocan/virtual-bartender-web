import { getInventory, replaceInventory } from "./db";
import type { InventoryItem } from "./types";

const LOCAL_KEYS = [
  "virtual-bartender-tonights-bar-sessions",
  "virtual-bartender-favorites",
  "virtual-bartender-history",
  "virtual-bartender-recipe-overrides",
  "virtual-bartender-hidden-recipes",
  "virtual-bartender-shopping-list",
  "virtual-bartender-custom-recipes",
];

export type BrowserBackup = {
  format: "virtual-bartender-web-backup";
  version: 1;
  exportedAt: string;
  localStorage: Record<string, string | null>;
  inventory: InventoryItem[];
};

export async function createBrowserBackup(): Promise<BrowserBackup> {
  const sessions = (() => { try { return JSON.parse(localStorage.getItem("virtual-bartender-tonights-bar-sessions") || "[]") as {id:string}[]; } catch { return []; } })();
  const myBar = await getInventory("my_bar");
  const tonight = (await Promise.all(sessions.map((session) => getInventory("tonight_bar", session.id)))).flat();
  const local: Record<string,string|null> = {};
  LOCAL_KEYS.forEach((key) => { local[key] = localStorage.getItem(key); });
  return { format:"virtual-bartender-web-backup", version:1, exportedAt:new Date().toISOString(), localStorage:local, inventory:[...myBar,...tonight] };
}

export function downloadBackup(backup: BrowserBackup) {
  const blob = new Blob([JSON.stringify(backup,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob); const link=document.createElement("a");
  link.href=url; link.download=`virtual-bartender-backup-${backup.exportedAt.slice(0,10)}.json`; link.click(); URL.revokeObjectURL(url);
}

export async function restoreBrowserBackup(backup: BrowserBackup) {
  if (backup.format !== "virtual-bartender-web-backup" || backup.version !== 1 || !Array.isArray(backup.inventory)) throw new Error("This is not a valid Virtual Bartender Web backup.");
  for (const key of LOCAL_KEYS) { const value=backup.localStorage?.[key]; if(value==null)localStorage.removeItem(key);else localStorage.setItem(key,value); }
  const myBar=backup.inventory.filter(i=>i.context==="my_bar"&&!i.contextId); await replaceInventory("my_bar",myBar);
  const sessions=(()=>{try{return JSON.parse(backup.localStorage?.["virtual-bartender-tonights-bar-sessions"]||"[]") as {id:string}[];}catch{return [];}})();
  for(const session of sessions){await replaceInventory("tonight_bar",backup.inventory.filter(i=>i.context==="tonight_bar"&&i.contextId===session.id),session.id);}
}
