"""Risk gate: drawdown-based halt logic.

Reads journal-based portfolio state. Blocks new trades if:
  - daily drawdown >= daily_drawdown_pct
  - weekly drawdown >= weekly_drawdown_pct
  - total drawdown >= total_drawdown_pct
Creates halt.flag file when triggered.
"""

from __future__ import annotations

from pathlib import Path


class RiskGate:
    def __init__(self, rules: dict, halt_flag_path: Path):
        self.rules = rules
        self.halt_flag = halt_flag_path
        self.reason: str | None = None

    def allow(self, strategy: str, pair: str) -> bool:
        if self.halt_flag.exists():
            self.reason = "halt.flag present"
            return False
        return True

    def trip(self, reason: str) -> None:
        self.halt_flag.parent.mkdir(parents=True, exist_ok=True)
        self.halt_flag.write_text(reason, encoding="utf-8")
        self.reason = reason

    def check_drawdown(self, metrics: dict) -> str | None:
        if metrics["daily_pct"] <= -self.rules["daily_drawdown_pct"]:
            return f"daily drawdown {metrics['daily_pct']:.2f}% >= {self.rules['daily_drawdown_pct']}%"
        if metrics["weekly_pct"] <= -self.rules["weekly_drawdown_pct"]:
            return f"weekly drawdown {metrics['weekly_pct']:.2f}% >= {self.rules['weekly_drawdown_pct']}%"
        if metrics["total_pct"] <= -self.rules["total_drawdown_pct"]:
            return f"total drawdown {metrics['total_pct']:.2f}% >= {self.rules['total_drawdown_pct']}%"
        return None
