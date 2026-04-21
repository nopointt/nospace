"""CCXT client factory. Loads keys from env file, applies sandbox mode."""

from __future__ import annotations

import os
from pathlib import Path

import ccxt


def _load_env_file(path_str: str) -> None:
    path = Path(os.path.expanduser(path_str))
    if not path.exists():
        raise FileNotFoundError(f"keys_env_file not found: {path}")
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ[k.strip()] = v.strip()


def build_client(cfg: dict):
    exchange_id = cfg["exchange"]
    key_name = f"{exchange_id.upper()}_TESTNET_API_KEY" if cfg["sandbox"] else f"{exchange_id.upper()}_API_KEY"
    sec_name = f"{exchange_id.upper()}_TESTNET_SECRET" if cfg["sandbox"] else f"{exchange_id.upper()}_SECRET"
    # Prefer env vars supplied by docker / .env; fall back to keys_env_file (local dev only).
    api_key = os.environ.get(key_name) or os.environ.get(f"NOMOS_{key_name}")
    secret = os.environ.get(sec_name) or os.environ.get(f"NOMOS_{sec_name}")
    if (not api_key or not secret) and cfg.get("keys_env_file"):
        try:
            _load_env_file(cfg["keys_env_file"])
            api_key = api_key or os.environ.get(key_name)
            secret = secret or os.environ.get(sec_name)
        except FileNotFoundError:
            pass
    if not api_key or not secret:
        raise RuntimeError(f"missing {key_name} / {sec_name} in env")
    klass = getattr(ccxt, exchange_id)
    client = klass({
        "apiKey": api_key,
        "secret": secret,
        "enableRateLimit": True,
        "timeout": 30000,
        "options": {"defaultType": "spot"},
    })
    if cfg["sandbox"]:
        client.set_sandbox_mode(True)
    return client
