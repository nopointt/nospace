# 2efd3500+3-scratch.md
> Active · Satoshi · 2026-04-21

## Сессия — Paper Trading Runner (variant B: Python + CCXT, no Docker)

### Контекст входа
- Bot стоял с 2026-03-23. 0 сделок за месяц.
- Решение: отказаться от Freqtrade/Docker (ест ОЗУ 2-3GB) → чистый Python runner (~50-100MB).
- Все 3 стратегии + Cramer Mode, 7 дней, monitor каждые 3h, $10K testnet USDT.

### Что сделано (все в `finance/nomos/runner/`)

- `config.json` — полный конфиг (pairs, timeframes, allocations, risk rules 3/8/20%)
- `runner.py` — main loop, per-strategy TIMEFRAME, OHLCV cache per tick, signal handling
- `ccxt_client.py` — Binance testnet factory (читает ~/.tlos/binance-testnet)
- `executor.py` — market orders через CCXT, лог в journal
- `cramer_mirror.py` — flip BUY↔SELL
- `risk_gate.py` — halt.flag-based блокировка
- `journal.py` — append-only JSONL, thread-safe
- `scoreboard.py` — обновляет scoreboard.md + portfolio-state.json
- `monitor.py` — CLI summary "python monitor.py 3" = последние 3h
- `strategies/_indicators.py` — EMA/RSI/MACD/ADX/ODE-fit (pure pandas+numpy, без ta-lib)
- `strategies/basic_ema_rsi.py` — 5m
- `strategies/macd_trend.py` — 1h (порт с 4h Freqtrade)
- `strategies/remizov_v2.py` — 1h (порт с 4h Freqtrade)
- `README.md` — инструкции запуска/остановки

### Baseline на момент старта

- Testnet: 10000 USDT / 1 BTC / 1 ETH / 1 BNB free
- BTC/USDT = $76,249 (2026-04-21 09:33 UTC)
- Strategy allocations: $2500 per strategy × 3 + $2500 Cramer = $10K total

### Runner запущен в background

- PID python 9280 (167MB RAM) + 15700 (14MB wrapper)
- Первый tick в live режиме: Remizov SELL 0.016398 BTC + Cramer BUY (order IDs 7519492, 7519495)
- Следующий tick: каждые 5 минут до 2026-04-28

<!-- ENTRY:2026-04-21:CLOSE:3:nomos:nomos-phase1 [SATOSHI] -->
## 2026-04-21 — session 3 CLOSE [Satoshi]

**Decisions:**
- Abandoned Freqtrade/Docker for paper trading (ест 2-3GB RAM при уже низких ресурсах)
- New stack: Python + CCXT runner (~50-100MB), no Docker dependency
- All 3 strategies in parallel (MACD Trend, Basic EMA+RSI, Remizov v2) + Cramer Mirror Mode
- Horizon 7 days (2026-04-21 → 2026-04-28), monitor cadence 3h
- Per-strategy TIMEFRAME support (5m for Basic, 1h for MACD/Remizov — compromise from Freqtrade's 4h)
- Risk halt rules codified in config: 3%/8%/20% drawdown → halt.flag
- Stateless signals for MVP — position tracking deferred to v2
- Allocations: $2500 per strategy × 3 + $2500 Cramer = $10K total

**Files changed:**
- `finance/nomos/runner/` — 13 новых файлов (runner.py, config.json, ccxt_client.py, executor.py, journal.py, risk_gate.py, cramer_mirror.py, scoreboard.py, monitor.py, README.md + strategies/{__init__,_indicators,basic_ema_rsi,macd_trend,remizov_v2}.py)
- `finance/nomos/memory/trading/journal.jsonl` — создан, live append-only log
- `finance/nomos/memory/trading/scoreboard.md` — теперь auto-updated by runner
- `finance/nomos/memory/trading/portfolio-state.json` — теперь auto-updated by runner
- `finance/nomos/memory/trading/runner.{stdout,stderr}.log` — live logs
- `finance/nomos/memory/scratches/2efd3500+3-scratch.md` — этот scratch

**Portfolio:**
- Paper/testnet only (не реальные деньги)
- Starting: $10K USDT + 1 BTC + 1 ETH + 1 BNB (Binance testnet default allocation)
- Live orders: 4 ордера исполнены (2 single-tick test + 2 runner tick), все Remizov SELL + Cramer BUY на BTC/USDT (~$2500 volume per pair per tick)
- Real money: нет. Фаза 1C не начата.

**Completed:**
- Весь runner stack построен и работает
- 3 стратегии ported from Freqtrade (EMA/RSI/MACD/ADX/ODE на чистом pandas+numpy)
- Single-tick verified live на testnet — order IDs 7517797, 7517799, 7519492, 7519495
- Runner запущен в background (PID 9280)
- Monitor script для on-demand summary

**Opened:**
- 7-day run в прогрессе (2026-04-21 → 2026-04-28)
- Monitor check каждые 3h до finish
- Decision pending после 7-day: Phase 1C (real money) vs runner improvements (position tracking, stop-loss)
- Remizov v2 генерит частые SELL-сигналы на 1h (p<0) — нужен tune порогов или switch на 4h
- Phase 1B AC-5: "48+ hours continuous paper trading" → будет выполнен через ~2 дня runner аптайма

**Notes:**
- Disk был 2.2GB свободно на входе — nopoint очистил до 9GB вручную (Docker не запускали)
- CCXT 4.5.50, pandas 3.0.2, numpy 2.4.2 установлены глобально (Python 3.14)
- Testnet ключи в ~/.tlos/binance-testnet валидны (canTrade=True, 454 non-zero assets)
- Chronicle #2 Freqtrade Docker подход ЗАМЕНЁН этой сессией
- Session 3 = новая архитектура без Docker/Freqtrade
