import json

from fastapi import APIRouter, Depends, HTTPException

from ..auth import require_bearer
from ..config import Settings, get_settings
from ..deps import get_journal, get_strategy_builder
from ..journal import JournalReader
from ..models import StrategyStats, StrategyToggleRequest
from ..strategies import StrategyStatsBuilder

router = APIRouter(prefix="/api", tags=["strategies"])


@router.get("/strategies", response_model=list[StrategyStats])
async def list_strategies(
    builder: StrategyStatsBuilder = Depends(get_strategy_builder),
) -> list[StrategyStats]:
    return builder.build()


@router.get("/strategies/{name}", response_model=StrategyStats)
async def get_strategy(
    name: str,
    builder: StrategyStatsBuilder = Depends(get_strategy_builder),
) -> StrategyStats:
    for s in builder.build():
        if s.name == name:
            return s
    raise HTTPException(404, detail=f"strategy {name!r} not found")


@router.post("/strategies/{name}/toggle")
async def toggle_strategy(
    name: str,
    body: StrategyToggleRequest,
    settings: Settings = Depends(get_settings),
    journal: JournalReader = Depends(get_journal),
) -> dict:
    config_path = settings.runner_dir / "config.json"
    if not config_path.exists():
        raise HTTPException(500, detail="runner config not found")
    try:
        cfg = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(500, detail=f"runner config malformed: {exc}")

    enabled_list = set(cfg.setdefault("disabled_strategies", []))
    if body.enabled:
        enabled_list.discard(name)
    else:
        enabled_list.add(name)
    cfg["disabled_strategies"] = sorted(enabled_list)

    tmp = config_path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    tmp.replace(config_path)
    return {"name": name, "enabled": body.enabled}
