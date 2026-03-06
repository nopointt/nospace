const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

const headers = {
  "Content-Type": "application/json",
  "X-Tenant-ID": TENANT_ID,
};

export interface Research {
  id: string;
  name: string;
  state: string;
  signal_count: number;
}

export interface CreateResearchRequest {
  name: string;
  appid: number;
  limit: number;
  reddit_query?: string;
  gog_product_id?: number;
}

export interface CreateResearchResponse {
  id: string;
  state: string;
}

export interface Signal {
  id: string;
  source_type: string;
  source_url: string | null;
  content: string;
  author: string | null;
  collected_at: string;
}

export interface ListSignalsResponse {
  signals: Signal[];
  total: number;
  page: number;
  limit: number;
}

export async function listResearches(): Promise<Research[]> {
  const res = await fetch(`${API_BASE}/api/v1/researches`, { headers });
  if (!res.ok) throw new Error(`GET /researches failed: ${res.status}`);
  return res.json();
}

export async function createResearch(
  body: CreateResearchRequest
): Promise<CreateResearchResponse> {
  const res = await fetch(`${API_BASE}/api/v1/researches`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST /researches failed: ${res.status}`);
  return res.json();
}

export async function listSignals(
  researchId: string,
  page = 1,
  limit = 20
): Promise<ListSignalsResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/researches/${researchId}/signals?page=${page}&limit=${limit}`,
    { headers }
  );
  if (!res.ok) throw new Error(`GET /signals failed: ${res.status}`);
  return res.json();
}

export interface AnalyticsResponse {
  total: number;
  by_date: { date: string; count: number }[];
  top_authors: { author: string; count: number }[];
  source_breakdown: { source_type: string; count: number }[];
}

export async function getAnalytics(researchId: string): Promise<AnalyticsResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/researches/${researchId}/analytics`,
    { headers }
  );
  if (!res.ok) throw new Error(`GET /analytics failed: ${res.status}`);
  return res.json();
}
