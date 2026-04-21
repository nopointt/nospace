# Spec: Backend (nomos-api)

> Target: G3 Player — backend-developer (Sonnet)
> References: `CONTEXT.md` (all D-nn), `nomos-phase2.md` §2A-2D
> Pre-inline: Player MUST receive CONTEXT.md content inline; this spec inline; existing `finance/nomos/runner/` file tree inline.

---

## Stack

| Component | Choice | Version |
|---|---|---|
| Runtime | Python | 3.12+ |
| Framework | FastAPI | ≥0.115 |
| ASGI server | Uvicorn | ≥0.30 |
| Package manager | uv | latest |
| Async SSE | sse-starlette | ≥2.0 |
| HTTP client | httpx | ≥0.27 |
| Market data | ccxt | ≥4.5 |
| Schema | pydantic | v2 |
| Test | pytest + httpx.AsyncClient | |
| Container | python:3.12-slim | |

---

## Directory layout

```
finance/nomos/api/
├── pyproject.toml
├── uv.lock
├── Dockerfile
├── docker-compose.yml        # nomos-api service only
├── .env.example
├── README.md
├── src/
│   └── nomos_api/
│       ├── __init__.py
│       ├── main.py            # FastAPI app factory
│       ├── config.py          # pydantic Settings
│       ├── auth.py            # bearer token middleware
│       ├── journal.py         # read-only journal.jsonl accessor
│       ├── portfolio.py       # aggregator
│       ├── runner_control.py  # subprocess mgmt (D-08)
│       ├── rag.py             # Qdrant client (D-06)
│       ├── live_prices.py     # CCXT poller + pub/sub
│       ├── alerts.py          # Telegram sender (D-10)
│       ├── sse.py             # SSE broadcast channel
│       ├── routes/
│       │   ├── health.py
│       │   ├── balance.py
│       │   ├── trades.py
│       │   ├── strategies.py
│       │   ├── portfolio.py
│       │   ├── risk.py
│       │   ├── runner.py
│       │   ├── halt.py
│       │   ├── live.py
│       │   └── rag.py
│       └── models/             # pydantic schemas
│           ├── trade.py
│           ├── balance.py
│           ├── strategy.py
│           └── ...
└── tests/
    ├── conftest.py
    └── test_*.py
```

---

## Endpoints

### Public

- `GET /health` → `{"ok": true, "version": "0.1.0", "uptime_s": 123}`

### Auth-required (D-09, `Authorization: Bearer $NOMOS_AUTH_TOKEN`)

**Balance / Portfolio:**
- `GET /api/balance` → current testnet balance (cached 5s)
- `GET /api/portfolio` → aggregated assets + USD value + allocation %

**Trades / Journal:**
- `GET /api/trades?strategy=&pair=&side=&since_ts=&limit=100` → paged trade list
- `GET /api/trades.csv?...` → CSV export
- `GET /api/journal/events?events=tick_hold,order_filled&limit=500` → raw journal view

**Strategies:**
- `GET /api/strategies` → list with per-strategy stats (trades, buys, sells, volume, virtual flag)
- `GET /api/strategies/{name}` → detail + last 20 signals
- `POST /api/strategies/{name}/toggle` → body `{"enabled": bool}` — writes `config.json` + restarts runner if running

**Risk:**
- `GET /api/risk` → current drawdown (day/week/total), halt status, halt reason
- `POST /api/halt` → body `{"reason": str}` — writes `halt.flag`
- `DELETE /api/halt` → removes `halt.flag`

**Runner control (D-08):**
- `GET /api/runner/status` → `{"running": bool, "pid": int?, "started_at": ts?, "last_tick_ts": int?}`
- `POST /api/runner/start` → spawns subprocess, saves PID
- `POST /api/runner/stop` → SIGTERM → 10s wait → SIGKILL
- `GET /api/runner/config` → returns current `runner/config.json`
- `PUT /api/runner/config` → body = full config JSON, validated, saves atomically (write to .tmp then rename), restarts runner

**Live prices / SSE:**
- `GET /api/live/prices?pairs=BTC/USDT,ETH/USDT` → latest cached snapshot
- `GET /api/live/stream` → SSE stream; events: `price_update`, `balance_update`, `trade`, `halt_changed`

**Charts:**
- `GET /api/charts/ohlcv?pair=BTC/USDT&tf=1h&limit=500` → passthrough to CCXT
- `GET /api/charts/trades?pair=BTC/USDT&since_ts=` → trades for overlay

**Bauhaus RAG (D-06, dev only):**
- `POST /api/rag/query` → body `{"text": str, "collection": "bauhaus_knowledge", "limit": 10}` → Qdrant search
- Disabled when `NOMOS_ENV=prod` unless `RAG_ENABLED=true`

---

## Data models (pydantic)

```python
class Trade(BaseModel):
    ts: int
    strategy: str
    pair: str
    side: Literal["buy", "sell"]
    amount: float
    price: float
    cost: float
    order_id: str | None
    virtual: bool  # True if event == "virtual_filled"
    meta: dict[str, Any] = {}

class Balance(BaseModel):
    updated_at: int
    usdt: float
    btc: float
    eth: float
    bnb: float
    total_usd: float

class StrategyStats(BaseModel):
    name: str
    type: Literal["real", "virtual"]
    enabled: bool
    timeframe: str
    pairs: list[str]
    trades: int
    buys: int
    sells: int
    volume_usd: float
    last_signal_ts: int | None
    last_signal_action: str | None
    position_state: dict[str, Literal["LONG", "FLAT"]]  # per pair

class RiskSnapshot(BaseModel):
    daily_pnl_pct: float
    weekly_pnl_pct: float
    total_pnl_pct: float
    halt_active: bool
    halt_reason: str | None
    daily_threshold_pct: float
    weekly_threshold_pct: float
    total_threshold_pct: float
```

---

## Config (`config.py`, pydantic Settings)

```python
class Settings(BaseSettings):
    env: Literal["dev", "prod"] = "dev"
    auth_token: SecretStr
    cors_origins: list[str] = ["http://localhost:5173"]
    runner_dir: Path = Path("/opt/nomos/runner")
    journal_path: Path = Path("/opt/nomos/memory/trading/journal.jsonl")
    portfolio_state_path: Path = Path("/opt/nomos/memory/trading/portfolio-state.json")
    halt_flag_path: Path = Path("/opt/nomos/memory/trading/halt.flag")
    runner_pid_path: Path = Path("/opt/nomos/runner.pid")
    qdrant_url: HttpUrl = "http://localhost:6333"
    rag_enabled: bool = False
    telegram_bot_token: SecretStr | None = None
    telegram_chat_id: str | None = None
    live_price_poll_seconds: int = 5
    class Config:
        env_prefix = "NOMOS_"
        env_file = ".env"
```

---

## Runner control (D-08) — implementation

```python
import os, signal, subprocess, time
from pathlib import Path

class RunnerControl:
    def __init__(self, runner_dir: Path, pid_path: Path):
        self.runner_dir = runner_dir
        self.pid_path = pid_path

    def start(self) -> int:
        if self.is_running():
            raise RuntimeError("runner already running")
        log_stdout = self.runner_dir.parent / "memory/trading/runner.stdout.log"
        log_stderr = self.runner_dir.parent / "memory/trading/runner.stderr.log"
        proc = subprocess.Popen(
            ["python", "runner.py"],
            cwd=self.runner_dir,
            stdout=open(log_stdout, "a"),
            stderr=open(log_stderr, "a"),
            start_new_session=True,
        )
        self.pid_path.write_text(str(proc.pid))
        return proc.pid

    def stop(self, timeout_s: int = 10) -> bool:
        pid = self._read_pid()
        if pid is None:
            return False
        try:
            os.kill(pid, signal.SIGTERM)
            for _ in range(timeout_s):
                time.sleep(1)
                if not self._pid_alive(pid):
                    break
            else:
                os.kill(pid, signal.SIGKILL)
            self.pid_path.unlink(missing_ok=True)
            return True
        except ProcessLookupError:
            self.pid_path.unlink(missing_ok=True)
            return False

    def is_running(self) -> bool:
        pid = self._read_pid()
        return pid is not None and self._pid_alive(pid)

    def _read_pid(self) -> int | None:
        if not self.pid_path.exists():
            return None
        try:
            return int(self.pid_path.read_text().strip())
        except ValueError:
            return None

    def _pid_alive(self, pid: int) -> bool:
        try:
            os.kill(pid, 0)
            return True
        except ProcessLookupError:
            return False
```

---

## SSE broadcast channel

```python
import asyncio, json
from collections import deque

class SSEBroker:
    def __init__(self, maxlen: int = 1000):
        self.subscribers: set[asyncio.Queue] = set()
        self.history = deque(maxlen=maxlen)

    async def publish(self, event: str, data: dict):
        payload = {"event": event, "data": data, "ts": int(time.time())}
        self.history.append(payload)
        dead = []
        for q in self.subscribers:
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            self.subscribers.discard(q)

    async def subscribe(self) -> AsyncGenerator[str, None]:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self.subscribers.add(q)
        try:
            while True:
                payload = await q.get()
                yield f"data: {json.dumps(payload)}\n\n"
        finally:
            self.subscribers.discard(q)
```

Background task polls `journal.jsonl` tail every 1s; new entries → `sse.publish("journal", entry)`.
Background task polls CCXT every 5s (D-07) → `sse.publish("price_update", ...)`.

---

## Docker

### `Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY src/ src/
COPY runner/ /opt/nomos/runner/
EXPOSE 8100
CMD ["uv", "run", "uvicorn", "nomos_api.main:app", "--host", "0.0.0.0", "--port", "8100"]
```

### `docker-compose.yml` (Hetzner, `/opt/nomos/docker-compose.yml`)

```yaml
services:
  nomos-api:
    build: .
    restart: unless-stopped
    env_file: .env
    ports:
      - "127.0.0.1:8100:8100"
    volumes:
      - ./memory:/opt/nomos/memory
      - ./runner:/opt/nomos/runner
    networks:
      - nomos

networks:
  nomos:
```

Nginx/Caddy on Hetzner proxies `api.nomos.contexter.cc` → `127.0.0.1:8100`. Config in `spec-infra.md`.

---

## Tests (AC-H5)

Every endpoint MUST have ≥1 pytest test. Critical flows covered:
- auth: missing token → 401; valid token → 200
- runner start/stop: state transitions correct
- halt: writes/reads halt.flag
- config PUT: invalid JSON rejected; valid JSON persists + restarts runner
- SSE: subscribe → receive 1+ events within 10s
- CSV export: correct columns + escaping

Run: `uv run pytest tests/ -v` — all green before commit.

---

## Task breakdown for G3 Player

Each task has structured verification (H5). Commit after each (H7).

1. **Scaffolding** (Phase 2A / task 2.3)  
   Action: `mkdir finance/nomos/api`, init pyproject, write `main.py` minimal FastAPI + `/health`.  
   Verify: `uv run pytest tests/test_health.py -v` → 1 passed  
   Done when: `curl localhost:8100/health` → 200 with ok:true

2. **Auth middleware**  
   Action: bearer token middleware in `auth.py`, apply to `/api/*` router.  
   Verify: 2 tests (401 missing, 200 valid).  
   Done when: both tests green.

3. **Journal reader**  
   Action: `journal.py` module with `read_all()`, `read_since(ts)`, `tail(n)`.  
   Verify: unit test with fixture JSONL → parse all fields.  
   Done when: all trade events parseable.

4. **Trades endpoint**  
   Action: `routes/trades.py` with list + CSV.  
   Verify: filter test (strategy=remizov_v2 returns only those), CSV has correct headers.  
   Done when: `curl` returns trades, CSV download works.

5-12. (continue per endpoint spec)

---

## Phase Zero for G3 Player (C6)

Before coding, Player must:
1. Read all of `finance/nomos/runner/` to understand existing data contracts (journal format, config.json schema)
2. Read Contexter `api/` equivalent if exists for FastAPI patterns
3. Report understanding of: journal event types, runner PID lifecycle, existing `monitor.py` logic
4. Confirm stack choices with Domain Lead before proceeding

---

## Definition of Done (backend)

- All endpoints functional and tested
- Docker image builds and runs on Hetzner
- `/health` returns OK from `https://api.nomos.contexter.cc/health`
- Auth rejects unauthenticated requests (except /health)
- Runner start/stop from web verified end-to-end
- SSE stream delivers at least 3 event types
- No secrets in git
- `deploy-nomos-api.sh` green
