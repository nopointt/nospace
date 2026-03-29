#!/bin/bash
# Health check with Telegram alert on failure.
# Run via cron every 5 minutes.
# Catches: app crash, Docker OOM, dependency failures (PG, Redis, R2, Groq).
# Does NOT catch: full server down (need external monitor for that).

set -a
source /opt/contexter/.env
set +a

HEALTH_URL="http://localhost:3000/health"
TELEGRAM_API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
CHAT_ID="${TELEGRAM_ALERT_CHAT_ID:-}"
STATE_FILE="/tmp/contexter-health-state"

# Skip if no Telegram config
if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$CHAT_ID" ]; then
  echo "TELEGRAM_BOT_TOKEN or TELEGRAM_ALERT_CHAT_ID not set, skipping"
  exit 0
fi

send_alert() {
  local message="$1"
  curl -s -X POST "$TELEGRAM_API" \
    -d chat_id="$CHAT_ID" \
    -d text="$message" \
    -d parse_mode="HTML" \
    > /dev/null 2>&1
}

# Check health endpoint (5s timeout)
RESPONSE=$(curl -sf --max-time 5 "$HEALTH_URL" 2>/dev/null)
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  # Parse status from JSON
  STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ "$STATUS" = "healthy" ]; then
    # Healthy — if was down, send recovery alert
    if [ -f "$STATE_FILE" ]; then
      DOWNTIME_START=$(cat "$STATE_FILE")
      send_alert "✅ <b>Contexter RECOVERED</b>
Health: all services OK
Was down since: ${DOWNTIME_START}
Recovered: $(date -Iseconds)"
      rm -f "$STATE_FILE"
    fi
    exit 0
  fi
fi

# Unhealthy or unreachable — alert (but don't spam, only on state change)
if [ ! -f "$STATE_FILE" ]; then
  echo "$(date -Iseconds)" > "$STATE_FILE"

  # Get more details for the alert
  DOCKER_STATUS=$(docker compose -f /opt/contexter/docker-compose.yml ps --format '{{.Name}}: {{.Status}}' 2>/dev/null | tr '\n' '; ')

  send_alert "🔴 <b>Contexter DOWN</b>
Health check failed (exit code: ${EXIT_CODE})
Response: ${RESPONSE:-no response}
Docker: ${DOCKER_STATUS:-unknown}
Time: $(date -Iseconds)
Server: 46.62.220.214"
fi
