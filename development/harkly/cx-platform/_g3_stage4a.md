# Stage 4a Task: API Smoke Test

Working directory: C:/Users/noadmin/nospace/development/harkly/cx-platform/

## Your role
You are the Player. Execute all steps in order. Report exact output of each step.

---

## STEP 1: Build release binary (ensures no stale artifacts)
```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && cargo build 2>&1 | tail -5
```

---

## STEP 2: Start server in background
Run the server as a background process, redirecting output to a log file:
```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && cargo run -- serve --port 3000 > C:/Temp/cx-serve.log 2>&1 &
```
Then wait 10 seconds for startup:
```
sleep 10
```
Check the log file to confirm server started:
```
cat C:/Temp/cx-serve.log
```
Expected: log line containing "Starting API server on 0.0.0.0:3000"

---

## STEP 3: POST /api/v1/researches
```
curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST http://localhost:3000/api/v1/researches \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: 00000000-0000-0000-0000-000000000001" \
  -d "{\"name\":\"Smoke Test\",\"appid\":1351240,\"limit\":5}"
```
Expected: HTTP_STATUS:201 with JSON body containing `id` (UUID) and `state: "CollectingOSINT"`

Save the `id` value from the response — you will use it in Step 4.

---

## STEP 4: GET /api/v1/researches/:id/signals
Replace RESEARCH_ID with the `id` from Step 3:
```
curl -s -w "\nHTTP_STATUS:%{http_code}" \
  "http://localhost:3000/api/v1/researches/RESEARCH_ID/signals?page=1&limit=20" \
  -H "X-Tenant-ID: 00000000-0000-0000-0000-000000000001"
```
Expected: HTTP_STATUS:200 with JSON body containing `signals` array, `total`, `page`, `limit`

---

## STEP 5: Kill server and show log
```
pkill -f "cx-platform" 2>/dev/null || taskkill /F /IM cx-platform.exe 2>/dev/null || echo "kill attempted"
cat C:/Temp/cx-serve.log
```

---

## REPORT after all steps:
- Step 1: last line of cargo build output
- Step 2: server log content (confirm started)
- Step 3: full curl response including HTTP_STATUS
- Step 4: full curl response including HTTP_STATUS and at least first signal if any
- Step 5: relevant server log lines
