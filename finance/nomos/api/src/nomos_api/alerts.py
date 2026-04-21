"""Telegram alert sender (D-10)."""
from __future__ import annotations

import logging

import httpx

from .config import Settings

log = logging.getLogger("nomos.alerts")


class TelegramAlerter:
    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def _enabled(self) -> bool:
        return (
            self.settings.telegram_bot_token is not None
            and self.settings.telegram_chat_id is not None
        )

    async def send(self, text: str) -> bool:
        if not self._enabled:
            log.debug("telegram disabled, skipping: %s", text[:80])
            return False
        assert self.settings.telegram_bot_token is not None
        token = self.settings.telegram_bot_token.get_secret_value()
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.post(
                    url,
                    json={
                        "chat_id": self.settings.telegram_chat_id,
                        "text": text,
                        "parse_mode": "HTML",
                        "disable_web_page_preview": True,
                    },
                )
                r.raise_for_status()
            return True
        except httpx.HTTPError as exc:
            log.warning("telegram send failed: %s", exc)
            return False

    async def on_halt(self, reason: str) -> None:
        await self.send(f"🛑 <b>Nomos HALT</b>\n<code>{reason}</code>")

    async def on_resume(self) -> None:
        await self.send("▶️ <b>Nomos resumed</b>")

    async def on_order_error(self, detail: str) -> None:
        await self.send(f"⚠️ <b>Nomos order error</b>\n<code>{detail}</code>")

    async def on_runner_state(self, state: str) -> None:
        emoji = "🟢" if state == "running" else "🔴"
        await self.send(f"{emoji} <b>Runner {state}</b>")
