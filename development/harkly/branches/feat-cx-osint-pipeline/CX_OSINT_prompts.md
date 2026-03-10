# OSINT CX: Гайд №4 — Схема Промптов для Классификации

Промпт для CX-классификации — это не вопрос к модели, это **контракт между системой и LLM**: ты задаёшь схему вывода, правила разрешения неопределённостей и примеры граничных случаев. Без этого классификатор работает как человек без инструкции — интерпретирует задачу по-своему каждый раз.

***

## Архитектурный Принцип: Один Промпт — Одна Задача

Фундаментальное правило 2025: **не мешать задачи в один промпт**. Смешанный промпт "определи сентимент, тему и JTBD одновременно" — это три разные задачи с разными функциями потерь. Модель начинает компромиссировать. Каждый уровень классификации из Гайда №3 — отдельный промпт с отдельной схемой вывода. [techinfotech.tech](https://techinfotech.tech.blog/2025/06/09/best-practices-to-build-llm-tools-in-2025/)

Структура любого промпта для классификации состоит из пяти фиксированных блоков: [getmaxim](https://www.getmaxim.ai/articles/a-practitioners-guide-to-prompt-engineering-in-2025/)

```
[ROLE] → [TASK DEFINITION] → [TAXONOMY] → [FEW-SHOT EXAMPLES] → [OUTPUT SCHEMA]
```

***

## Уровень 1: Фильтрация Шума (L1)

Это gate-классификатор. Задача: бинарное решение — релевантен сигнал или нет. Выполняется на дешёвой модели, поэтому промпт максимально прямой. [techinfotech.tech](https://techinfotech.tech.blog/2025/06/09/best-practices-to-build-llm-tools-in-2025/)

```
SYSTEM:
You are a signal relevance filter for a CX research pipeline.
Your only job: decide if a text contains a genuine customer
or employee experience signal about [PRODUCT/BRAND].

A signal IS relevant if it contains:
- Direct experience with the product or service
- A described outcome (positive, negative, or neutral)
- A specific action, feature, or moment

A signal IS NOT relevant if it is:
- Generic spam or advertisement
- Off-topic discussion (news, politics, memes)
- A question with no expressed experience
- A bot-generated or templated response

Return ONLY valid JSON. No commentary.

OUTPUT SCHEMA:
{
  "relevant": true | false,
  "confidence": 0.0–1.0,
  "rejection_reason": "spam | off_topic | no_experience | bot | null"
}

USER:
Text: "{{signal_content}}"
```

Порог для pass-through: `confidence > 0.75 AND relevant = true`. Всё ниже 0.75 — отправить в human review очередь, не в мусор. [docs.dasha](https://docs.dasha.ai/en-us/default/gpt/structured-output)

***

## Уровень 2: Тематическая Классификация (L2)

Определяет, к какому аспекту CX относится сигнал. Это самый критичный промпт — от качества таксономии зависит вся последующая аналитика. Таксономию нужно проектировать под конкретный продукт, но универсальный CX-стандарт выглядит так: [lakera](https://www.lakera.ai/blog/prompt-engineering-guide)

```
SYSTEM:
You are a CX taxonomy classifier. Assign the provided customer
signal to exactly ONE primary theme and up to TWO secondary themes.

THEME TAXONOMY:
- ONBOARDING: first setup, account creation, getting started
- PRICING: cost, billing, subscription, value-for-money
- CORE_PRODUCT: main features, performance, reliability, bugs
- UX_DESIGN: interface, navigation, usability, accessibility
- SUPPORT: customer service, response time, issue resolution
- DELIVERY: shipping, fulfillment, timing (for physical products)
- INTEGRATION: APIs, third-party connections, compatibility
- SECURITY: data privacy, trust, compliance concerns
- OFFBOARDING: cancellation, churn, account deletion

RULES:
- If a signal touches multiple themes, pick the dominant one as primary
- Secondary themes must be meaningfully present, not just mentioned
- If no theme fits confidently, use "OTHER" with a note

OUTPUT SCHEMA:
{
  "primary_theme": "THEME_NAME",
  "secondary_themes": ["THEME_NAME"] | [],
  "confidence": 0.0–1.0,
  "theme_evidence": "brief quote from text that drove the decision"
}

FEW-SHOT EXAMPLES:
Input: "I gave up trying to set up the API key for 3 hours.
        The docs are completely out of date."
Output: {
  "primary_theme": "ONBOARDING",
  "secondary_themes": ["INTEGRATION"],
  "confidence": 0.93,
  "theme_evidence": "gave up trying to set up the API key"
}

Input: "Charged me twice this month, support took 5 days to respond."
Output: {
  "primary_theme": "PRICING",
  "secondary_themes": ["SUPPORT"],
  "confidence": 0.91,
  "theme_evidence": "Charged me twice"
}

USER:
Text: "{{signal_content}}"
```

Few-shot примеры — обязательны для L2. Без них модель проявляет `label inconsistency`: один и тот же текст классифицируется по-разному между прогонами. [k2view](https://www.k2view.com/blog/prompt-engineering-techniques/)

***

## Уровень 3a: Сентимент (L3-SEN)

Не ограничивайся бинарным positive/negative — это потеря информации. CX-сентимент должен различать четыре состояния: [linkedin](https://www.linkedin.com/pulse/sentimenti-analysis-simple-prompt-mattia-giorgi-in0qf)

```
SYSTEM:
You are a sentiment analyst for customer experience signals.
Classify the emotional tone with precision.

SENTIMENT TAXONOMY:
- POSITIVE: clear satisfaction, appreciation, recommendation, delight
- NEGATIVE: dissatisfaction, frustration, complaint, disappointment
- MIXED: coexistence of opposing emotions in the SAME signal
  (e.g., "great product but terrible support")
- NEUTRAL: purely factual, descriptive, no emotional charge

IMPORTANT DISTINCTIONS:
- A signal can be MIXED only if BOTH positive AND negative
  sentiments are explicitly present and substantial
- Sarcasm detection: "Oh great, another update that breaks
  everything" → NEGATIVE, not POSITIVE
- Comparative statements: "Better than X but still not great"
  → MIXED

Chain-of-thought: First identify emotional keywords,
then evaluate their weight and direction, then classify.

OUTPUT SCHEMA:
{
  "sentiment": "POSITIVE | NEGATIVE | MIXED | NEUTRAL",
  "intensity": "LOW | MEDIUM | HIGH",
  "confidence": 0.0–1.0,
  "emotional_keywords": ["word1", "word2"],
  "reasoning": "one sentence explanation"
}

USER:
Text: "{{signal_content}}"
```

Chain-of-thought (`reasoning` поле) — не просто для объяснимости. Исследования показывают, что явное рассуждение перед финальным ответом снижает ошибки классификации на сложных граничных случаях. Это аудит-трейл, который помогает отлаживать промпт. [lakera](https://www.lakera.ai/blog/prompt-engineering-guide)

***

## Уровень 3b: CJM-Маппинг (L3-CJM)

Определяет, на каком этапе Customer Journey находится пользователь в момент создания сигнала: [getmaxim](https://www.getmaxim.ai/articles/a-practitioners-guide-to-prompt-engineering-in-2025/)

```
SYSTEM:
You are a Customer Journey mapper. Identify which stage
of the customer lifecycle this signal represents.

CJM STAGES:
- AWARENESS: first contact, discovery, "I heard about..."
- CONSIDERATION: evaluation, comparison, "I'm thinking about..."
- ONBOARDING: first-time setup, activation, "I just started..."
- ACTIVE_USE: regular usage, "I use it daily / weekly..."
- FRICTION_POINT: encountered a problem during regular use
- SUPPORT_INTERACTION: contacted or sought help
- RENEWAL_DECISION: re-evaluating subscription or purchase
- CHURN: left or is leaving, "I cancelled / I switched to..."
- POST_CHURN: left but reflecting, "I used to use, now I..."

KEY RULE: Map to the stage the user IS IN when writing,
not the stage they are describing.

OUTPUT SCHEMA:
{
  "cjm_stage": "STAGE_NAME",
  "confidence": 0.0–1.0,
  "stage_signal": "quote that indicates the stage"
}

FEW-SHOT EXAMPLES:
Input: "Been using it for 6 months, suddenly the export
        button stopped working yesterday."
Output: {
  "cjm_stage": "FRICTION_POINT",
  "confidence": 0.95,
  "stage_signal": "suddenly the export button stopped working"
}

Input: "Comparing this with Competitor X — your pricing
        page doesn't show enterprise costs anywhere."
Output: {
  "cjm_stage": "CONSIDERATION",
  "confidence": 0.89,
  "stage_signal": "Comparing this with Competitor X"
}

USER:
Text: "{{signal_content}}"
```

***

## Уровень 3c: JTBD-Экстракция (L3-JTBD)

Самый сложный уровень — не классификация, а **экстракция скрытой задачи пользователя**. JTBD имеет четыре измерения: функциональное (что сделать), эмоциональное (что почувствовать), социальное (как выглядеть в глазах других) и аспирационное (кем стать): [stonemantel](https://www.stonemantel.co/blog/what-exactly-do-customers-mean-by-a-functional-emotional-social-or-aspirational-jtbd)

```
SYSTEM:
You are a Jobs-To-Be-Done analyst. Extract the underlying
job the customer was trying to accomplish, and why it
succeeded or failed.

JTBD FRAMEWORK:
Every job has three components:
1. FUNCTIONAL: the concrete task ("I need to export data")
2. EMOTIONAL: the desired feeling ("feel in control of my data")
3. SOCIAL: the desired perception ("look professional to my team")

EXTRACTION RULES:
- Look for "when I..., I want to..., so I can..." patterns
- Explicit complaints reveal the FAILED job, not just a problem
- "I switched from X to Y because..." = high-signal JTBD statement
- If JTBD cannot be reliably inferred, return null for that field

OUTPUT SCHEMA:
{
  "jtbd_functional": "string | null",
  "jtbd_emotional": "string | null",
  "jtbd_social": "string | null",
  "job_outcome": "SUCCESS | FAILURE | PARTIAL",
  "friction_point": "what prevented job completion | null",
  "confidence": 0.0–1.0
}

FEW-SHOT EXAMPLES:
Input: "I needed to send the report to my client by EOD.
        The export crashed twice and I had to screenshot
        everything manually. So embarrassing."
Output: {
  "jtbd_functional": "Export and deliver a report to a client",
  "jtbd_emotional": "Feel reliable and in control",
  "jtbd_social": "Look professional and competent to the client",
  "job_outcome": "FAILURE",
  "friction_point": "Export feature crashed, forced manual workaround",
  "confidence": 0.92
}

USER:
Text: "{{signal_content}}"
```

***

## Финальная Агрегация: Мастер-Схема Сигнала

После прохождения всех уровней — собрать результаты в единую запись: [shadecoder](https://www.shadecoder.com/de/topics/schema-in-ai-a-comprehensive-guide-for-2025)

```json
{
  "signal_id": "uuid",
  "source": "reddit",
  "content": "raw text",
  "date": "2026-03-03T14:22:00Z",

  "l1_filter": {
    "relevant": true,
    "confidence": 0.91
  },

  "l2_theme": {
    "primary_theme": "ONBOARDING",
    "secondary_themes": ["INTEGRATION"],
    "theme_evidence": "gave up trying to set up the API key",
    "confidence": 0.93
  },

  "l3_sentiment": {
    "sentiment": "NEGATIVE",
    "intensity": "HIGH",
    "emotional_keywords": ["gave up", "completely out of date"],
    "confidence": 0.95
  },

  "l3_cjm": {
    "cjm_stage": "ONBOARDING",
    "stage_signal": "gave up trying to set up the API key for 3 hours",
    "confidence": 0.96
  },

  "l3_jtbd": {
    "jtbd_functional": "Integrate the product via API",
    "jtbd_emotional": "Feel capable and self-sufficient",
    "jtbd_social": null,
    "job_outcome": "FAILURE",
    "friction_point": "Outdated documentation, no resolution path",
    "confidence": 0.89
  }
}
```

***

## Управление Промптами: Версионирование

Промпты — это **код первого класса**. Они должны версионироваться, тестироваться и деплоиться как код: [getmaxim](https://www.getmaxim.ai/articles/a-practitioners-guide-to-prompt-engineering-in-2025/)

Храни промпты в Git как `.prompty` или `.md` файлы с метаданными (версия, дата, модель-таргет, accuracy на evaluation set). Инструменты: **Prompty** (Microsoft, open-source) — нативная поддержка версионирования и evaluation. Альтернатива: **DSPy** — позволяет оптимизировать промпты программно, не вручную. [getmaxim](https://www.getmaxim.ai/articles/a-practitioners-guide-to-prompt-engineering-in-2025/)

Evaluation set — обязателен: минимум 50 размеченных вручную примеров на каждый классификатор, включая граничные случаи. При изменении промпта — сравнивать accuracy на evaluation set, не интуицию. [getmaxim](https://www.getmaxim.ai/articles/a-practitioners-guide-to-prompt-engineering-in-2025/)

***

## Два Критических Паттерна

**Confidence threshold routing**: если `confidence < 0.7` на любом уровне — сигнал помечается флагом `needs_review`, но не блокируется. Пайплайн продолжает работу, флаги собираются в отдельную очередь для периодического человеческого ревью. Это единственный способ масштабироваться без деградации качества. [docs.dasha](https://docs.dasha.ai/en-us/default/gpt/structured-output)

**Промпт не должен знать о деньгах**: никогда не пиши "это важная задача" или "будь точным — это критично для бизнеса". LLM не мотивируется важностью — такие фразы только засоряют контекст. Вместо них — конкретные правила и few-shot примеры граничных случаев. [lakera](https://www.lakera.ai/blog/prompt-engineering-guide)