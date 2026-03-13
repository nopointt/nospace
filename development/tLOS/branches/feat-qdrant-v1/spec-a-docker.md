# SPEC A — Qdrant Docker service

## Задача
Добавить Qdrant в docker-compose.yml tLOS domain memory stack.

## Файл для изменения
`C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-zep-bridge\docker-compose.yml`

## Текущее состояние файла
```yaml
# Два сервиса: db (port 5433) + litellm (port 4000)
# volumes: zep_postgres
```

## Что нужно добавить

### Сервис:
```yaml
  qdrant:
    image: qdrant/qdrant:v1.13.0
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    healthcheck:
      test: ["CMD", "python3", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:6333/healthz')"]
      interval: 10s
      timeout: 5s
      retries: 10
    restart: unless-stopped
```

### Volume (добавить в секцию volumes):
```yaml
  qdrant_data:
```

## Ограничения
- НЕ трогать db и litellm сервисы
- НЕ добавлять зависимости (qdrant независим от db и litellm)
- Порядок в файле: db → litellm → qdrant

## Верификация
После изменения файла выполни:
```bash
cd /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-zep-bridge
NIM_KEY=$(cat ~/.tlos/nim-key) docker compose up -d qdrant
```
Подожди 15 секунд, затем проверь:
```bash
curl -s http://localhost:6333/healthz
```
Ожидаемый ответ: `{"title":"qdrant - ..."}`

Если qdrant healthy — задача выполнена.
