/**
 * API client for SafeDeck backend.
 * Uses AWS API Gateway endpoints via env-injected base URL.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.dev.safedeck.ai";

export interface Deal {
  deal_id: string;
  company_name: string;
  stage: "new" | "screening" | "due_diligence" | "partner_review" | "committed" | "funded" | "passed";
  truth_score: number;
  created_at: string;
  audit_id?: string;
}

export interface DealDetail extends Deal {
  email_thread?: Email[];
  meetings?: Meeting[];
  audit?: AuditSummary;
  missing_fields?: string[];
}

export interface Email {
  email_id: string;
  from: string;
  subject: string;
  received_at: string;
  relevant: boolean;
}

export interface Meeting {
  meeting_id: string;
  scheduled_at: string;
  source: "calendly" | "fireflies";
  transcript?: string;
  insights?: string;
}

export interface AuditSummary {
  extraction: Record<string, unknown>;
  verification: { truth_score: number; red_flags: string[]; green_flags: string[] };
  sources: Array<{ field: string; url: string; confidence: number }>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getIdToken()}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getIdToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getIdToken()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function getIdToken(): string {
  // TODO (Week 2): wire Cognito-hosted-UI token retrieval
  return "";
}

export const api = {
  listDeals: () => get<{ deals: Deal[] }>("/deals"),
  getDeal: (id: string) => get<{ deal: DealDetail }>(`/deals/${id}`),
  updateDealStage: (id: string, stage: DealDetail["stage"]) =>
    patch<{ updated: boolean }>(`/deals/${id}/stage`, { stage }),
  generateMemo: (id: string) => post<{ memo_md: string; missing_fields: string[] }>(`/deals/${id}/memo`),
  classifyEmail: (email: { from: string; subject: string; body: string }) =>
    post<{ relevant: boolean; confidence: number; reason: string }>("/emails/classify", email),
  resolveCompany: (email: string) =>
    post<{ company_id: string; domain: string }>("/companies/resolve", { email }),
};
