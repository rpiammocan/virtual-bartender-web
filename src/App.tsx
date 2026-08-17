import { useState } from "react";
import HomePage from "./pages/HomePage";
import MyBarPage from "./pages/MyBarPage";
import TonightsBarPage from "./pages/TonightsBarPage";
import WhatCanIMakePage from "./pages/WhatCanIMakePage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import RecipeManagePage from "./pages/RecipeManagePage";
import FavoritesPage from "./pages/FavoritesPage";
import ShoppingPage from "./pages/ShoppingPage";
import HistoryPage from "./pages/HistoryPage";
import SurprisePage from "./pages/SurprisePage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const [page,setPage]=useState("home");const [recipeKey,setRecipeKey]=useState<string|null>(null);const home=()=>setPage("home");
  const openRecipe=(key:string)=>{setRecipeKey(key);setPage("recipe-detail")};
  if(page==="home")return <HomePage navigate={setPage}/>;
  if(page==="mybar")return <div className="theme-mybar"><MyBarPage onHome={home}/></div>;
  if(page==="tonight")return <div className="theme-tonight"><TonightsBarPage onHome={home}/></div>;
  if(page==="matches")return <div className="theme-matches"><WhatCanIMakePage onHome={home}/></div>;
  if(page==="recipes")return <div className="theme-recipes"><RecipesPage onHome={home} openRecipe={openRecipe} manageRecipes={()=>setPage("recipe-manage")}/></div>;
  if(page==="display")return <div className="theme-display"><RecipesPage onHome={home} openRecipe={openRecipe}/></div>;
  if(page==="recipe-manage")return <div className="theme-recipes"><RecipeManagePage onHome={home} onBack={()=>setPage("recipes")} openRecipe={openRecipe}/></div>;
  if(page==="favorites")return <div className="theme-favorites"><FavoritesPage onHome={home} openRecipe={openRecipe}/></div>;
  if(page==="shopping")return <div className="theme-shopping"><ShoppingPage onHome={home}/></div>;
  if(page==="history")return <div className="theme-history"><HistoryPage onHome={home}/></div>;
  if(page==="surprise")return <div className="theme-surprise"><SurprisePage onHome={home} openRecipe={openRecipe}/></div>;
  if(page==="settings")return <div className="theme-settings"><SettingsPage onHome={home}/></div>;
  if(page==="recipe-detail"&&recipeKey)return <div className="theme-recipes"><RecipeDetailPage recipeKey={recipeKey} onHome={home} onBack={()=>setPage("recipes")}/></div>;
  return <HomePage navigate={setPage}/>;
}
