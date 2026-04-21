import time

from fastapi import APIRouter

from .. import __version__

router = APIRouter(tags=["health"])
_boot_ts = int(time.time())


@router.get("/health")
async def health() -> dict:
    return {
        "ok": True,
        "version": __version__,
        "uptime_s": int(time.time()) - _boot_ts,
    }
