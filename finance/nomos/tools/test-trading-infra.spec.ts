import { test, expect } from "@playwright/test";

const FT_URL = "http://localhost:8080";
const USERNAME = "nomos";
const PASSWORD = "nomos-demo";

let token: string;

test.beforeAll(async ({ request }) => {
  const resp = await request.post(`${FT_URL}/api/v1/token/login`, {
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64"),
    },
  });
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  token = body.access_token;
  expect(token).toBeTruthy();
});

test.describe("Freqtrade API Health", () => {
  test("ping returns pong", async ({ request }) => {
    const resp = await request.get(`${FT_URL}/api/v1/ping`);
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.status).toBe("pong");
  });

  test("bot is running", async ({ request }) => {
    const resp = await request.get(`${FT_URL}/api/v1/show_config`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.ok()).toBeTruthy();
    const config = await resp.json();
    expect(config.state).toBe("running");
    expect(config.dry_run).toBe(true);
    expect(config.bot_name).toBe("Nomos Demo");
  });

  test("strategy is NomosBasicStrategy", async ({ request }) => {
    const resp = await request.get(`${FT_URL}/api/v1/show_config`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const config = await resp.json();
    expect(config.strategy).toBe("NomosBasicStrategy");
    expect(config.timeframe).toBe("5m");
    expect(config.exchange).toBe("binance");
  });

  test("dry run wallet is $260", async ({ request }) => {
    const resp = await request.get(`${FT_URL}/api/v1/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.ok()).toBeTruthy();
    const balance = await resp.json();
    expect(balance.total).toBeGreaterThanOrEqual(250);
    expect(balance.stake).toBe("USDT");
  });

  test("whitelist has BTC/USDT and ETH/USDT", async ({ request }) => {
    const resp = await request.get(`${FT_URL}/api/v1/whitelist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.ok()).toBeTruthy();
    const wl = await resp.json();
    expect(wl.whitelist).toContain("BTC/USDT");
    expect(wl.whitelist).toContain("ETH/USDT");
    expect(wl.whitelist).toHaveLength(2);
  });

  test("candle data is being fetched", async ({ request }) => {
    const resp = await request.get(
      `${FT_URL}/api/v1/pair_candles?pair=BTC%2FUSDT&timeframe=5m&limit=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.strategy).toBe("NomosBasicStrategy");
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.columns).toContain("enter_long");
    expect(data.columns).toContain("exit_long");
  });

  test("max open trades is 3", async ({ request }) => {
    const resp = await request.get(`${FT_URL}/api/v1/count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.ok()).toBeTruthy();
    const count = await resp.json();
    expect(count.max).toBe(3);
    expect(count.current).toBeGreaterThanOrEqual(0);
  });
});

test.describe("MCP Servers Health", () => {
  test("Crypto.com MCP is reachable", async ({ request }) => {
    const resp = await request.post(
      "https://mcp.crypto.com/market-data/mcp",
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        data: {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0" },
          },
        },
      }
    );
    expect(resp.ok()).toBeTruthy();
    const text = await resp.text();
    expect(text).toContain("Crypto.com");
  });

  test("CoinGecko MCP is reachable", async ({ request }) => {
    const resp = await request.post("https://mcp.api.coingecko.com/mcp", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      data: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      },
    });
    expect(resp.ok()).toBeTruthy();
    const text = await resp.text();
    expect(text).toContain("coingecko");
  });
});

test.describe("Sync Script", () => {
  test("sync-trades.py runs without errors", async ({}) => {
    const { execSync } = require("child_process");
    const output = execSync(
      "python C:/Users/noadmin/nospace/finance/nomos/tools/sync-trades.py",
      { encoding: "utf-8", timeout: 15000 }
    ).trim();
    expect(output).toContain("Synced");
    expect(output).toContain("Balance: $260.00");
  });
});
