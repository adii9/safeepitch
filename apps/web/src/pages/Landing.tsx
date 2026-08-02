export function Landing() {
  return (
    <div style={{ padding: "4rem 2rem", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        SafeDeck
      </h1>
      <p style={{ fontSize: "1.125rem", color: "var(--text-muted)", marginBottom: "2rem" }}>
        AI deal intelligence for VCs. Read pitch decks, verify claims, score against your thesis.
      </p>
      <a href="/onboarding" className="btn">
        Get started
      </a>
    </div>
  );
}
