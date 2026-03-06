const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ── Token storage ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("harkly_token");
}

export function setToken(token: string) {
  localStorage.setItem("harkly_token", token);
}

export function clearToken() {
  localStorage.removeItem("harkly_token");
}

function getHeaders(): Record<string, string> {
  const token = getToken();
  const base: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    base["Authorization"] = `Bearer ${token}`;
  } else {
    // dev fallback
    base["X-Tenant-ID"] = "00000000-0000-0000-0000-000000000001";
  }
  return base;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user_id: string;
  tenant_id: string;
  role: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function register(
  email: string,
  password: string,
  tenant_id?: string
): Promise<{ user_id: string; token: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenant_id }),
  });
  if (!res.ok) throw new Error(`Register failed: ${res.status}`);
  const data = await res.json();
  setToken(data.token);
  return data;
}

// ── Research ──────────────────────────────────────────────────────────────────

export interface Research {
  id: string;
  name: string;
  state: string;
  created_at: string;
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
  sentiment?: number | null;
}

export interface ListSignalsResponse {
  signals: Signal[];
  total: number;
  page: number;
  limit: number;
}

export interface AnalyticsResponse {
  total: number;
  by_date: { date: string; count: number }[];
  top_authors: { author: string; count: number }[];
  source_breakdown: { source_type: string; count: number }[];
  sentiment: { positive: number; neutral: number; negative: number };
}

export async function createResearch(
  body: CreateResearchRequest
): Promise<CreateResearchResponse> {
  const res = await fetch(`${API_BASE}/api/v1/researches`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST /researches failed: ${res.status}`);
  return res.json();
}

export async function listResearches(): Promise<
  { id: string; name: string; state: string; created_at: string; signal_count: number }[]
> {
  const res = await fetch(`${API_BASE}/api/v1/researches`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`GET /researches failed: ${res.status}`);
  return res.json();
}

export async function listSignals(
  researchId: string,
  page = 1,
  limit = 20
): Promise<ListSignalsResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/researches/${researchId}/signals?page=${page}&limit=${limit}`,
    { headers: getHeaders() }
  );
  if (!res.ok) throw new Error(`GET /signals failed: ${res.status}`);
  return res.json();
}

export async function getAnalytics(researchId: string): Promise<AnalyticsResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/researches/${researchId}/analytics`,
    { headers: getHeaders() }
  );
  if (!res.ok) throw new Error(`GET /analytics failed: ${res.status}`);
  return res.json();
}
