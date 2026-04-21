"""FastAPI application factory for nomos-api."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .alerts import TelegramAlerter
from .config import Settings, get_settings
from .journal import JournalReader
from .journal_watcher import JournalWatcher
from .live_prices import LivePriceCache
from .portfolio import PortfolioAggregator
from .risk import RiskMonitor
from .routes import balance, charts, health, live, rag, risk, runner, strategies, trades
from .runner_control import RunnerControl
from .sse import SSEBroker
from .strategies import StrategyStatsBuilder


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-7s %(name)s %(message)s",
)
log = logging.getLogger("nomos.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = app.state.settings
    log.info("nomos-api v%s starting (env=%s)", __version__, settings.env)

    journal = JournalReader(settings.journal_path)
    sse = SSEBroker()
    portfolio = PortfolioAggregator(journal, settings.portfolio_state_path)
    strategy_builder = StrategyStatsBuilder(journal, settings.runner_dir / "config.json")
    risk = RiskMonitor(journal, portfolio, settings)
    runner_ctrl = RunnerControl(settings.runner_container_name)
    live_prices = LivePriceCache(sse, settings.live_price_pairs, settings.live_price_poll_seconds)
    journal_watcher = JournalWatcher(settings.journal_path, sse)
    alerts = TelegramAlerter(settings)

    app.state.journal = journal
    app.state.sse = sse
    app.state.portfolio = portfolio
    app.state.strategy_builder = strategy_builder
    app.state.risk = risk
    app.state.runner_control = runner_ctrl
    app.state.live_prices = live_prices
    app.state.journal_watcher = journal_watcher
    app.state.alerts = alerts

    live_prices.start()
    journal_watcher.start()

    try:
        yield
    finally:
        await live_prices.stop()
        await journal_watcher.stop()
        log.info("nomos-api shutdown complete")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="Nomos API",
        version=__version__,
        lifespan=lifespan,
    )
    app.state.settings = settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(balance.router)
    app.include_router(trades.router)
    app.include_router(strategies.router)
    app.include_router(risk.router)
    app.include_router(runner.router)
    app.include_router(live.router)
    app.include_router(charts.router)
    app.include_router(rag.router)

    return app


app = create_app()
