"""Runtime configuration loaded from environment variables."""
from pathlib import Path
from typing import Literal

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="NOMOS_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: Literal["dev", "prod"] = "dev"
    auth_token: SecretStr
    cors_origins: list[str] = ["http://localhost:5173"]
    live_price_pairs: list[str] = ["BTC/USDT", "ETH/USDT"]

    @field_validator("cors_origins", "live_price_pairs", mode="before")
    @classmethod
    def _split_csv_or_json(cls, v):
        if isinstance(v, str):
            s = v.strip()
            if s.startswith("["):
                import json
                return json.loads(s)
            return [item.strip() for item in s.split(",") if item.strip()]
        return v

    runner_dir: Path = Path("/opt/nomos/runner")
    journal_path: Path = Path("/opt/nomos/memory/trading/journal.jsonl")
    portfolio_state_path: Path = Path("/opt/nomos/memory/trading/portfolio-state.json")
    halt_flag_path: Path = Path("/opt/nomos/memory/trading/halt.flag")

    runner_container_name: str = "nomos-runner"

    binance_testnet_api_key: SecretStr | None = None
    binance_testnet_secret: SecretStr | None = None

    qdrant_url: str = "http://localhost:6333"
    rag_enabled: bool = False

    telegram_bot_token: SecretStr | None = None
    telegram_chat_id: str | None = None

    live_price_poll_seconds: int = 5

    daily_drawdown_threshold_pct: float = 3.0
    weekly_drawdown_threshold_pct: float = 8.0
    total_drawdown_threshold_pct: float = 20.0


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def reset_settings_cache() -> None:
    global _settings
    _settings = None
