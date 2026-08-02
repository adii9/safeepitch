import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, Deal } from "../lib/api";

const STAGES: Deal["stage"][] = [
  "new",
  "screening",
  "due_diligence",
  "partner_review",
  "committed",
  "funded",
  "passed",
];

export function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["deals"],
    queryFn: api.listDeals,
  });

  if (isLoading) return <div className="card">Loading deals...</div>;
  if (error) return <div className="card">Error: {(error as Error).message}</div>;

  const deals = data?.deals ?? [];

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Deal Pipeline</h1>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: "1rem" }}>
        {STAGES.map((stage) => (
          <div key={stage} className="card">
            <h3 style={{ marginBottom: "1rem", textTransform: "capitalize" }}>
              {stage.replace("_", " ")}
            </h3>
            {deals
              .filter((d) => d.stage === stage)
              .map((deal) => (
                <Link key={deal.deal_id} to={`/deals/${deal.deal_id}`} style={{ display: "block", marginBottom: "0.5rem" }}>
                  <div className="card" style={{ padding: "0.75rem" }}>
                    <strong>{deal.company_name}</strong>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Truth: {deal.truth_score}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
