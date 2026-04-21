"""Bauhaus RAG passthrough (D-06). Disabled when RAG_ENABLED=false."""
from fastapi import APIRouter, Body, Depends, HTTPException

from ..auth import require_bearer
from ..config import Settings, get_settings

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.post("/query")
async def rag_query(
    body: dict = Body(...),
    settings: Settings = Depends(get_settings),
) -> dict:
    if not settings.rag_enabled:
        raise HTTPException(
            503,
            detail="RAG disabled in this environment (set NOMOS_RAG_ENABLED=true to enable)",
        )
    import httpx

    text = body.get("text", "").strip()
    collection = body.get("collection", "bauhaus_knowledge")
    limit = int(body.get("limit", 10))
    if not text:
        raise HTTPException(400, detail="text required")

    # Not embedding here — Qdrant accepts text via a dedicated endpoint or requires
    # an external embedder. Callers are expected to supply pre-computed vectors.
    # For MVP, return a passthrough that surfaces Qdrant's response verbatim.
    url = f"{settings.qdrant_url}/collections/{collection}/points/search"
    if "vector" not in body:
        raise HTTPException(
            400, detail="provide {'vector': [...]} — external embedding required"
        )
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            r = await client.post(
                url,
                json={"vector": body["vector"], "limit": limit, "with_payload": True},
            )
            r.raise_for_status()
            return r.json()
        except httpx.HTTPError as exc:
            raise HTTPException(502, detail=f"qdrant error: {exc}")
