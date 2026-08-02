import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

export function DealDetail() {
  const { dealId } = useParams<{ dealId: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["deal", dealId],
    queryFn: () => api.getDeal(dealId!),
    enabled: !!dealId,
  });

  if (isLoading) return <div className="card">Loading deal...</div>;
  if (error) return <div className="card">Error: {(error as Error).message}</div>;

  const deal = data?.deal;

  if (!deal) return <div className="card">Deal not found.</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1>{deal.company_name}</h1>
        <span className={`stage stage-${deal.stage === "funded" ? "funded" : "new"}`}>
          {deal.stage}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="card">
          <h3>Truth Score</h3>
          <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)" }}>
            {deal.truth_score}
          </p>
        </div>

        <div className="card">
          <h3>Audit Sources</h3>
          {deal.audit?.sources?.length ? (
            <ul>
              {deal.audit.sources.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.field}
                  </a>{" "}
                  ({Math.round(s.confidence * 100)}%)
                </li>
              ))}
            </ul>
          ) : (
            <p>No sources yet.</p>
          )}
        </div>

        <div className="card">
          <h3>Meetings</h3>
          {deal.meetings?.length ? (
            <ul>
              {deal.meetings.map((m) => (
                <li key={m.meeting_id}>
                  {m.scheduled_at} — {m.source}
                  {m.insights && <p style={{ fontSize: "0.85rem" }}>{m.insights}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p>No meetings scheduled.</p>
          )}
        </div>

        <div className="card">
          <h3>Missing Fields</h3>
          {deal.missing_fields?.length ? (
            <ul>
              {deal.missing_fields.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <p>All required fields present.</p>
          )}
        </div>
      </div>
    </div>
  );
}
