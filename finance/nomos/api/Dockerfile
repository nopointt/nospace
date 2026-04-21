FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install dependencies via a bare-bones requirements list so rebuilds only
# re-hit layers when deps change.
RUN pip install \
      "fastapi>=0.115.0" \
      "uvicorn[standard]>=0.30.0" \
      "pydantic>=2.9.0" \
      "pydantic-settings>=2.5.0" \
      "sse-starlette>=2.1.0" \
      "httpx>=0.27.0" \
      "ccxt>=4.5.0" \
      "docker>=7.1.0" \
      "python-multipart>=0.0.12"

COPY pyproject.toml ./
COPY src/ src/

RUN pip install --no-deps -e .

EXPOSE 8100

CMD ["uvicorn", "nomos_api.main:app", "--host", "0.0.0.0", "--port", "8100", "--proxy-headers", "--forwarded-allow-ips", "*"]
