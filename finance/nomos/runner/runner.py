"""Nomos paper trading runner.

Single-process main loop. Polls OHLCV every `check_interval_seconds`,
evaluates each strategy on each pair, dispatches signals to executor
(+ Cramer mirror if enabled). All persistence via journal + scoreboard.
"""

from __future__ import annotations

import importlib
import json
import signal as sig
import sys
import time
import traceback
from pathlib import Path

from executor import Executor
from journal import Journal
from risk_gate import RiskGate
from cramer_mirror import CramerMirror
from scoreboard import Scoreboard
from ccxt_client import build_client
import position_tracker


import os as _os

_DEFAULT_REPO_ROOT = (
    "/opt/nomos" if _os.path.exists("/opt/nomos") else "C:/Users/noadmin/nospace"
)
REPO_ROOT = Path(_os.environ.get("NOMOS_REPO_ROOT", _DEFAULT_REPO_ROOT))


def load_config() -> dict:
    cfg_path = Path(__file__).parent / "config.json"
    with open(cfg_path, "r", encoding="utf-8") as f:
        return json.load(f)


def resolve_path(p: str) -> Path:
    return REPO_ROOT / p if not Path(p).is_absolute() else Path(p)


class Runner:
    def __init__(self, cfg: dict):
        self.cfg = cfg
        self.client = build_client(cfg)
        self.journal = Journal(resolve_path(cfg["paths"]["journal"]))
        self.scoreboard = Scoreboard(
            resolve_path(cfg["paths"]["scoreboard"]),
            resolve_path(cfg["paths"]["portfolio_state"]),
            cfg["start_capital_usd"],
        )
        self.risk = RiskGate(cfg["risk_rules"], resolve_path(cfg["paths"]["halt_flag"]))
        self.cramer = CramerMirror(cfg["cramer_mode"]) if cfg["cramer_mode"]["enabled"] else None
        self.strategies = self._load_strategies(cfg["strategies"])
        self._stop = False

    def _load_strategies(self, strat_cfgs: list[dict]) -> list[dict]:
        loaded = []
        for s in strat_cfgs:
            mod = importlib.import_module(s["module"])
            tf = getattr(mod, "TIMEFRAME", self.cfg["timeframe"])
            loaded.append({
                "cfg": s,
                "signal_fn": mod.signal,
                "name": s["name"],
                "timeframe": tf,
            })
        return loaded

    def stop(self, *_):
        self._stop = True
        print("[runner] stop signal received, finishing current tick...", flush=True)

    def tick(self) -> None:
        ohlcv_cache: dict[tuple, list] = {}
        for strat in self.strategies:
            for pair in strat["cfg"]["pairs"]:
                key = (pair, strat["timeframe"])
                if key not in ohlcv_cache:
                    try:
                        ohlcv_cache[key] = self.client.fetch_ohlcv(
                            pair, strat["timeframe"], limit=self.cfg["ohlcv_lookback"]
                        )
                    except Exception as e:
                        print(f"[runner] fetch_ohlcv({pair},{strat['timeframe']}) failed: {e}", flush=True)
                        ohlcv_cache[key] = None
                ohlcv = ohlcv_cache[key]
                if ohlcv is None:
                    continue

                try:
                    sig_result = strat["signal_fn"](ohlcv)
                except Exception as e:
                    print(f"[runner] strategy {strat['name']} error on {pair}: {e}", flush=True)
                    traceback.print_exc()
                    continue

                if sig_result["action"] == "HOLD":
                    self.journal.append({
                        "event": "tick_hold",
                        "strategy": strat["name"],
                        "pair": pair,
                        "timeframe": strat["timeframe"],
                        "meta": sig_result.get("meta", {}),
                    })
                    continue

                if not self.risk.allow(strat["name"], pair):
                    self.journal.append({
                        "event": "halt_block",
                        "strategy": strat["name"],
                        "pair": pair,
                        "reason": self.risk.reason,
                    })
                    continue

                # Position-aware dedupe: skip if already in that state.
                state_map = position_tracker.build_state(self.journal.read_all())
                current_state = state_map.get((strat["name"], pair), "FLAT")
                skip, reason = position_tracker.should_skip(current_state, sig_result["action"])
                if skip:
                    self.journal.append({
                        "event": "signal_dedup",
                        "strategy": strat["name"],
                        "pair": pair,
                        "action": sig_result["action"],
                        "state": current_state,
                        "reason": reason,
                    })
                    continue

                # Cooldown: min 900s (15 min) between orders for (strategy, pair).
                last_ts = position_tracker.last_entry_ts(self.journal.read_all(), strat["name"], pair)
                if last_ts and (time.time() - last_ts) < 900:
                    self.journal.append({
                        "event": "signal_cooldown",
                        "strategy": strat["name"],
                        "pair": pair,
                        "action": sig_result["action"],
                        "seconds_since_last": int(time.time() - last_ts),
                    })
                    continue

                self._dispatch(strat, pair, sig_result, ohlcv[-1][4])

    def _dispatch(self, strat: dict, pair: str, sig_result: dict, last_price: float) -> None:
        alloc = strat["cfg"]["allocation_usd"] / len(strat["cfg"]["pairs"])
        executor = Executor(self.client, self.journal, strat["name"], alloc)
        executor.place(pair, sig_result["action"], last_price, sig_result.get("meta", {}))

        if self.cramer:
            mirror_tag = strat["name"] + self.cfg["cramer_mode"]["tag_suffix"]
            mirror_alloc = self.cfg["cramer_mode"]["allocation_usd"] / len(self.cfg["pairs"])
            mirror_action = self.cramer.flip(sig_result["action"])
            mirror_state_map = position_tracker.build_state(self.journal.read_all())
            mirror_state = mirror_state_map.get((mirror_tag, pair), "FLAT")
            skip, reason = position_tracker.should_skip(mirror_state, mirror_action)
            if skip:
                self.journal.append({
                    "event": "signal_dedup",
                    "strategy": mirror_tag,
                    "pair": pair,
                    "action": mirror_action,
                    "state": mirror_state,
                    "reason": reason,
                })
                return
            self.cramer.record_virtual(
                journal=self.journal,
                strategy_tag=mirror_tag,
                pair=pair,
                action=mirror_action,
                price=last_price,
                allocation_usd=mirror_alloc,
                meta=sig_result.get("meta", {}),
            )

    def run(self) -> None:
        sig.signal(sig.SIGINT, self.stop)
        sig.signal(sig.SIGTERM, self.stop)
        print(f"[runner] started, {len(self.strategies)} strategies, pairs={self.cfg['pairs']}", flush=True)
        self.journal.append({"event": "runner_start", "strategies": [s["name"] for s in self.strategies]})

        interval = self.cfg["check_interval_seconds"]
        while not self._stop:
            tick_start = time.time()
            try:
                self.tick()
                self.scoreboard.update(self.journal, self.client)
            except Exception as e:
                print(f"[runner] tick error: {e}", flush=True)
                traceback.print_exc()
                self.journal.append({"event": "tick_error", "error": str(e)})

            elapsed = time.time() - tick_start
            sleep_s = max(1, interval - elapsed)
            for _ in range(int(sleep_s)):
                if self._stop:
                    break
                time.sleep(1)

        self.journal.append({"event": "runner_stop"})
        print("[runner] stopped cleanly", flush=True)


def main() -> int:
    cfg = load_config()
    sys.path.insert(0, str(Path(__file__).parent))
    runner = Runner(cfg)
    runner.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
