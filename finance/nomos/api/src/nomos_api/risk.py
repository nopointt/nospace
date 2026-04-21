"""Risk aggregator: drawdown + halt flag read/write."""
from __future__ import annotations

import time
from pathlib import Path

from .config import Settings
from .journal import JournalReader
from .models import RiskSnapshot
from .portfolio import PortfolioAggregator


class RiskMonitor:
    def __init__(
        self,
        journal: JournalReader,
        portfolio: PortfolioAggregator,
        settings: Settings,
        start_capital_usd: float = 10000.0,
    ):
        self.journal = journal
        self.portfolio = portfolio
        self.settings = settings
        self.start_capital_usd = start_capital_usd

    def _drawdown_since(self, seconds_ago: int) -> float:
        now = int(time.time())
        baseline_ts = now - seconds_ago
        entries = self.journal.trades(since_ts=baseline_ts, include_virtual=False)
        if not entries:
            return 0.0
        current_bal = self.portfolio.balance_from_trades(usdt_start=self.start_capital_usd)
        return 0.0 if self.start_capital_usd == 0 else (
            (current_bal.total_usd - self.start_capital_usd) / self.start_capital_usd * 100
        )

    def snapshot(self) -> RiskSnapshot:
        current = self.portfolio.balance_from_trades(usdt_start=self.start_capital_usd)
        total_pnl_pct = (
            (current.total_usd - self.start_capital_usd) / self.start_capital_usd * 100
            if self.start_capital_usd
            else 0.0
        )
        halt_active, halt_reason = self.read_halt()
        return RiskSnapshot(
            updated_at=int(time.time()),
            daily_pnl_pct=self._drawdown_since(86400),
            weekly_pnl_pct=self._drawdown_since(7 * 86400),
            total_pnl_pct=total_pnl_pct,
            halt_active=halt_active,
            halt_reason=halt_reason,
            daily_threshold_pct=self.settings.daily_drawdown_threshold_pct,
            weekly_threshold_pct=self.settings.weekly_drawdown_threshold_pct,
            total_threshold_pct=self.settings.total_drawdown_threshold_pct,
        )

    def read_halt(self) -> tuple[bool, str | None]:
        path = self.settings.halt_flag_path
        if not path.exists():
            return False, None
        try:
            reason = path.read_text(encoding="utf-8").strip() or "(no reason)"
            return True, reason
        except OSError:
            return True, "(unreadable)"

    def set_halt(self, reason: str) -> None:
        path = self.settings.halt_flag_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(reason, encoding="utf-8")

    def clear_halt(self) -> bool:
        path = self.settings.halt_flag_path
        if path.exists():
            path.unlink()
            return True
        return False
