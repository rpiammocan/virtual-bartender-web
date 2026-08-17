type Props = {
  navigate: (page: string) => void;
};

const groups = [
  {
    title: "Discover",
    actions: [
      ["🍸", "What Can I Make?", "Find drinks based on your current bar", "matches", "green"],
      ["🎲", "Surprise Me", "Let fate pick tonight's drink", "surprise", "green"],
    ],
  },
  {
    title: "My Bar",
    actions: [
      ["🍾", "My Bar", "Manage your permanent inventory", "mybar", "burgundy"],
      ["🌙", "Tonight's Bar", "Manage tonight's temporary inventory", "tonight", "burgundy"],
    ],
  },
  {
    title: "Recipes",
    actions: [
      ["📖", "Recipes", "Browse, add, edit and import recipes", "recipes", "blue"],
      ["♥", "Favorites", "Your saved drinks", "favorites", "blue"],
    ],
  },
  {
    title: "Tools & Management",
    compact: true,
    actions: [
      ["🛒", "Shopping List", "Manage what to buy", "shopping", "wood"],
      ["◷", "History", "Drinks you've made", "history", "wood"],
      ["▣", "Display Mode", "Room-friendly recipe display", "display", "wood"],
      ["⚙", "Admin / Settings", "Backups and application settings", "settings", "wood"],
    ],
  },
];

export default function HomePage({ navigate }: Props) {
  return (
    <main className="page home-page theme-home">
      <header className="hero speakeasy-hero">
        <div className="brand-mark" aria-hidden="true">🤖</div>
        <div>
          <p className="eyebrow">Private • Offline • After Hours</p>
          <h1>Virtual Bartender</h1>
          <p className="subtitle">Mix it up.</p>
        </div>
      </header>

      {groups.map((group) => (
        <section className="home-section" key={group.title}>
          <h2 className="section-title"><span>{group.title}</span></h2>
          <div className={group.compact ? "home-grid tools-grid" : "home-grid"}>
            {group.actions.map(([icon, title, description, target, tone]) => (
              <button className={`home-card tone-${tone}`} key={title} onClick={() => navigate(target)}>
                <span className="home-icon" aria-hidden="true">{icon}</span>
                <span className="home-copy">
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
