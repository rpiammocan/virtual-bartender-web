import { useState } from "react";
import MyBarPage from "./pages/MyBarPage";
import WhatCanIMakePage from "./pages/WhatCanIMakePage";

type Screen = "home" | "my-bar" | "make";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  if (screen === "my-bar") return <MyBarPage onHome={() => setScreen("home")} />;
  if (screen === "make") return <WhatCanIMakePage />;

  return (
    <main className="page home-page">
      <header className="hero">
        <p className="eyebrow">Browser Edition</p>
        <h1>Virtual Bartender</h1>
        <p>Your bar inventory and recipe matching stay on this device, in this browser.</p>
      </header>
      <section className="home-actions">
        <button type="button" onClick={() => setScreen("my-bar")}>
          <strong>My Bar</strong>
          <span>Add, remove, import, and export your ingredients.</span>
        </button>
        <button type="button" onClick={() => setScreen("make")}>
          <strong>What Can I Make?</strong>
          <span>Match your bar against the complete built-in recipe catalog.</span>
        </button>
      </section>
    </main>
  );
}
