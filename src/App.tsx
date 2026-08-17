import { useState } from "react";
import HomePage from "./pages/HomePage";
import MyBarPage from "./pages/MyBarPage";
import TonightsBarPage from "./pages/TonightsBarPage";
import WhatCanIMakePage from "./pages/WhatCanIMakePage";

export default function App() {
  const [page, setPage] = useState("home");
  const home = () => setPage("home");

  if (page === "home") return <HomePage navigate={setPage} />;
  if (page === "mybar") return <div className="theme-mybar"><MyBarPage onHome={home} /></div>;
  if (page === "tonight") return <div className="theme-tonight"><TonightsBarPage onHome={home} /></div>;
  if (page === "matches") return <div className="theme-matches"><WhatCanIMakePage onHome={home} /></div>;

  return <main className="page"><section className="parity-placeholder"><p className="eyebrow">Parity restoration in progress</p><h1>Virtual Bartender</h1><p>This screen is being restored from the established Virtual Bartender edition.</p><button className="back-button" type="button" onClick={home}>← Home</button></section></main>;
}
