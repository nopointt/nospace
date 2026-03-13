# Player A Spec — TLOS-09 Turn A

## Role

You are a **backend-developer** Player in a G3 Dialectical Autocoding session.
Implement exactly what is specified. Do not self-declare done — Coach verifies.

## Your Task

Implement REQ-001, REQ-002, REQ-003 for TLOS-09 (Zep self-hosted + Domain memory, Turn A).

---

## Working Directory

`C:\Users\noadmin\nospace\development\tLOS`

---

## REQ-001 — Probe and install Zep

Run these checks in order and stop at first success:

### Step 1: Check Docker
```bash
docker --version
```
If Docker is available:
```bash
docker pull ghcr.io/getzep/zep:latest
docker run -d --name zep-server -p 8000:8000 ghcr.io/getzep/zep:latest
```
Verify: `curl http://localhost:8000/healthz` → HTTP 200.
If success → document installation method as "docker" and proceed to REQ-002.

### Step 2: Check for Windows binary
If Docker unavailable — check https://github.com/getzep/zep/releases/latest for a Windows x64 binary.
Using PowerShell:
```powershell
$releases = Invoke-RestMethod "https://api.github.com/repos/getzep/zep/releases/latest"
$releases.assets | Where-Object { $_.name -like "*windows*" -or $_.name -like "*win*" } | Select-Object name, browser_download_url
```
If Windows binary found:
- Download to `C:\Users\noadmin\.tlos\zep\`
- Extract and note the run command
- Document installation method as "binary"

### Step 3: mem0 fallback
If neither Docker nor binary is viable:
```bash
uv tool install mem0ai
```
Create a minimal FastAPI wrapper at `core/kernel/tlos-zep-bridge/mem0-wrapper.py`:
```python
"""Minimal mem0 wrapper exposing Zep-compatible REST API on port 8001."""
from fastapi import FastAPI
from pydantic import BaseModel
from mem0 import MemoryClient  # or Memory for local
import uvicorn

app = FastAPI()
# ... implement /health, /api/v2/users, /api/v2/users/{id}/facts endpoints
```
Document installation method as "mem0".

**CRITICAL**: Whatever method works — document it clearly at the top of zep-client.js
as a comment: `// Zep installation: docker | binary | mem0 — <PORT>`.

---

## REQ-002 — grid.ps1: add Zep service entry

File: `core/grid.ps1`

Add this entry to the `$Services` array, **after the langgraph entry and before frontend**:

### If Docker installation:
```powershell
@{ name="zep"; title="Zep memory"; dir=$Root; cmd="docker start zep-server"; optional=$true },
```

Pre-flight block (after langgraph pre-flight):
```powershell
if ($svc.optional -and $svc.name -eq "zep") {
    $dockerAvailable = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
    if (-not $dockerAvailable) {
        Write-Host "  skip  $($svc.title)  (docker not found)" -ForegroundColor DarkGray
        continue
    }
    # Check if container exists
    $containerExists = docker ps -a --filter "name=zep-server" --format "{{.Names}}" 2>$null
    if (-not $containerExists) {
        Write-Host "  skip  $($svc.title)  (zep-server container not created — run docker run ...)" -ForegroundColor DarkGray
        continue
    }
}
```

Stop block (in the "stop" switch case, after langgraph stop):
```powershell
"zep" { docker stop zep-server 2>$null; Write-Host "  stopped zep-server" }
```

Status block (in the "status" switch case):
```powershell
"zep" {
    $health = try { (Invoke-WebRequest "http://localhost:8000/healthz" -TimeoutSec 2).StatusCode } catch { 0 }
    $statusStr = if ($health -eq 200) { "UP" } else { "DOWN" }
    Write-Host "  zep: $statusStr"
}
```

### If binary installation:
Adapt cmd to the binary path, pre-flight checks binary existence.

### If mem0 fallback:
```powershell
@{ name="zep"; title="Zep memory (mem0)"; dir=(Join-Path $Kernel "tlos-zep-bridge"); cmd="uv run python mem0-wrapper.py"; optional=$true },
```

---

## REQ-003 — zep-client.js skeleton

Create file: `core/kernel/tlos-claude-bridge/zep-client.js`

**Pattern: exact structural copy of letta-client.js** (same error handling, same cache approach):

```javascript
'use strict';

// REQ-004, REQ-005, REQ-006 — Zep domain memory client
// Zero external dependencies — uses Node.js 18+ built-in fetch only
// Zero throws — every error path returns null / false / []
// Installation: <document what Player A found: docker|binary|mem0> on port <PORT>

const BASE_URL = 'http://localhost:8000';  // adjust if mem0 uses 8001
const CACHE_TTL_MS = 30_000;

let _available = false;
let _cacheTs = 0;

// Private helper — returns parsed JSON on 2xx, null on any error
async function req(method, path, body) {
    try {
        const options = { method };
        if (body !== undefined) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(body);
        }
        const res = await fetch(BASE_URL + path, options);
        if (!res.ok) return null;
        const text = await res.text();
        if (!text) return {};
        return JSON.parse(text);
    } catch {
        return null;
    }
}

// Checks GET /healthz with 30-second cache
async function isAvailable() {
    if (Date.now() - _cacheTs < CACHE_TTL_MS) return _available;
    try {
        const res = await fetch(BASE_URL + '/healthz');
        _available = res.ok;
    } catch {
        _available = false;
    }
    _cacheTs = Date.now();
    return _available;
}

// Stubs — implemented in Turn B
async function ensureDomain(domain) { return null; }
async function addFact(domain, content, metadata = {}) { return false; }
async function getFacts(domain, limit = 20) { return []; }
async function searchFacts(domain, query, limit = 5) { return []; }
async function getContext(domain) { return ''; }

module.exports = {
    isAvailable,
    ensureDomain,
    addFact,
    getFacts,
    searchFacts,
    getContext,
};
```

---

## Verification Checklist (run all, report results)

```bash
# 1. Zep health
curl http://localhost:8000/healthz
# Expected: HTTP 200 (any body)

# 2. zep-client.js syntax
node --check core/kernel/tlos-claude-bridge/zep-client.js
# Expected: no output (syntax OK)

# 3. zep-client.js require
node -e "const z = require('./core/kernel/tlos-claude-bridge/zep-client'); console.log(Object.keys(z))"
# Expected: [ 'isAvailable', 'ensureDomain', 'addFact', 'getFacts', 'searchFacts', 'getContext' ]

# 4. grid.ps1: zep entry present
Select-String -Path "core/grid.ps1" -Pattern '"zep"'
# Expected: match found
```

Report each check as PASS/FAIL with actual output.

---

## Files to create/modify

| File | Action |
|------|--------|
| `core/kernel/tlos-claude-bridge/zep-client.js` | CREATE |
| `core/grid.ps1` | MODIFY (add zep service + pre-flight + stop + status) |
| `core/kernel/tlos-zep-bridge/mem0-wrapper.py` | CREATE only if mem0 fallback chosen |

Do NOT modify index.js — that is Turn C's responsibility.
Do NOT implement the full zep-client.js API — stubs only. Turn B implements REQ-004/005.
