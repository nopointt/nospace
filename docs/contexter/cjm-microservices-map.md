# Contexter — CJM × Microservices Map

> Столбцы: этапы CJM (слева направо, от входа до ценности)
> Строки: ветки сценария по типу входных данных
> Ячейки: микросервис, выполняющий атомарное действие

| Ветка сценария | 1. Зашёл на сайт | 2. Загрузил данные | 3. Валидация + хранение | 4. Извлечение контента | 5. Чанкинг | 6. Эмбеддинг | 7. Индексация | 8. API готов | 9. Первый запрос |
|---|---|---|---|---|---|---|---|---|---|
| **Документ** (PDF, DOCX, TXT, MD) | Web (frontend) | Upload Service | Upload Service → Storage (R2) | Extraction Service (парсинг текста) | Chunking Service (семантический сплит) | Embedding Service (Jina v4/v5) | Vector Store Service (индекс) | MCP Gateway (endpoint создан) | RAG Query Service (search + rerank + ответ) |
| **Таблица** (CSV, XLSX, JSON) | Web (frontend) | Upload Service | Upload Service → Storage (R2) | Extraction Service (табличный парсер, schema discovery) | Chunking Service (row-level или sheet-level) | Embedding Service (Jina v4/v5) | Vector Store Service (индекс) | MCP Gateway (endpoint создан) | RAG Query Service (structured + semantic search) |
| **Презентация** (PPTX) | Web (frontend) | Upload Service | Upload Service → Storage (R2) | Extraction Service (слайды → текст + изображения) | Chunking Service (per-slide) | Embedding Service (Jina v4/v5 multimodal: текст + изображения) | Vector Store Service (индекс) | MCP Gateway (endpoint создан) | RAG Query Service (search + rerank + ответ) |
| **Аудио** (MP3, WAV, M4A) | Web (frontend) | Upload Service | Upload Service → Storage (R2) | Transcription Service (Groq Whisper) | Chunking Service (по таймкодам / семантический) | Embedding Service (Jina v4/v5) | Vector Store Service (индекс) | MCP Gateway (endpoint создан) | RAG Query Service (search + rerank + ответ) |
| **Видео** (MP4, MOV) | Web (frontend) | Upload Service | Upload Service → Storage (R2) | Transcription Service (аудиодорожка → Groq Whisper) + Frame Extraction Service (ключевые кадры) | Chunking Service (по таймкодам / семантический) | Embedding Service (Jina v4/v5 multimodal: текст + кадры) | Vector Store Service (индекс) | MCP Gateway (endpoint создан) | RAG Query Service (search + rerank + ответ) |
| **YouTube URL** | Web (frontend) | URL Service (валидация URL) | URL Service → метаданные | YouTube Parser (субтитры + метаданные, существующая тулза) | Chunking Service (по таймкодам) | Embedding Service (Jina v4/v5) | Vector Store Service (индекс) | MCP Gateway (endpoint создан) | RAG Query Service (search + rerank + ответ) |

---

## Реестр микросервисов (вытекает из таблицы)

| # | Микросервис | Операции | Описание |
|---|---|---|---|
| 1 | **Web (Frontend)** | landing, upload UI, dashboard, API docs | SolidStart, 3 экрана |
| 2 | **Upload Service** | приём файлов, валидация формата/размера, запись в Storage | CF Worker или standalone |
| 3 | **Storage** | хранение оригиналов (R2/S3) | объектное хранилище |
| 4 | **URL Service** | валидация URL, извлечение метаданных | YouTube, будущие источники |
| 5 | **Extraction Service** | PDF→текст, DOCX→текст, PPTX→слайды, CSV→rows, XLSX→rows | тяжёлый compute |
| 6 | **Transcription Service** | аудио/видео → текст (Groq Whisper) | API call |
| 7 | **Frame Extraction Service** | видео → ключевые кадры | ffmpeg, тяжёлый compute |
| 8 | **YouTube Parser** | URL → субтитры + метаданные | существующая тулза |
| 9 | **Chunking Service** | семантический сплит, per-slide, per-row, по таймкодам | зависит от типа |
| 10 | **Embedding Service** | текст/изображения → вектора (Jina v4/v5) | API call |
| 11 | **Vector Store Service** | CRUD индексов, upsert, delete | векторная БД |
| 12 | **MCP Gateway** | OAuth 2.1, endpoint provisioning, tool definitions | MCP server |
| 13 | **RAG Query Service** | semantic search, rerank, LLM ответ | ядро ценности |

---

## Наблюдения

- **Этапы 1–3** одинаковы для всех веток кроме YouTube (URL вместо файла)
- **Этап 4** — главная точка расхождения: каждый тип данных требует свой парсер
- **Этапы 5–9** снова сходятся в единый pipeline
- **Тяжёлый compute** (Extraction, Transcription, Frame Extraction) — потенциальная проблема для CF Workers (30s CPU limit)
- **Jina multimodal** используется для PPTX (слайды с картинками) и видео (ключевые кадры)
