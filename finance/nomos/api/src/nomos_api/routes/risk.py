from fastapi import APIRouter, Depends

from ..auth import require_bearer
from ..deps import get_alerts, get_risk
from ..models import HaltRequest, RiskSnapshot
from ..risk import RiskMonitor
from ..alerts import TelegramAlerter

router = APIRouter(prefix="/api", tags=["risk"])


@router.get("/risk", response_model=RiskSnapshot)
async def get_risk_snapshot(risk: RiskMonitor = Depends(get_risk)) -> RiskSnapshot:
    return risk.snapshot()


@router.post("/halt")
async def halt(
    body: HaltRequest,
    risk: RiskMonitor = Depends(get_risk),
    alerts: TelegramAlerter = Depends(get_alerts),
) -> dict:
    risk.set_halt(body.reason)
    await alerts.on_halt(body.reason)
    return {"halt_active": True, "reason": body.reason}


@router.delete("/halt")
async def resume(
    risk: RiskMonitor = Depends(get_risk),
    alerts: TelegramAlerter = Depends(get_alerts),
) -> dict:
    cleared = risk.clear_halt()
    if cleared:
        await alerts.on_resume()
    return {"halt_active": False, "was_active": cleared}
