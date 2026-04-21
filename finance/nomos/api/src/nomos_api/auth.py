"""Bearer token authentication for /api/* routes.

EventSource (SSE) does not support custom headers in browsers — SSE routes may
accept the token via `?token=` query parameter in addition to the Authorization
header.
"""
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Query, status

from .config import Settings, get_settings


def _valid_token(supplied: str | None, settings: Settings) -> bool:
    if supplied is None:
        return False
    return supplied == settings.auth_token.get_secret_value()


async def require_bearer(
    authorization: Annotated[str | None, Header()] = None,
    settings: Settings = Depends(get_settings),
) -> None:
    if authorization is None or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    if not _valid_token(token, settings):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def require_bearer_or_query(
    authorization: Annotated[str | None, Header()] = None,
    token: Annotated[str | None, Query()] = None,
    settings: Settings = Depends(get_settings),
) -> None:
    if authorization and authorization.lower().startswith("bearer "):
        candidate = authorization.split(" ", 1)[1].strip()
        if _valid_token(candidate, settings):
            return
    if _valid_token(token, settings):
        return
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid bearer token",
        headers={"WWW-Authenticate": "Bearer"},
    )
