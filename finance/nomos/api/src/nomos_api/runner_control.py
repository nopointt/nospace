"""Runner control via Docker API (D-11).

The Nomos runner lives as a separate docker-compose service (`nomos-runner`).
Backend controls lifecycle via the Docker SDK over the socket mounted into the
backend container: `/var/run/docker.sock:/var/run/docker.sock`.

Local dev: runner container may not exist — gracefully return a 'missing' state.
"""
from __future__ import annotations

import time
from typing import TYPE_CHECKING

from .models import RunnerStatus

if TYPE_CHECKING:
    from docker.models.containers import Container  # pragma: no cover


class RunnerControl:
    def __init__(self, container_name: str):
        self.container_name = container_name
        self._docker_client = None

    def _client(self):
        if self._docker_client is None:
            import docker  # lazy import — optional at dev time

            self._docker_client = docker.from_env()
        return self._docker_client

    def _container(self) -> "Container | None":
        try:
            from docker.errors import NotFound

            return self._client().containers.get(self.container_name)
        except Exception:
            try:
                if isinstance(self._last_exc(), NotFound):  # type: ignore[attr-defined]
                    return None
            except Exception:
                pass
            return None

    def _last_exc(self):
        import sys

        return sys.exc_info()[1]

    def status(self) -> RunnerStatus:
        try:
            c = self._container()
        except Exception:
            return RunnerStatus(running=False, state="unknown")
        if c is None:
            return RunnerStatus(running=False, state="unknown")
        c.reload()
        state = c.attrs.get("State", {})
        started_str = state.get("StartedAt", "")
        started_ts: int | None = None
        if started_str:
            try:
                import datetime as dt

                started_ts = int(
                    dt.datetime.fromisoformat(started_str.replace("Z", "+00:00")).timestamp()
                )
            except ValueError:
                started_ts = None
        running = state.get("Running", False)
        return RunnerStatus(
            running=running,
            state=state.get("Status", "unknown") or ("running" if running else "stopped"),
            container_id=c.id[:12] if c.id else None,
            started_at=started_ts,
            image=c.attrs.get("Config", {}).get("Image"),
        )

    def start(self) -> RunnerStatus:
        c = self._container()
        if c is None:
            raise RuntimeError(
                f"Container {self.container_name!r} not found. Ensure docker-compose has been run with the nomos-runner service."
            )
        c.reload()
        if c.attrs.get("State", {}).get("Running"):
            return self.status()
        c.start()
        # poll briefly for state change
        for _ in range(10):
            c.reload()
            if c.attrs.get("State", {}).get("Running"):
                break
            time.sleep(0.5)
        return self.status()

    def stop(self, timeout_s: int = 10) -> RunnerStatus:
        c = self._container()
        if c is None:
            raise RuntimeError(f"Container {self.container_name!r} not found")
        c.reload()
        if not c.attrs.get("State", {}).get("Running"):
            return self.status()
        c.stop(timeout=timeout_s)
        return self.status()

    def restart(self, timeout_s: int = 10) -> RunnerStatus:
        c = self._container()
        if c is None:
            raise RuntimeError(f"Container {self.container_name!r} not found")
        c.restart(timeout=timeout_s)
        return self.status()
