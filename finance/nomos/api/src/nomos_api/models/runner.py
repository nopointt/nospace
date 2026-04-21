from typing import Literal

from pydantic import BaseModel


class RunnerStatus(BaseModel):
    running: bool
    state: Literal["running", "stopped", "restarting", "paused", "exited", "unknown"] = "unknown"
    container_id: str | None = None
    started_at: int | None = None
    last_tick_ts: int | None = None
    image: str | None = None
