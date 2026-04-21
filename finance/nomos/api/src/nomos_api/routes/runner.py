import json

from fastapi import APIRouter, Body, Depends, HTTPException

from ..auth import require_bearer
from ..config import Settings, get_settings
from ..deps import get_alerts, get_journal, get_runner_control
from ..journal import JournalReader
from ..models import RunnerStatus
from ..runner_control import RunnerControl
from ..alerts import TelegramAlerter

router = APIRouter(prefix="/api/runner", tags=["runner"], dependencies=[Depends(require_bearer)])


@router.get("/status", response_model=RunnerStatus)
async def status(
    rc: RunnerControl = Depends(get_runner_control),
    journal: JournalReader = Depends(get_journal),
) -> RunnerStatus:
    s = rc.status()
    s.last_tick_ts = journal.latest_ts()
    return s


@router.post("/start", response_model=RunnerStatus)
async def start(
    rc: RunnerControl = Depends(get_runner_control),
    alerts: TelegramAlerter = Depends(get_alerts),
) -> RunnerStatus:
    try:
        s = rc.start()
    except RuntimeError as exc:
        raise HTTPException(404, detail=str(exc))
    await alerts.on_runner_state("running")
    return s


@router.post("/stop", response_model=RunnerStatus)
async def stop(
    rc: RunnerControl = Depends(get_runner_control),
    alerts: TelegramAlerter = Depends(get_alerts),
) -> RunnerStatus:
    try:
        s = rc.stop()
    except RuntimeError as exc:
        raise HTTPException(404, detail=str(exc))
    await alerts.on_runner_state("stopped")
    return s


@router.post("/restart", response_model=RunnerStatus)
async def restart(
    rc: RunnerControl = Depends(get_runner_control),
) -> RunnerStatus:
    try:
        return rc.restart()
    except RuntimeError as exc:
        raise HTTPException(404, detail=str(exc))


@router.get("/config")
async def get_config(settings: Settings = Depends(get_settings)) -> dict:
    path = settings.runner_dir / "config.json"
    if not path.exists():
        raise HTTPException(404, detail="runner config not found")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(500, detail=f"malformed config: {exc}")


@router.put("/config")
async def put_config(
    new_config: dict = Body(...),
    settings: Settings = Depends(get_settings),
    rc: RunnerControl = Depends(get_runner_control),
) -> dict:
    path = settings.runner_dir / "config.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    # minimal schema validation: must be dict with known keys; allow extras
    if not isinstance(new_config, dict) or "strategies" not in new_config:
        raise HTTPException(400, detail="config must be an object with a 'strategies' key")
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(new_config, indent=2), encoding="utf-8")
    tmp.replace(path)
    try:
        rc.restart()
    except RuntimeError:
        pass  # container not running yet — config persisted anyway
    return {"saved": True, "path": str(path)}
