---
# sim-mode-spec.md — Simulated Execution Mode
> Layer: L3 extension | Status: PLANNED | Opened: 2026-04-21 (session 4)
> Parent epic: nomos-phase1 (runner)
---

## Goal

Добавить в runner режим **виртуального исполнения** с **максимально реалистичными условиями**: fees, slippage, latency, partial fills. Цель — масштабировать до **10 стратегий × 10 пар** без ограничений testnet-бюджета, сохраняя реалистичную оценку P&L.

**Running mode matrix:**

| Mode | Executor calls | Budget | Use |
|---|---|---|---|
| `real` | Binance mainnet | real money | Phase 1C production |
| `testnet` | Binance testnet | $10K default | integration validation (current) |
| **`sim`** | **journal only** | **any** | **scale experiments (new)** |

Режимы могут работать **параллельно** — разные стратегии могут быть в разных режимах (напр. 3 стратегии на testnet для integration check + 10 стратегий в sim для scale).

---

## Реалистичные условия (самое важное)

### 1. Fees (комиссии Binance spot — verify at implementation)

Базовая ставка Binance spot: **0.1% maker, 0.1% taker** (market order → taker).  
С BNB fee: 0.075%. Наш runner сейчас размещает market orders → всегда **taker 0.1%**.

В sim mode: при каждом `simulated_filled` вычитать **0.1% от cost** в отдельное поле `fee_usd`. При подсчёте P&L учитывать накопленные fees.

Config:
```json
"sim_mode": {
  "fee_rate_taker": 0.001,    // 0.1%
  "fee_rate_maker": 0.0008,   // 0.08% (если будут limit orders)
  "use_bnb_discount": false   // если true → 25% скидка
}
```

### 2. Slippage (проскальзывание)

Когда заказ на $1000 "ударяет" по order book — реальная средняя цена хуже last_price на величину зависящую от depth и размера заказа.

**Простая модель (MVP):**
- slippage_pct = `base_slippage + (order_size_usd / liquidity_factor)`
- base_slippage = 0.02% (постоянный bid-ask spread проскок)
- liquidity_factor per pair:
  - BTC/USDT, ETH/USDT = $10M (дефолт — любой размер незаметен)
  - Middle caps (BNB, SOL, XRP) = $1M
  - Small caps = $100K

Формула для market BUY: `exec_price = last_price × (1 + slippage_pct)`
Для market SELL: `exec_price = last_price × (1 - slippage_pct)`

**Продвинутая модель (Phase 2 sim):**
- Fetch actual order book через CCXT `fetch_order_book(pair, limit=20)`
- Walk the book: накапливаем asks/bids пока не наберётся нужный amount
- Вычисляем weighted average exec price
- Это даёт реальное slippage для текущего market depth

Рекомендация: MVP с простой формулой, добавить orderbook walk через 2-3 недели когда увидим значимость.

### 3. Latency (задержка)

В реальности: от сигнала до fill проходит 200-800ms. За это время цена может сдвинуться.

**Модель:** взять `last_price` из OHLCV → добавить мини-дрейф `random.gauss(0, volatility × sqrt(latency/timeframe))` → использовать как exec_price.

Дефолт: latency = 500ms, volatility_proxy = ATR(14) / close.

Для MVP — можно пропустить (slippage model уже поглощает это частично).

### 4. Partial fills

Крупные limit orders часто исполняются частично. Market orders обычно fill полностью на крупных парах.

**Модель для sim MVP:** все orders fill 100% instantly. (Реалистично для BTC/ETH с нашими размерами $1-10K.)

Для малых пар + больших orders добавить вероятность 80-95% fill → log `partial_filled` event с остатком.

### 5. Rejected orders

Binance может отклонить order если:
- Недостаточно баланса
- Min notional не выполнен ($10 на большинстве пар)
- Precision нарушена

**Sim mode симулирует:**
- Tracking виртуального баланса per strategy
- Rejection если не хватает
- Journal event `order_rejected` с причиной

### 6. Weekend/downtime

Crypto 24/7 — не проблема для spot. Для futures или stocks было бы важно. **Skip для Phase 1.**

---

## Config changes (`runner/config.json`)

```json
{
  "execution_mode": "mixed",

  "execution_profiles": {
    "binance_testnet": {
      "type": "real",
      "exchange": "binance",
      "sandbox": true,
      "keys_env_file": "~/.tlos/binance-testnet"
    },
    "binance_sim": {
      "type": "sim",
      "exchange_reference": "binance",
      "sandbox": false,
      "initial_balance_usd": 100000,
      "fee_rate_taker": 0.001,
      "fee_rate_maker": 0.0008,
      "slippage_model": "simple",
      "liquidity_factor_usd": {
        "BTC/USDT": 10000000,
        "ETH/USDT": 10000000,
        "BNB/USDT": 1000000,
        "SOL/USDT": 1000000,
        "XRP/USDT": 500000,
        "DEFAULT": 100000
      },
      "base_slippage_pct": 0.0002,
      "latency_ms": 500,
      "simulate_rejection": true,
      "min_notional_usd": 10
    }
  },

  "strategies": [
    {
      "name": "macd_trend",
      "profile": "binance_testnet",
      "allocation_usd": 2500,
      "pairs": ["BTC/USDT", "ETH/USDT"]
    },
    {
      "name": "basic_ema_rsi_sim",
      "profile": "binance_sim",
      "module": "strategies.basic_ema_rsi",
      "allocation_usd": 5000,
      "pairs": ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT", "BNB/USDT"]
    }
  ]
}
```

**Логика:** стратегия теперь имеет `profile` (ключ в execution_profiles). Один файл-модуль стратегии может быть запущен в разных профилях (одна real на testnet, одна sim на 5 парах).

---

## Architecture change

### Before (current)

```
runner.py → executor.py → CCXT (real or testnet) → journal
```

### After

```
runner.py → ExecutorFactory(profile) → {
  RealExecutor    (→ CCXT real/testnet)  → journal event: "order_filled"
  SimExecutor     (→ fill model)         → journal event: "simulated_filled"
}
```

**Новый `sim_executor.py`:**

```python
class SimExecutor:
    def __init__(self, journal, strategy_tag, allocation_usd, profile, virtual_balance):
        self.journal = journal
        self.tag = strategy_tag
        self.allocation_usd = allocation_usd
        self.profile = profile
        self.balance = virtual_balance  # per-strategy tracked

    def place(self, pair, action, last_price, ohlcv, meta):
        amount = self._compute_amount(last_price)
        if amount * last_price < self.profile["min_notional_usd"]:
            self.journal.append({"event": "order_rejected", "reason": "min_notional", ...})
            return

        slippage = self._simulate_slippage(pair, amount, last_price)
        exec_price = last_price * (1 + slippage) if action == "BUY" else last_price * (1 - slippage)
        fee_usd = amount * exec_price * self.profile["fee_rate_taker"]

        # virtual balance check + update
        if action == "BUY":
            cost = amount * exec_price + fee_usd
            if self.balance.usdt < cost:
                self.journal.append({"event": "order_rejected", "reason": "insufficient_usdt", ...})
                return
            self.balance.usdt -= cost
            self.balance[base(pair)] += amount
        else:  # SELL
            proceeds = amount * exec_price - fee_usd
            if self.balance[base(pair)] < amount:
                self.journal.append({"event": "order_rejected", "reason": "insufficient_base", ...})
                return
            self.balance[base(pair)] -= amount
            self.balance.usdt += proceeds

        self.journal.append({
            "event": "simulated_filled",
            "strategy": self.tag,
            "pair": pair,
            "side": "buy" if action == "BUY" else "sell",
            "amount": amount,
            "price": exec_price,
            "reference_price": last_price,
            "slippage_pct": slippage,
            "cost": amount * exec_price,
            "fee_usd": fee_usd,
            "virtual_balance_after": dict(self.balance),
            "meta": meta,
        })

    def _simulate_slippage(self, pair, amount, last_price):
        base = self.profile["base_slippage_pct"]
        liquidity = self.profile["liquidity_factor_usd"].get(
            pair, self.profile["liquidity_factor_usd"]["DEFAULT"]
        )
        order_usd = amount * last_price
        return base + order_usd / liquidity
```

### Virtual balance tracking

Новый файл `sim_balance.py` — хранит виртуальные балансы per-strategy в `memory/trading/sim_balances.json`:

```json
{
  "basic_ema_rsi_sim": {
    "USDT": 97342.50,
    "BTC": 0.032651,
    "ETH": 0.154320,
    "SOL": 12.45
  },
  "macd_trend_sim": { ... }
}
```

Атомарные read-modify-write через lock file.

---

## Scale config example — 10 strategies × 10 pairs sim

```json
"pairs_pool": [
  "BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XRP/USDT",
  "ADA/USDT", "AVAX/USDT", "DOGE/USDT", "LINK/USDT", "MATIC/USDT"
],

"strategies": [
  {"name": "macd_trend_sim",         "profile": "binance_sim", "allocation_usd": 10000, "pairs": "ALL"},
  {"name": "basic_ema_rsi_sim",      "profile": "binance_sim", "allocation_usd": 10000, "pairs": "ALL"},
  {"name": "remizov_v2_sim",         "profile": "binance_sim", "allocation_usd": 10000, "pairs": "ALL"},
  {"name": "ema4h_sim",              "profile": "binance_sim", "allocation_usd": 10000, "pairs": "ALL"},
  {"name": "hybrid_sim",             "profile": "binance_sim", "allocation_usd": 10000, "pairs": "ALL"},
  {"name": "bb_bounce_sim",          "profile": "binance_sim", "allocation_usd": 10000, "pairs": "ALL"},
  {"name": "dip_buyer_sim",          "profile": "binance_sim", "allocation_usd": 10000, "pairs": "ALL"},
  {"name": "rsi_mean_revert_sim",    "profile": "binance_sim", "allocation_usd": 10000, "pairs": "ALL"},
  {"name": "remizov_oscillator_sim", "profile": "binance_sim", "allocation_usd": 10000, "pairs": "ALL"},
  {"name": "hybrid_aggressive_sim",  "profile": "binance_sim", "allocation_usd": 10000, "pairs": "ALL"}
]
```

= **100 strategy×pair combos**, $1M total virtual capital, 0 testnet dependency.

---

## Monitor + Scoreboard updates

### Monitor — новые сущности

```
REAL: 33 | SIM: 1547 | VIRTUAL (Cramer): 12 | ...
Total slippage loss (sim): $127.40
Total fees (sim): $1,554.00
```

### Scoreboard — per-strategy sim P&L

| Strategy | Mode | Pair | Trades | Fees | Slippage | Net P&L |
|---|---|---|---|---|---|---|
| macd_trend_sim | sim | BTC/USDT | 45 | $42.50 | $12.80 | +$847 (+8.47%) |
| macd_trend_sim | sim | ETH/USDT | 52 | ... | ... | ... |
| basic_ema_rsi_sim | sim | BTC/USDT | 122 | ... | ... | ... |

Позволит СРАВНИТЬ: какая стратегия на какой паре в плюсе с учётом комиссий и slippage.

---

## Research to do (before implementation — A2 CRITICAL)

1. **Binance spot fees 2026.** Verify `0.1% taker / 0.1% maker` currently. Check BNB discount %. → WebSearch `"Binance spot fee tier 2026"`
2. **Min notional per pair.** Currently $10 most pairs, может $5 на некоторых. → `GET /api/v3/exchangeInfo` на testnet
3. **Realistic slippage data.** Найти public data или paper про market impact on crypto spot trades. → WebSearch `"crypto slippage model spot market impact"`
4. **Available pairs on testnet.** Получить через `exchange.load_markets()` и отфильтровать active — убедиться что все 10 выбранных пар существуют.

---

## Implementation tasks (next session)

### Phase 1B-extension — Sim Executor

| ID | Task | Verify | Done when |
|---|---|---|---|
| 1B-ext-1 | Создать `sim_executor.py` с SimExecutor + slippage formula | pytest: BUY → writes simulated_filled с exec_price > last_price, SELL < last_price | 1 тест зелёный |
| 1B-ext-2 | `sim_balance.py` — per-strategy virtual balances + lock file | pytest: BUY списывает USDT и зачисляет base | 1 тест зелёный |
| 1B-ext-3 | `runner.py` — ExecutorFactory, profile routing, load_strategies с profile field | Single tick logs `simulated_filled` для sim-стратегий | 1 ручной tick с sim профилем → journal event correct |
| 1B-ext-4 | `config.json` — расширить schema, добавить execution_profiles | Import runner OK, нет KeyError | Runner стартует без ошибок |
| 1B-ext-5 | Portировать 7 оставшихся стратегий: ema4h, hybrid, hybrid_aggressive, bb_bounce, dip_buyer, rsi_mean_revert, remizov_oscillator | pytest: все 10 strategy.signal() на 1 OHLCV не падают | 10 strategies загружаются |
| 1B-ext-6 | Monitor + Scoreboard: отдельные колонки real/sim/cramer, fee/slippage totals | `python monitor.py 24` показывает SIM row с числами | Все 4 типа events агрегируются |
| 1B-ext-7 | Research: verify Binance fees + min_notional + available pairs | .md файл с findings | Research документ написан |
| 1B-ext-8 | Launch 10×10 sim parallel к testnet runner | After 1h: journal имеет events от 10 strategies × 10 pairs | Scoreboard показывает 100+ combos |

**Оценка:** ~4-5 часов работы в следующей сессии.

---

## Acceptance Criteria

| ID | Criteria | How to verify |
|---|---|---|
| AC-SIM-1 | SimExecutor пишет `simulated_filled` с fee_usd и slippage_pct | grep journal for new events |
| AC-SIM-2 | Virtual balance обновляется корректно | baseline $100K → 10 BUY → balance снижен на sum(cost+fees) |
| AC-SIM-3 | Slippage model: $1K order на BTC/USDT = ~0.02-0.03%; $10K order на SOL = ~0.12% | math check per formula |
| AC-SIM-4 | order_rejected event когда баланса не хватает | test strategy с allocation > balance → reject |
| AC-SIM-5 | Runner одновременно гонит testnet (3 real) + sim (10×10) без конфликтов | 2 executor types в одном runner loop, journal содержит оба типа |
| AC-SIM-6 | Monitor показывает раздельно REAL / SIM / VIRTUAL counts | `python monitor.py 1` вывод matches |
| AC-SIM-7 | Scoreboard считает net P&L с вычетом fees + slippage | Manual calc matches |
| AC-SIM-8 | Все 10 стратегий загружаются без ошибок | Runner startup log |
| AC-SIM-9 | 10 pairs валидны на Binance (load_markets) | script check |

---

## Risks & known unknowns

1. **Slippage model слишком оптимистичен.** Наш формула может занижать slippage на малых парах. Митигация: через 1-2 недели сравнить sim vs testnet (те же стратегии в обоих режимах) → калибровать.

2. **Virtual balance race conditions.** Если runner multi-threaded — lock file обязателен. Сейчас single-threaded → риск минимален.

3. **Survivorship bias в 10 парах.** Выбрали 10 популярных coin → результаты будут выглядеть лучше, чем на случайном наборе. Помнить при принятии решений.

4. **Live OHLCV ≠ execution reality.** OHLCV close — усреднённая цена свечи, fill по bid/ask. Для 5m timeframe разница минимальна.

5. **Никто не "потрогал" ордер.** В реальности маркетмейкеры видят наши заказы, фронтранят и т.д. Это sim не смоделирует никогда — всегда будет gap sim vs real.

---

## Priority vs Phase 2 Dashboard

**Sim mode blocks nothing in Phase 2.** Можно строить параллельно:
- Phase 2 backend → ЧИТАЕТ journal.jsonl (где бы ни писались события: real/testnet/sim)
- Phase 2 frontend → видит все 3 типа events через те же endpoints

**Рекомендация:** сначала sim mode (1 сессия, 4-5 ч), потом Phase 2 scaffolding. Причина: Phase 2 будет показывать sim результаты — лучше чтобы они уже накопились к моменту запуска дашборда.

---

## Next session agenda

1. `/startsatoshi` → подхват session 5
2. Research task 1B-ext-7 (verify Binance fees) — 20 мин
3. Port 7 стратегий (task 1B-ext-5) — 1.5-2 ч
4. SimExecutor + sim_balance (tasks 1B-ext-1, 1B-ext-2) — 1 ч
5. ExecutorFactory + config refactor (1B-ext-3, 1B-ext-4) — 30 мин
6. Monitor + Scoreboard update (1B-ext-6) — 30 мин
7. Launch 10×10 sim (1B-ext-8) — 5 мин
8. Observe for 1h, verify AC — 1 ч

Итого ~5 часов до 100-combo sim прогона.
