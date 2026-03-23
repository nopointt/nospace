# Deep Research Prompt: Claude Code Agent System for Crypto Trading

> Контекст: этот промпт предназначен для глубокого исследования (Deep Research / Perplexity / Claude с WebSearch). Цель — получить полный, практический, action-oriented отчёт.

---

## Промпт

Я строю **агентную торговую систему на базе Claude Code** (Anthropic CLI, модель Opus 4.6, 1M context window, Max план без API-ключа). Мне нужен **исчерпывающий research report** по следующим направлениям.

### Мой контекст (обязательно учитывать)

- **Стартовый капитал:** 130,000 KZT (~$260 USD). Ежемесячное пополнение ~75,000 KZT (~$150)
- **Ограничение:** заблокированы банковские счета (исполнительное производство, Казахстан). Нет доступа к банковской системе, брокерским счетам, традиционным финансовым инструментам
- **On-ramp:** наличные → карта знакомого (Kaspi) → Binance/Bybit P2P → криптокошелёк. Это работает, не блокер
- **Доступные инструменты:** ТОЛЬКО крипта и всё что работает с криптокошельками (DeFi, prediction markets, DEX, on-chain)
- **Уровень:** полный новичок в трейдинге и финансах. Опытный в AI/ML, Claude Code, агентных системах
- **Инфраструктура:** Windows 11, Claude Code CLI (Max план), Bun/Node.js, Python, Docker Desktop
- **Цель:** систематический рост капитала. Не быстрые деньги, не казино

### Направления исследования

#### 1. Архитектура агентной торговой системы

Детальный разбор архитектуры trading agent system на Claude Code:

- Какие **MCP серверы** существуют для подключения к биржам (Binance, Bybit, OKX), маркет-дате, новостям, on-chain аналитике? Конкретные названия, GitHub ссылки, статус поддержки
- Как организовать **multi-agent pipeline**: Data Agent → Analysis Agent → Risk Agent → Execution Agent? Конкретные примеры промптов для каждой роли
- Как реализовать **memory layer** (журнал сделок, история стратегий, рыночные режимы) в контексте Claude Code?
- Как работает **debate/consensus mechanism** между агентами (бычий/медвежий/нейтральный + судья)?
- **CCXT** как exchange-agnostic слой: какие функции доступны, ограничения, latency
- Как интегрировать **Freqtrade/FreqAI** с Claude Code для ML-стратегий?

#### 2. Стратегии для малого капитала ($200-500)

Реалистичный анализ (не маркетинговый) стратегий для малого капитала:

- **DCA (Dollar Cost Averaging):** оптимальная частота, распределение BTC/ETH/стейблкоины, автоматизация через бота
- **Grid trading:** минимальный капитал, оптимальные пары, комиссии vs прибыль на $260
- **DeFi yield farming:** какие протоколы доступны с $260? Реальные APY 2026 (не рекламные). Gas fees vs deposit — в каких сетях это выгодно?
- **Staking:** минимальные суммы, где стейкать, liquid staking (stETH, rETH)
- **Copy trading:** on-chain wallet tracking (Solana/ETH), какие боты (GMGN, Axiom, Banana Gun), риски
- **Prediction markets:** Polymarket доступен из Казахстана? Альтернативы (MEXC Prediction, Predict.Fun)? Минимальный капитал? Можно ли автоматизировать через Claude Code?

#### 3. Конкретные кейсы и реализации

Найди и проанализируй **каждый доступный case study** агентных/AI торговых систем:

- **claude-trader** (Byte-Ventures) — architecture, indicator confluence, 3-reviewer + judge system
- **claude-code-trading-terminal** (Degentic Tools) — agent-native terminal, sub-agents, Solana focus
- **TradingAgents** (TauricResearch) — LangGraph-based, 7 roles, academic paper results
- **claude-code-agents-orchestra** (0ldh) — crypto-trader/analyst/quant-analyst agent prompts
- **claude-trading-skills** (tradermonty) — what skills are included, how they work
- **Polymarket bots** — latency arbitrage, structural arbitrage, news-driven, realistic P&L
- **StockBench** (arXiv) — какие LLM показали лучшие результаты? Kimi-K2, Qwen3 vs Claude?
- Блоги: "900+ hours of Claude Code trading", "I gave Claude Code 100K", "How I Claude Code my way to better trading"
- **Любые другие** кейсы AI agent trading systems которые найдёшь

#### 4. Техническая реализация (step-by-step)

Практический план запуска первой версии:

- **Step 1:** Какие MCP серверы подключить к Claude Code прямо сейчас (команды `claude mcp add`)
- **Step 2:** Минимальный набор агентов (промпты, роли, tools) для первой версии
- **Step 3:** Как организовать backtesting без Freqtrade (чисто через Claude Code + CCXT)
- **Step 4:** Paper trading setup — как тестировать стратегии без реальных денег
- **Step 5:** Live trading — минимальный safe setup с $50-100 (не весь капитал)
- **Step 6:** Мониторинг и журнал сделок — формат, автоматизация, алерты

#### 5. Risk management для новичка

- **Правило Kelly Criterion** — как применить к маленькому портфелю
- **Position sizing** — сколько ставить на одну сделку при $260?
- **Stop-loss стратегии** — фиксированный %, trailing, ATR-based
- **Max drawdown rules** — когда бот должен остановиться
- **Emergency reserve** — сколько оставить в кэше/стейблах, не трогать
- **Психология** — как не слить депозит в первую неделю (конкретные правила)

#### 6. Юридические и налоговые аспекты (Казахстан 2026)

- Налогообложение крипто в КЗ: 10% capital gains, форма 270.00 — как именно считать и подавать?
- Есть ли **порог** ниже которого можно не декларировать?
- **P2P через чужую карту** — юридические риски для владельца карты и для меня?
- **AIFC-регулирование** — я подпадаю под него как физлицо-трейдер?
- **Самостоятельный custody** — насколько реально недоступен для приставов в 2026?

#### 7. Конкурентный ландшафт инструментов

Сравнительная таблица:

| Критерий | Freqtrade | OctoBot | 3Commas | Pionex | Claude Code custom |
|---|---|---|---|---|---|
| Стоимость | | | | | |
| ML/AI | | | | | |
| Backtesting | | | | | |
| Exchanges | | | | | |
| Минимальный капитал | | | | | |
| Сложность настройки | | | | | |
| Кастомизация | | | | | |

### Формат ответа

1. **Executive Summary** (1 страница) — что делать с $260 прямо сейчас
2. **Detailed Analysis** по каждому из 7 направлений выше
3. **Architecture Diagram** (текстовый) — финальная рекомендуемая архитектура
4. **Action Plan** — пошаговый план на 3 месяца (Phase 1: learn + paper → Phase 2: small live → Phase 3: scale)
5. **Source List** — все ссылки (GitHub, статьи, papers, документация)
6. **Risk Matrix** — таблица рисков с вероятностью и impact

### Требования к качеству

- **Никакого маркетинга.** Только факты, цифры, проверенные данные
- **Survivorship bias warning** обязателен для каждого кейса
- **Реалистичные ожидания** для $260 капитала — не обещания "10x за месяц"
- **Каждое утверждение** подкреплено ссылкой или конкретным примером
- **Противоречия между источниками** — указывать явно, не скрывать
- Если что-то **не работает для малого капитала** — сказать прямо
