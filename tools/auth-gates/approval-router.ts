// tools/auth-gates/approval-router.ts
// Human-in-the-Loop (HITL) gate for critical MCP operations.
// Policy ref: private_knowledge/policies/approval-matrix.yaml
// Token lifecycle: rules/regulations/api-gateway-regulation.md §3
// Tags: [hitl, approval, gateway, security, mcp, tokens]

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { unlink, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// --- Types ---

type Decision = "approved" | "denied" | "timeout";

interface ApprovalRequest {
  requestId: string;
  agentId: string;
  tool: string;
  justification: string;
  createdAt: number;
  resolve: (d: Decision) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

interface TempToken {
  tokenId: string;
  agentId: string;
  tool: string;
  secretId: string;    // e.g. "web3-dstorage-mcp" — identifier, NOT the secret value
  grantedAt: string;   // ISO 8601
  expiresAt: string;   // ISO 8601
}

// --- Config (all via env — never hardcoded) ---

const CRITICAL_TOOLS = new Set([
  "web3-dstorage-mcp/upload",
  "neon-db-mcp/drop_table",
  "cargo-mcp-rust/deploy_mainnet",
]);

const WEBHOOK_URL   = process.env.APPROVAL_WEBHOOK_URL  ?? "";
const BASE_URL      = process.env.ROUTER_BASE_URL       ?? "http://localhost:8080";
const TIMEOUT_MS    = Number(process.env.APPROVAL_TIMEOUT_MS  ?? 5 * 60 * 1000);
const TOKEN_TTL_MS  = Number(process.env.TOKEN_TTL_MS         ?? 15 * 60 * 1000);
const MAX_PENDING   = Number(process.env.MAX_PENDING_APPROVALS ?? 10); // LLM10: cap queue to prevent DoS

const __dirname   = dirname(fileURLToPath(import.meta.url));
const TOKEN_DIR   = process.env.TEMP_TOKEN_DIR
  ?? join(__dirname, "../../private_knowledge/context/current/temp-mcp-tokens");

// --- State ---

const pending = new Map<string, ApprovalRequest>();

// --- Token Lifecycle (api-gateway-regulation.md §3) ---

async function issueToken(agentId: string, tool: string): Promise<string> {
  const tokenId = crypto.randomUUID();
  const now     = Date.now();

  const record: TempToken = {
    tokenId,
    agentId,
    tool,
    secretId:  tool.split("/")[0],            // identifier only — not the secret
    grantedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TOKEN_TTL_MS).toISOString(),
  };

  await writeFile(
    join(TOKEN_DIR, `${tokenId}.json`),
    JSON.stringify(record, null, 2),
    "utf-8",
  );

  // Auto-revoke at TTL — regulation §3: "Assistant MUST revoke after max_duration_minutes"
  setTimeout(() => revokeToken(tokenId), TOKEN_TTL_MS);

  console.log(`[GATEWAY] Token ${tokenId} issued for ${agentId} → ${tool} (TTL: ${TOKEN_TTL_MS / 60_000}m)`);
  return tokenId;
}

async function revokeToken(tokenId: string): Promise<void> {
  try {
    await unlink(join(TOKEN_DIR, `${tokenId}.json`));
    console.log(`[GATEWAY] Token ${tokenId} revoked`);
  } catch {
    // Already removed — acceptable (idempotent)
  }
}

// --- Notification ---

async function notifyHuman(req: ApprovalRequest): Promise<void> {
  const approveUrl = `${BASE_URL}/decide/${req.requestId}/approve`;
  const denyUrl    = `${BASE_URL}/decide/${req.requestId}/deny`;
  const timeoutMin = Math.floor(TIMEOUT_MS / 60_000);

  const text = [
    "🚨 HITL Approval Required",
    `Agent:  ${req.agentId}`,
    `Tool:   ${req.tool}`,
    `Reason: ${req.justification}`,
    "",
    `✅ Approve → ${approveUrl}`,
    `❌ Deny    → ${denyUrl}`,
    `⏱  Expires in ${timeoutMin} min`,
  ].join("\n");

  if (!WEBHOOK_URL) {
    console.warn("[HITL] APPROVAL_WEBHOOK_URL not set — stdout fallback:");
    console.log(text);
    return;
  }

  const res = await fetch(WEBHOOK_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ text }),
  });

  if (!res.ok) {
    console.error(`[HITL] Webhook ${res.status}: ${await res.text()}`);
  }
}

// --- Approval Flow ---

function awaitDecision(
  agentId: string,
  tool: string,
  justification: string,
): Promise<Decision> {
  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    const timeoutHandle = setTimeout(() => {
      pending.delete(requestId);
      console.warn(`[HITL] Request ${requestId} timed out — auto-deny`);
      resolve("timeout");
    }, TIMEOUT_MS);

    const req: ApprovalRequest = {
      requestId,
      agentId,
      tool,
      justification,
      createdAt: Date.now(),
      resolve,
      timeoutHandle,
    };

    pending.set(requestId, req);

    notifyHuman(req).catch((err) =>
      console.error(`[HITL] Notification error: ${err}`),
    );
  });
}

// --- HTTP API ---

const app = new Hono();

// POST /gate
// Called by the api-gateway before executing any critical tool.
// Body: { tool: string, agent_id: string, justification?: string }
app.post("/gate", async (c) => {
  let body: { tool?: string; agent_id?: string; justification?: string };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { tool, agent_id, justification = "not provided" } = body;

  if (!tool || !agent_id) {
    return c.json({ error: "tool and agent_id are required" }, 400);
  }

  // Non-critical tools pass through immediately
  if (!CRITICAL_TOOLS.has(tool)) {
    return c.json({ approved: true, reason: "pass-through (non-critical)" });
  }

  // LLM10: Unbounded Consumption — reject if queue is at capacity
  if (pending.size >= MAX_PENDING) {
    console.warn(`[HITL] Queue at capacity (${pending.size}/${MAX_PENDING}) — rejecting ${agent_id} → ${tool}`);
    return c.json(
      { error: `Approval queue at capacity (${MAX_PENDING}). Retry after a pending request resolves.` },
      429,
    );
  }

  console.log(`[HITL] ${agent_id} → ${tool}`);

  const decision = await awaitDecision(agent_id, tool, justification);

  if (decision !== "approved") {
    return c.json({ error: `Denied (${decision})`, action: "halt_and_rescope" }, 403);
  }

  const tokenId = await issueToken(agent_id, tool);
  return c.json({ approved: true, token_id: tokenId });
});

// GET /decide/:id/approve  — human approves via URL from notification
// GET /decide/:id/deny     — human denies
app.get("/decide/:id/:decision", (c) => {
  const id         = c.req.param("id");
  const rawDecision = c.req.param("decision");

  if (rawDecision !== "approve" && rawDecision !== "deny") {
    return c.text("Use /decide/{id}/approve or /decide/{id}/deny", 400);
  }

  const req = pending.get(id);
  if (!req) {
    return c.text("Not found — already decided or timed out", 404);
  }

  clearTimeout(req.timeoutHandle);
  pending.delete(id);

  const decision: Decision = rawDecision === "approve" ? "approved" : "denied";
  req.resolve(decision);

  const icon = decision === "approved" ? "✅" : "❌";
  return c.text(
    `${icon} ${decision.toUpperCase()} — ${req.agentId} | ${req.tool} | ${id}`,
  );
});

// DELETE /tokens/:id
// Manual revocation — nopoint or Assistant only (per api-gateway-regulation.md §6)
app.delete("/tokens/:id", async (c) => {
  const id = c.req.param("id");
  await revokeToken(id);
  return c.json({ revoked: id });
});

// GET /status
// Visibility: pending approvals + config snapshot (no secret data)
app.get("/status", (c) =>
  c.json({
    pending_approvals: [...pending.values()].map((r) => ({
      request_id:  r.requestId,
      agent_id:    r.agentId,
      tool:        r.tool,
      age_seconds: Math.floor((Date.now() - r.createdAt) / 1000),
    })),
    config: {
      webhook_configured: Boolean(WEBHOOK_URL),
      timeout_minutes:    TIMEOUT_MS / 60_000,
      token_ttl_minutes:  TOKEN_TTL_MS / 60_000,
      token_dir:          TOKEN_DIR,
    },
  }),
);

// --- Boot ---

console.log(`[HITL] Approval Router :8080`);
console.log(`[HITL] Webhook:   ${WEBHOOK_URL || "(stdout fallback)"}`);
console.log(`[HITL] Token dir: ${TOKEN_DIR}`);
console.log(`[HITL] Timeout:   ${TIMEOUT_MS / 60_000} min`);

serve({ port: 8080, fetch: app.fetch });
