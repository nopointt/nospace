"""
NLI sidecar — HHEM-2.1-Open (vectara/hallucination_evaluation_model)
FastAPI server on port 8765. CPU-only inference on ARM64.
"""
import asyncio
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline


# ---------------------------------------------------------------------------
# Model state — loaded once at startup
# ---------------------------------------------------------------------------

_pipe: Any = None


def _load_model() -> Any:
    return pipeline(
        "text-classification",
        model="vectara/hallucination_evaluation_model",
        device=-1,  # CPU only — no GPU on CAX11
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _pipe
    print("Loading HHEM-2.1-Open model...")
    # Load model in executor to avoid blocking the event loop during startup
    loop = asyncio.get_event_loop()
    _pipe = await loop.run_in_executor(None, _load_model)
    print("Model ready.")
    yield
    _pipe = None


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(lifespan=lifespan)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class NliPair(BaseModel):
    premise: str
    hypothesis: str


class NliRequest(BaseModel):
    pairs: list[NliPair]


class NliResponse(BaseModel):
    scores: list[float]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/nli", response_model=NliResponse)
def nli(req: NliRequest) -> NliResponse:
    if _pipe is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    if not req.pairs:
        return NliResponse(scores=[])

    # Build input strings in HHEM format: "premise [SEP] hypothesis"
    inputs = [
        f"{pair.premise} </s></s> {pair.hypothesis}"
        for pair in req.pairs
    ]

    raw = _pipe(inputs, truncation=True, max_length=512, batch_size=len(inputs))

    scores: list[float] = []
    for result in raw:
        label: str = result["label"]
        score: float = result["score"]
        # HHEM: "CONSISTENT" -> factual consistency probability
        #       "INCONSISTENT" -> 1 - score gives consistency
        if label == "CONSISTENT":
            scores.append(float(score))
        else:
            scores.append(float(1.0 - score))

    return NliResponse(scores=scores)
