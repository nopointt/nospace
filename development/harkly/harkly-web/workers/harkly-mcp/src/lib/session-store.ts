/**
 * KV-backed MCP session store.
 * Replaces mcp-ts-core's in-memory Map that doesn't survive Worker restarts.
 * Key pattern: mcp:session:{sessionId}
 */

interface McpSession {
  tenantId: string;
  clientId: string;
  subject: string;
  lastAccessed: number;
}

export class KvSessionStore {
  private kv: KVNamespace;
  private defaultTtlSeconds: number;

  constructor(kv: KVNamespace, defaultTtlSeconds = 3600) {
    this.kv = kv;
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  private key(sessionId: string): string {
    return `mcp:session:${sessionId}`;
  }

  async get(sessionId: string): Promise<McpSession | null> {
    const raw = await this.kv.get(this.key(sessionId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as McpSession;
    } catch {
      return null;
    }
  }

  async set(sessionId: string, session: McpSession, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    await this.kv.put(
      this.key(sessionId),
      JSON.stringify({ ...session, lastAccessed: Date.now() }),
      { expirationTtl: ttl },
    );
  }

  async delete(sessionId: string): Promise<void> {
    await this.kv.delete(this.key(sessionId));
  }
}
