import { useState } from "react";
import HomePage from "./pages/HomePage";
import MyBarPage from "./pages/MyBarPage";
import TonightsBarPage from "./pages/TonightsBarPage";
import WhatCanIMakePage from "./pages/WhatCanIMakePage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import ShoppingPage from "./pages/ShoppingPage";

export default function App() {
  const [page,setPage]=useState("home");const [recipeKey,setRecipeKey]=useState<string|null>(null);const home=()=>setPage("home");
  const openRecipe=(key:string)=>{setRecipeKey(key);setPage("recipe-detail")};
  if(page==="home")return <HomePage navigate={setPage}/>;
  if(page==="mybar")return <div className="theme-mybar"><MyBarPage onHome={home}/></div>;
  if(page==="tonight")return <div className="theme-tonight"><TonightsBarPage onHome={home}/></div>;
  if(page==="matches")return <div className="theme-matches"><WhatCanIMakePage onHome={home}/></div>;
  if(page==="recipes")return <RecipesPage onHome={home} openRecipe={openRecipe} manageRecipes={()=>setPage("recipe-manage")}/>;
  if(page==="favorites")return <FavoritesPage onHome={home} openRecipe={openRecipe}/>;
  if(page==="shopping")return <ShoppingPage onHome={home}/>;
  if(page==="recipe-detail"&&recipeKey)return <RecipeDetailPage recipeKey={recipeKey} onHome={home} onBack={()=>setPage("recipes")}/>;
  return <main className="page"><section className="parity-placeholder"><p className="eyebrow">Parity restoration in progress</p><h1>Virtual Bartender</h1><p>This screen is being restored from the established Virtual Bartender edition.</p><button className="back-button" type="button" onClick={home}>← Home</button></section></main>;
}
