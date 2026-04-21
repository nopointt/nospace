"""Strategy stats aggregator (reads journal + runner config)."""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from .journal import JournalReader, TRADE_EVENTS
from .models import StrategyStats


class StrategyStatsBuilder:
    def __init__(self, journal: JournalReader, runner_config_path: Path):
        self.journal = journal
        self.runner_config_path = runner_config_path

    def _load_runner_config(self) -> dict:
        if not self.runner_config_path.exists():
            return {}
        try:
            return json.loads(self.runner_config_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {}

    def build(self) -> list[StrategyStats]:
        cfg = self._load_runner_config()
        config_strategies = {s["name"]: s for s in cfg.get("strategies", [])}
        timeframe = cfg.get("timeframe")

        known: dict[str, StrategyStats] = {}

        for name, spec in config_strategies.items():
            known[name] = StrategyStats(
                name=name,
                type="real",
                enabled=True,
                timeframe=spec.get("timeframe", timeframe),
                pairs=spec.get("pairs", cfg.get("pairs", [])),
            )

        cramer_cfg = cfg.get("cramer_mode", {})
        if cramer_cfg.get("enabled"):
            suffix = cramer_cfg.get("tag_suffix", "_cramer")
            for name in list(config_strategies.keys()):
                vname = f"{name}{suffix}"
                if vname not in known:
                    known[vname] = StrategyStats(
                        name=vname,
                        type="virtual",
                        enabled=True,
                        timeframe=config_strategies[name].get("timeframe", timeframe),
                        pairs=config_strategies[name].get("pairs", cfg.get("pairs", [])),
                    )

        position_state: dict[str, dict[str, str]] = defaultdict(dict)
        last_signal: dict[str, tuple[int, str]] = {}

        for entry in self.journal.read_all():
            if entry.strategy is None:
                continue
            name = entry.strategy
            if name not in known:
                known[name] = StrategyStats(
                    name=name,
                    type="virtual" if entry.event == "virtual_filled" else "real",
                    enabled=True,
                )

            stats = known[name]

            if entry.event in TRADE_EVENTS:
                stats.trades += 1
                cost = entry.cost or (entry.amount or 0) * (entry.price or 0)
                stats.volume_usd += cost
                if entry.side == "buy":
                    stats.buys += 1
                    if entry.pair:
                        position_state[name][entry.pair] = "LONG"
                elif entry.side == "sell":
                    stats.sells += 1
                    if entry.pair:
                        position_state[name][entry.pair] = "FLAT"
                last_signal[name] = (entry.ts, entry.side or entry.event)
            elif entry.event in ("tick_hold", "signal_cooldown", "signal_dedup"):
                if entry.ts > last_signal.get(name, (0, ""))[0]:
                    last_signal[name] = (entry.ts, entry.event)

        for name, stats in known.items():
            if name in last_signal:
                ts, action = last_signal[name]
                stats.last_signal_ts = ts
                stats.last_signal_action = action
            stats.position_state = {k: v for k, v in position_state.get(name, {}).items()}  # type: ignore[assignment]

        return list(known.values())
