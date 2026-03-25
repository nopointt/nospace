# Contexter — Инструкции подключения MCP клиентов

> Исследование: март 2026. Для popup-инструкций на лендинге Contexter.
> MCP endpoint: `https://contexter.nopoint.workers.dev/sse?token={USER_TOKEN}`
> Протокол: Streamable HTTP (JSON-RPC over POST). Путь `/sse`, но транспорт — HTTP, не SSE.

---

## Claude Desktop

**Тип подключения:** через mcp-remote bridge (npx)
**Сложность:** 3 шага

> Claude Desktop поддерживает remote MCP нативно через Settings > Connectors, но только с OAuth. Contexter использует token-in-URL, поэтому нужен mcp-remote bridge через JSON-конфиг.

### Шаги

1. **Откройте конфигурацию**
   Claude Desktop → Settings (иконка шестерёнки) → Developer → Edit Config

2. **Вставьте JSON**
   В открывшийся файл `claude_desktop_config.json` добавьте:

```json
{
  "mcpServers": {
    "contexter": {
      "command": "npx",
      "args": [
        "-y",
        "@anthropic-ai/mcp-remote",
        "https://contexter.nopoint.workers.dev/sse?token=ВАШ_ТОКЕН"
      ]
    }
  }
}
```

3. **Перезапустите и проверьте**
   Полностью закройте и откройте Claude Desktop. В нижнем правом углу чата появится иконка молотка — это значит MCP подключён. Спросите: **«какие документы загружены?»**

### Нюансы
- Требуется Node.js (для npx). Если нет — установите с nodejs.org
- После сохранения конфига обязательно полный перезапуск (не просто закрыть окно, а Quit из меню)
- Если уже есть другие серверы в конфиге — добавьте `"contexter": {...}` внутрь существующего объекта `mcpServers`

---

## ChatGPT

**Тип подключения:** нативный (Streamable HTTP)
**Сложность:** 3 шага

> ChatGPT поддерживает MCP через Developer Mode (доступен на Plus/Pro/Team/Enterprise). Подключение по URL без OAuth — выберите "No authentication", токен уже в URL.

### Шаги

1. **Включите Developer Mode**
   Настройки (аватар слева внизу) → Settings → Connectors → Advanced settings → включите Developer mode

2. **Создайте коннектор**
   Вернитесь в Connectors → кнопка **Create** (вверху справа). Заполните:
   - Имя: `Contexter`
   - MCP Server URL: `https://contexter.nopoint.workers.dev/sse?token=ВАШ_ТОКЕН`
   - Authentication: **No authentication**

3. **Подключите в чате и проверьте**
   Новый чат → нажмите **+** в строке ввода → More → Developer Mode → Add sources → включите Contexter. Спросите: **«какие документы загружены?»**

### Нюансы
- Developer Mode доступен только на платных планах (Plus, Pro, Team, Enterprise)
- При первом вызове инструмента ChatGPT спросит разрешение — нажмите Allow
- URL с `/sse` в конце — это правильно, несмотря на то что транспорт HTTP

---

## Cursor

**Тип подключения:** нативный (Streamable HTTP)
**Сложность:** 3 шага

> Cursor поддерживает Streamable HTTP нативно через поле `url` в mcp.json. При подключении по URL автоматически пробует Streamable HTTP.

### Шаги

1. **Откройте настройки MCP**
   Cursor Settings (Ctrl+Shift+J) → вкладка MCP → кнопка **+ Add new MCP server**

   Или создайте файл `~/.cursor/mcp.json` вручную.

2. **Добавьте сервер**
   Тип: **Streamable HTTP**. Если через JSON-файл:

```json
{
  "mcpServers": {
    "contexter": {
      "url": "https://contexter.nopoint.workers.dev/sse?token=ВАШ_ТОКЕН"
    }
  }
}
```

3. **Проверьте подключение**
   В чате Cursor (Cmd+L / Ctrl+L) появится индикатор MCP-серверов. Спросите: **«какие документы загружены?»** — Cursor вызовет инструмент `list_documents`.

### Нюансы
- Для глобального доступа: файл `~/.cursor/mcp.json`. Для проекта: `.cursor/mcp.json` в корне проекта
- Cursor автоматически определяет Streamable HTTP по наличию поля `url` (без `command`)
- Если не работает — перезапустите Cursor полностью

---

## Windsurf

**Тип подключения:** нативный (Streamable HTTP)
**Сложность:** 3 шага

> Windsurf поддерживает Streamable HTTP нативно. Укажите `type: "streamable-http"` и `serverUrl` в конфиге.

### Шаги

1. **Откройте конфиг MCP**
   Windsurf Settings (Ctrl+Shift+P → "Open Windsurf Settings") → Cascade → убедитесь что MCP включён.

   Затем откройте файл конфигурации:
   - Windows: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`
   - macOS/Linux: `~/.codeium/windsurf/mcp_config.json`

2. **Добавьте сервер**

```json
{
  "mcpServers": {
    "contexter": {
      "type": "streamable-http",
      "serverUrl": "https://contexter.nopoint.workers.dev/sse?token=ВАШ_ТОКЕН"
    }
  }
}
```

3. **Перезапустите и проверьте**
   Перезапустите Windsurf. В Cascade чате спросите: **«какие документы загружены?»**

### Нюансы
- Обязательно укажите `"type": "streamable-http"` — без этого Windsurf попробует stdio и не подключится
- Используйте `serverUrl` (не `url`) — это официальное имя поля в Windsurf
- MCP должен быть включён в Windsurf Settings → Cascade → Model Context Protocol

---

## Cline

**Тип подключения:** нативный (HTTP URL)
**Сложность:** 3 шага

> Cline (расширение VS Code) поддерживает remote MCP серверы нативно через поле `url` в настройках.

### Шаги

1. **Откройте настройки MCP**
   В VS Code откройте панель Cline → иконка MCP Servers (вверху панели) → вкладка Configure → кнопка **Configure MCP Servers**

2. **Добавьте сервер в JSON**
   В открывшемся `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "contexter": {
      "url": "https://contexter.nopoint.workers.dev/sse?token=ВАШ_ТОКЕН",
      "disabled": false
    }
  }
}
```

3. **Проверьте подключение**
   Вернитесь в панель MCP Servers — Contexter должен показать зелёный статус. В чате Cline спросите: **«какие документы загружены?»**

### Нюансы
- Cline работает с любым LLM-провайдером (Claude, GPT-4, и др.) — MCP серверы доступны со всеми
- Если сервер показывает красный статус — нажмите кнопку Restart рядом с ним
- Использование MCP увеличивает расход токенов

---

## Сводная таблица

| Клиент | Транспорт | Конфиг | Нужен Node.js |
|---|---|---|---|
| Claude Desktop | mcp-remote bridge | JSON файл | Да |
| ChatGPT | нативный HTTP | UI (Settings) | Нет |
| Cursor | нативный HTTP | JSON файл или UI | Нет |
| Windsurf | нативный HTTP | JSON файл | Нет |
| Cline | нативный HTTP | JSON файл | Нет |

---

## Общие gotchas

- **Токен в URL** — не потеряйте `?token=` часть. Без токена сервер вернёт ошибку авторизации
- **Путь `/sse`** — это правильный путь, хотя транспорт Streamable HTTP (не SSE). Не меняйте на `/mcp`
- **Проверка** — во всех клиентах задайте вопрос «какие документы загружены?» — MCP должен вернуть список через инструмент `list_documents`
- **Если не работает** — убедитесь что URL правильный, токен действительный, и клиент перезапущен после изменения конфига
