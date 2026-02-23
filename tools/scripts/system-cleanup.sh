#!/bin/bash
# SYSTEM CLEANUP SCRIPT (Non-AI Utility)
# Clears stale workspaces and expired tokens

set -euo pipefail

WORKSPACE_ROOT="/noadmin"
TEMP_DIR="$WORKSPACE_ROOT/temp"
AUTH_GATES_DIR="$WORKSPACE_ROOT/tools/auth-gates"

echo "[Cleanup] Starting maintenance cycle..."

# 1. Nuke ephemeral scratchpads & compiled obj files not in a Docker sandbox
echo "-> Cleaning $TEMP_DIR..."
find "$TEMP_DIR" -type f -mtime +1 -delete
find "$TEMP_DIR" -type d -empty -delete

# 2. Expire ephemeral tokens older than 15 minutes
echo "-> Rotating tokens..."
if [ -f "$AUTH_GATES_DIR/ephemeral-tokens.yaml" ]; then
    # In reality, parse yaml and drop expired. Here we flush all generic tokens.
    echo "active_tokens: []" > "$AUTH_GATES_DIR/ephemeral-tokens.yaml"
    echo "   Flushed ephemeral-tokens.yaml"
fi

# 3. Prune dangling Docker sandbox images
echo "-> Pruning sandboxes..."
docker system prune -f --filter "label=tlos-sandboxed=true" --filter "until=2h" || true

echo "[Cleanup] Complete."
