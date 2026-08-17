import { useMemo } from "react";
import { getHistory } from "../storage/recipeUserData";

type Props = { onHome: () => void };

export default function HistoryPage({ onHome }: Props) {
  const items = useMemo(() => getHistory(), []);

  return (
    <main className="page">
      <header className="app-header">
        <button className="back-button" onClick={onHome}>← Home</button>
        <div className="page-heading"><span className="page-heading-icon">◷</span><h1>Drink History</h1></div>
      </header>
      <div className="result-list">
        {items.map((item) => (
          <article className="recipe-card" key={item.id}>
            <div>
              <strong>{item.recipeName}</strong>
              <p>{new Date(item.madeAt).toLocaleString()}</p>
              {item.rating > 0 && <small>{"★".repeat(item.rating)}</small>}
              {item.notes && <p>{item.notes}</p>}
            </div>
          </article>
        ))}
        {items.length === 0 && <p className="empty-state">No drinks recorded yet.</p>}
      </div>
    </main>
  );
}
