FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN pip install \
      "ccxt>=4.5.0" \
      "numpy>=1.26.0" \
      "pandas>=2.2.0" \
      "python-dotenv>=1.0.0" \
      "httpx>=0.27.0"

COPY . /app/

CMD ["python", "runner.py"]
