#!/bin/bash
# F-033: Netdata custom collector for RAGAS quality metrics
# Called by Netdata every 60s via the "charts.d" or "exec" plugin.
# Output format: SET variable_name value
# DATABASE_URL must be set in the environment (e.g. /etc/netdata/netdata.conf or systemd unit).

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "SET ragas_faithfulness_7d -1"
  echo "SET ragas_retrieval_score_7d -1"
  exit 0
fi

FAITHFULNESS=$(psql "$DATABASE_URL" -At -c "
  SELECT COALESCE(AVG((llm_eval->>'faithfulness')::float), -1)
  FROM eval_metrics
  WHERE queried_at > NOW() - INTERVAL '7 days'
    AND llm_eval IS NOT NULL;
" 2>/dev/null || echo "-1")

echo "SET ragas_faithfulness_7d $FAITHFULNESS"

RETRIEVAL=$(psql "$DATABASE_URL" -At -c "
  SELECT COALESCE(AVG(retrieval_score_mean), -1)
  FROM eval_metrics
  WHERE queried_at > NOW() - INTERVAL '7 days';
" 2>/dev/null || echo "-1")

echo "SET ragas_retrieval_score_7d $RETRIEVAL"
