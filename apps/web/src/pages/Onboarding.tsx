export function Onboarding() {
  return (
    <div style={{ padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>Onboarding</h1>
      <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
        Steps: Google login → Preferences → Criteria → Rating template → Integrations → Done.
      </p>
      <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
        TODO (Week 1): implement wizard.
      </p>
    </div>
  );
}
