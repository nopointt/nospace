"""FastAPI dependency providers.

Singletons attached to ``app.state`` are surfaced through these helpers so tests
can override them.
"""
from __future__ import annotations

from fastapi import Request

from .alerts import TelegramAlerter
from .journal import JournalReader
from .journal_watcher import JournalWatcher
from .live_prices import LivePriceCache
from .portfolio import PortfolioAggregator
from .risk import RiskMonitor
from .runner_control import RunnerControl
from .sse import SSEBroker
from .strategies import StrategyStatsBuilder


def get_journal(request: Request) -> JournalReader:
    return request.app.state.journal


def get_portfolio(request: Request) -> PortfolioAggregator:
    return request.app.state.portfolio


def get_strategy_builder(request: Request) -> StrategyStatsBuilder:
    return request.app.state.strategy_builder


def get_risk(request: Request) -> RiskMonitor:
    return request.app.state.risk


def get_runner_control(request: Request) -> RunnerControl:
    return request.app.state.runner_control


def get_sse(request: Request) -> SSEBroker:
    return request.app.state.sse


def get_live_prices(request: Request) -> LivePriceCache:
    return request.app.state.live_prices


def get_journal_watcher(request: Request) -> JournalWatcher:
    return request.app.state.journal_watcher


def get_alerts(request: Request) -> TelegramAlerter:
    return request.app.state.alerts
