# Harkly Financial Dashboard

Финансовая модель Harkly 2026 — бэкенд на Python, фронтенд на JavaScript.

## 📁 Файлы

| Файл | Описание |
|------|----------|
| `model.py` | **Бэкенд** — основная финансовая модель (CFO alignment) |
| `harkly_model.py` | Расширенная модель с unit economics |
| `server.py` | **API сервер** — HTTP API для дашборда |
| `dashboard_fixed.html` | **Фронтенд (standalone)** — работает без API, вся логика внутри |
| `dashboard_api.html` | **Фронтенд (API mode)** — подключается к server.py |
| `api.py` | Flask API (альтернатива server.py, требует flask) |

## 🚀 Запуск

### Вариант 1: Dashboard с API (рекомендуется)

1. **Запустить API сервер:**
   ```bash
   cd c:\Users\noadmin\nospace\docs\harkly\economics
   python server.py
   ```
   
2. **Открыть дашборд:**
   ```bash
   start dashboard_api.html
   ```

3. **Использовать:**
   - Меняй параметры в левой панели
   - Данные пересчитываются через API (model.py)
   - Статус API показывается в хедере

### Вариант 2: Dashboard standalone (без сервера)

```bash
start dashboard_fixed.html
```

- Вся логика внутри HTML
- Не требует Python/сервера
- Меньше точность (JS реализация)

## 📊 Модели

### model.py (CFO alignment)
- **Revenue 2026:** $119,000
- **Gross Profit:** $16,310 (13.7%)
- **Dec MRR:** $43,600
- **WL партнёров:** 4

### harkly_model.py (unit economics)
- **Revenue 2026:** $79,774
- **Dec MRR:** $21,987
- **LTV:CAC:** 31-74:1

## 🔧 API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/state` | GET | Получить состояние по умолчанию |
| `/api/simulate` | POST | Запустить симуляцию с параметрами |
| `/api/model-info` | GET | Получить константы модели |

### Пример запроса

```bash
curl -X POST http://localhost:5000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"cm": 1.2, "pS": 75}'
```

## 📝 Синхронизация

### Константы (model.py ↔ dashboard)

| Параметр | model.py | dashboard |
|----------|----------|-----------|
| Цены тарифов | `PRICE_START=50` | `pS: 50` |
| Кредиты | `CREDITS_START=250` | `crS: 250` |
| Churn | `CHURN["start"]=0.05` | `cS: 0.05` |
| COGS | `RAW_COGS=0.0085` | `rawCogs: 0.0085` |
| WL квоты | `WL_BASE_CREDITS` | `wlBase: 150000` |

### Формулы

Обе модели используют одинаковые формулы:
- Воронка: free → start → pro → ent
- Churn применяется до конверсии
- WL события накапливаются (stack)
- COGS = credits × consumption × eff_cogs

## ⚠️ Заметки

1. **WL GM%** — считается при 60% consumption (реалистично)
2. **Breakage** — 15% кредитов не потребляется
3. **Artem commission** — 20% GP от Enterprise + WL
4. **Owner draw** — $2000/мес с мая

## 📦 Зависимости

- **server.py:** Python stdlib (без зависимостей)
- **api.py:** `pip install flask flask-cors`
- **model.py:** Python stdlib
- **dashboard:** Современный браузер

---
*Сгенерировано: 2026-02-25 | model.py бэкенд v1.0*
