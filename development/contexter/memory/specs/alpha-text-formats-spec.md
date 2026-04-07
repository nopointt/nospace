# Alpha Text Formats — Implementation Spec

**Phase:** Alpha format restriction + TextParser expansion  
**Status:** READY FOR IMPLEMENTATION  
**Commits:** 2 (frontend commit, backend commit)  
**Deploy:** Frontend → CF Pages (auto on merge), Backend → Hetzner (manual)

---

## Context & Rationale

Alpha restricts uploads to text-only formats that TextParser can handle with zero external dependencies (no Docling, no Whisper, no ffmpeg). This eliminates processing failures for unsupported formats in alpha. The backend retains all parsers — only the frontend upload UI restricts what users can drop.

MCP tools (`add_context`, `upload_document`) are **NOT** restricted. They continue accepting any format the backend supports.

Roadmap messaging is updated to communicate "Full format support (PDF, audio, video, images) coming after alpha."

---

## Alpha Format Set (55 extensions)

### Documents (16)
`txt`, `md`, `csv`, `json`, `xml`, `odt`, `html`, `yaml`, `yml`, `toml`, `tsv`, `log`, `rst`, `tex`, `ini`, `cfg`

### Environment / Config (3)
`env`, `conf`, `hcl`, `tf`

> Note: `hcl` and `tf` (Terraform) bring total to 18 for this category but are listed here for clarity.

### Subtitles (2)
`srt`, `vtt`

### Data (3)
`sql`, `ndjson`, `jsonl`, `geojson`

> Note: 4 items.

### Source Code (30)
`py`, `js`, `ts`, `jsx`, `tsx`, `go`, `rs`, `java`, `c`, `cpp`, `h`, `hpp`, `cs`, `rb`, `php`, `swift`, `kt`, `scala`, `lua`, `r`, `pl`, `sh`, `bash`, `zsh`, `bat`, `ps1`

> Note: 26 items.

### Named/Extension-less Configs (handled as lowercase keys in the Set)
`dockerfile`, `makefile`, `gitignore`, `dockerignore`, `editorconfig`, `nginx`

### Markup (4)
`adoc`, `org`, `wiki`, `textile`

### Total: ~57 extensions (exact count in implementation below)

---

## Post-Alpha (CLOSED in frontend only)
`pdf`, `docx`, `xlsx`, `pptx`, `ods`, `png`, `jpg`, `jpeg`, `webp`, `svg`, `mp3`, `wav`, `ogg`, `m4a`, `mp4`, `webm`, `mov`

---

## Task 1: `web/src/pages/Upload.tsx` — Replace SUPPORTED_EXTENSIONS

**File:** `web/src/pages/Upload.tsx`  
**Lines:** 43–48 (the `SUPPORTED_EXTENSIONS` constant)

**Action:** Replace the current SUPPORTED_EXTENSIONS Set with the alpha-only text extensions. The Set must use lowercase extension strings. No other changes to Upload.tsx.

**Old (lines 43–48):**
```typescript
const SUPPORTED_EXTENSIONS = new Set([
  "pdf", "docx", "xlsx", "pptx", "csv", "json", "txt", "md",
  "png", "jpg", "jpeg", "webp", "svg",
  "mp3", "wav", "ogg", "m4a",
  "mp4", "webm", "mov",
])
```

**New:**
```typescript
// Alpha: text-only formats (TextParser, zero external deps)
// Post-alpha formats (pdf, docx, audio, video, images) re-enabled after alpha.
const SUPPORTED_EXTENSIONS = new Set([
  // Documents
  "txt", "md", "csv", "json", "xml", "odt", "html",
  "yaml", "yml", "toml", "tsv", "log", "rst", "tex", "ini", "cfg",
  // Environment / config
  "env", "conf", "hcl", "tf",
  // Subtitles
  "srt", "vtt",
  // Data
  "sql", "ndjson", "jsonl", "geojson",
  // Source code
  "py", "js", "ts", "jsx", "tsx",
  "go", "rs", "java", "c", "cpp", "h", "hpp",
  "cs", "rb", "php", "swift", "kt", "scala",
  "lua", "r", "pl", "sh", "bash", "zsh", "bat", "ps1",
  // Named configs (no extension — matched by extension check)
  "dockerfile", "makefile", "gitignore", "dockerignore", "editorconfig", "nginx",
  // Markup
  "adoc", "org", "wiki", "textile",
])
```

**Note on named configs:** Files like `Dockerfile` have no extension — `getExtension("Dockerfile")` returns `""`, and `""` is not in the Set, so they will be rejected. This is acceptable for alpha. If support for extension-less files is needed in the future, it requires a separate task modifying `validateFile()`. Do NOT implement that now.

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter && npx tsc --noEmit -p web/tsconfig.json 2>&1 | tail -5
# Expected: no errors (exit 0)
```

**Done when:**
- [ ] SUPPORTED_EXTENSIONS in Upload.tsx contains exactly the alpha extensions listed above
- [ ] No TypeScript errors in Upload.tsx
- [ ] `validateFile()` logic is unchanged (still uses `SUPPORTED_EXTENSIONS.has(ext)`)

---

## Task 2: `web/src/pages/Hero.tsx` — Replace SUPPORTED_EXTENSIONS

**File:** `web/src/pages/Hero.tsx`  
**Lines:** 54–59 (the `SUPPORTED_EXTENSIONS` constant)

**Action:** Replace with the identical Set from Task 1. Both files must have exactly the same set.

**Old (lines 54–59):**
```typescript
const SUPPORTED_EXTENSIONS = new Set([
  "pdf", "docx", "xlsx", "pptx", "csv", "json", "txt", "md",
  "png", "jpg", "jpeg", "webp", "svg",
  "mp3", "wav", "ogg", "m4a",
  "mp4", "webm", "mov",
])
```

**New:** Same replacement as Task 1 (identical Set content with same comments).

**Note on DRY:** These two files duplicate this constant. A future refactor could extract it to `web/src/lib/constants.ts`. Do NOT do that now — out of scope for this spec. Both files must have identical content for alpha.

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter && npx tsc --noEmit -p web/tsconfig.json 2>&1 | tail -5
# Expected: no errors (exit 0)
```

**Done when:**
- [ ] SUPPORTED_EXTENSIONS in Hero.tsx matches Upload.tsx exactly
- [ ] No TypeScript errors in Hero.tsx

---

## Task 3: `web/src/lib/translations/en.ts` — Update format strings

**File:** `web/src/lib/translations/en.ts`

**Action:** Update all format-related strings to reflect alpha text-only mode. Seven keys require changes.

### 3.1 `hero.dropFormats` (line 12)

**Old:**
```typescript
"hero.dropFormats": "PDF · DOCX · XLSX · PPTX · CSV · JSON · TXT · MD · HTML · Images · Audio · Video",
```

**New:**
```typescript
"hero.dropFormats": "TXT · MD · CSV · JSON · HTML · XML · YAML · Python · JS · TS · Go · Rust · SQL · 50+ formats",
```

### 3.2 `dropzone.formats` (line 361)

**Old:**
```typescript
"dropzone.formats": "PDF, DOCX, XLSX, PPTX, ODS, ODT, CSV, JSON, TXT, MD, HTML, XML, PNG, JPG, WebP, SVG, MP3, WAV, M4A, OGG, MP4, MOV, WebM",
```

**New:**
```typescript
"dropzone.formats": "TXT, MD, CSV, JSON, XML, HTML, YAML, TOML, ODT, SQL, SRT, VTT, Python, JS, TS, Go, Rust, Java, C/C++, C#, Ruby, PHP, Swift, Kotlin, Scala, Shell, and 30+ more text formats",
```

### 3.3 `landing.hero.desc` (line 455)

**Old:**
```typescript
"landing.hero.desc": "Upload documents once — and ChatGPT, Claude, Gemini automatically know the full context. We accept audio, video, links, PDF, and other formats with no size limits.",
```

**New:**
```typescript
"landing.hero.desc": "Upload documents once — and ChatGPT, Claude, Gemini automatically know the full context. We accept text files, source code, configs, subtitles, and 50+ formats. Full format support (PDF, audio, video, images) coming after alpha.",
```

### 3.4 `landing.how.s1.desc` (line 471)

**Old:**
```typescript
"landing.how.s1.desc": "Any file: PDF, meeting recording, presentation, photo. Any format, any size.",
```

**New:**
```typescript
"landing.how.s1.desc": "Any text file: documents, source code, configs, subtitles, data files. 50+ formats, any size.",
```

### 3.5 `landing.feat2.desc` (line 481)

**Old:**
```typescript
"landing.feat2.desc": "Contracts, meeting recordings, research, screenshots, video, photos, links — Contexter reads everything. No size limits, no \"format not supported\".",
```

**New:**
```typescript
"landing.feat2.desc": "Contracts, source code, research, configs, subtitles, data exports — Contexter reads all text formats. 50+ formats supported. Full format support (PDF, audio, video, images) coming after alpha.",
```

### 3.6 `landing.faq4.a` (line 562)

**Old:**
```typescript
"landing.faq4.a": "PDF, Word, PowerPoint, Excel, audio (MP3, WAV), video (MP4), images (JPG, PNG), text, and more. No size limits.",
```

**New:**
```typescript
"landing.faq4.a": "50+ text formats: TXT, MD, CSV, JSON, XML, HTML, YAML, TOML, ODT, SQL, SRT/VTT subtitles, and source code in Python, JavaScript, TypeScript, Go, Rust, Java, C/C++, C#, Ruby, PHP, Swift, Kotlin, Scala, Shell, and more. Full format support (PDF, audio, video, images) coming after alpha. No size limits.",
```

### 3.7 `roadmap.now.f1` (line 578)

**Old:**
```typescript
"roadmap.now.f1": "15 formats (PDF, audio, video, images...)",
```

**New:**
```typescript
"roadmap.now.f1": "50+ text formats (TXT, MD, JSON, YAML, source code, configs, subtitles...)",
```

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter && npx tsc --noEmit -p web/tsconfig.json 2>&1 | tail -5
# Expected: no errors
```

**Done when:**
- [ ] All 7 keys updated with correct English text
- [ ] No mentions of "PDF", "audio", "video", "images" without a "coming after alpha" qualifier in format-describing strings
- [ ] No TypeScript errors

---

## Task 4: `web/src/lib/translations/ru.ts` — Update format strings (Russian)

**File:** `web/src/lib/translations/ru.ts`

**Action:** Mirror all 7 key updates from Task 3 in Russian.

### 4.1 `hero.dropFormats` (line 12)

**Old:**
```typescript
"hero.dropFormats": "PDF · DOCX · XLSX · PPTX · CSV · JSON · TXT · MD · HTML · Изображения · Аудио · Видео",
```

**New:**
```typescript
"hero.dropFormats": "TXT · MD · CSV · JSON · HTML · XML · YAML · Python · JS · TS · Go · Rust · SQL · 50+ форматов",
```

### 4.2 `dropzone.formats` (line 361)

**Old:**
```typescript
"dropzone.formats": "PDF, DOCX, XLSX, PPTX, ODS, ODT, CSV, JSON, TXT, MD, HTML, XML, PNG, JPG, WebP, SVG, MP3, WAV, M4A, OGG, MP4, MOV, WebM",
```

**New:**
```typescript
"dropzone.formats": "TXT, MD, CSV, JSON, XML, HTML, YAML, TOML, ODT, SQL, SRT, VTT, Python, JS, TS, Go, Rust, Java, C/C++, C#, Ruby, PHP, Swift, Kotlin, Scala, Shell и 30+ других текстовых форматов",
```

### 4.3 `landing.hero.desc` (line 452)

**Old:**
```typescript
"landing.hero.desc": "Загрузи документы один раз — и ChatGPT, Claude, Gemini автоматически знают весь контекст. Принимаем аудио, видео, ссылки, PDF и другие форматы без ограничений на размер.",
```

**New:**
```typescript
"landing.hero.desc": "Загрузи документы один раз — и ChatGPT, Claude, Gemini автоматически знают весь контекст. Принимаем текстовые файлы, исходный код, конфиги, субтитры и 50+ форматов. Полная поддержка форматов (PDF, аудио, видео, изображения) — после альфы.",
```

### 4.4 `landing.how.s1.desc` (line 468)

**Old:**
```typescript
"landing.how.s1.desc": "Любой файл: PDF, запись встречи, презентация, фото. Любой формат, любой размер.",
```

**New:**
```typescript
"landing.how.s1.desc": "Любой текстовый файл: документы, исходный код, конфиги, субтитры, файлы данных. 50+ форматов, любой размер.",
```

### 4.5 `landing.feat2.desc` (line 478)

**Old:**
```typescript
"landing.feat2.desc": "Договор, запись встречи, исследование, скрины, видео, фото, ссылки — Contexter читает всё. Никаких ограничений по размеру, никакого «формат не поддерживается».",
```

**New:**
```typescript
"landing.feat2.desc": "Договоры, исходный код, исследования, конфиги, субтитры, выгрузки данных — Contexter читает все текстовые форматы. 50+ форматов. Полная поддержка (PDF, аудио, видео, изображения) — после альфы.",
```

### 4.6 `landing.faq4.a` (line 559)

**Old:**
```typescript
"landing.faq4.a": "PDF, Word, PowerPoint, Excel, аудио (MP3, WAV), видео (MP4), изображения (JPG, PNG), текст и другие. Ограничений по размеру нет.",
```

**New:**
```typescript
"landing.faq4.a": "50+ текстовых форматов: TXT, MD, CSV, JSON, XML, HTML, YAML, TOML, ODT, SQL, субтитры SRT/VTT, и исходный код на Python, JavaScript, TypeScript, Go, Rust, Java, C/C++, C#, Ruby, PHP, Swift, Kotlin, Scala, Shell и других языках. Полная поддержка (PDF, аудио, видео, изображения) — после альфы. Ограничений по размеру нет.",
```

### 4.7 `roadmap.now.f1` (line 575)

**Old:**
```typescript
"roadmap.now.f1": "15 форматов (PDF, аудио, видео, изображения...)",
```

**New:**
```typescript
"roadmap.now.f1": "50+ текстовых форматов (TXT, MD, JSON, YAML, исходный код, конфиги, субтитры...)",
```

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter && npx tsc --noEmit -p web/tsconfig.json 2>&1 | tail -5
# Expected: no errors
```

**Done when:**
- [ ] All 7 Russian keys updated — meaning matches English counterpart exactly
- [ ] No Russian strings mention PDF/аудио/видео as current capabilities without an alpha qualifier
- [ ] No TypeScript errors

---

## Frontend Commit

After Tasks 1–4 pass verification:

```bash
cd /c/Users/noadmin/nospace/development/contexter
git add web/src/pages/Upload.tsx web/src/pages/Hero.tsx \
        web/src/lib/translations/en.ts web/src/lib/translations/ru.ts
git commit -m "feat(alpha-F1): restrict uploads to 50+ text formats, update copy for alpha"
```

---

## Task 5: `src/services/parsers/docling.ts` — Expand TextParser.formats

**File:** `src/services/parsers/docling.ts`  
**Lines:** 139–147 (TextParser `readonly formats` array)

**Action:** Add MIME types for all new text formats. Keep the existing 7 MIME types, add new ones.

**Key design decision — `application/octet-stream` handling:** Browsers send most code files (`.py`, `.go`, `.rs`, `.sh`, etc.) as either `text/plain` or `application/octet-stream`. TextParser already handles `text/plain`. We add `application/octet-stream` to TextParser.formats as a catch-all fallback for binary-labeled text files. This is correct for alpha because the frontend is the primary gate — only text extensions pass through, so any `application/octet-stream` arriving at the backend is a text file from an alpha-allowed extension.

**IMPORTANT:** `text/html` currently lives in DoclingParser.formats (line 24). It must ALSO be added to TextParser.formats. In the parser pipeline, DoclingParser is checked first (it's the first in the `this.parsers` array in `index.ts`). Since HTML needs Docling for proper parsing (structure extraction), we keep it in DoclingParser. TextParser gets it as a fallback only if Docling is unavailable — but that's handled by the existing circuit breaker. For alpha, HTML files pasted into the upload still work through DoclingParser. No change needed for `text/html` in TextParser — DoclingParser already handles it.

**Old (lines 139–147):**
```typescript
export class TextParser implements Parser {
  readonly formats = [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "text/xml",
    "image/svg+xml",
    "application/vnd.oasis.opendocument.text",
  ]
```

**New:**
```typescript
export class TextParser implements Parser {
  // Handles all text-based formats for alpha.
  // application/octet-stream: catch-all for code files that browsers label as binary.
  // Frontend is the primary gate — only alpha text extensions reach this parser.
  readonly formats = [
    // Core text
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "text/xml",
    "image/svg+xml",
    "application/vnd.oasis.opendocument.text",
    // New text formats
    "text/html",
    "text/yaml",
    "application/x-yaml",
    "text/tab-separated-values",
    "application/toml",
    "text/x-rst",
    "text/x-tex",
    "text/x-log",
    "application/sql",
    "application/x-sql",
    "application/geo+json",
    "application/x-ndjson",
    "text/vtt",
    "application/x-subrip",
    // Source code MIME types (explicit)
    "text/x-python",
    "text/javascript",
    "application/javascript",
    "text/typescript",
    "application/typescript",
    "text/x-go",
    "text/x-rustsrc",
    "text/x-java-source",
    "text/x-c",
    "text/x-c++src",
    "text/x-csrc",
    "text/x-csharp",
    "text/x-ruby",
    "application/x-ruby",
    "text/x-php",
    "application/x-php",
    "text/x-swift",
    "text/x-kotlin",
    "text/x-scala",
    "text/x-lua",
    "text/x-r",
    "text/x-perl",
    "text/x-shellscript",
    "application/x-sh",
    "application/x-bat",
    "application/x-msdos-program",
    // Config formats
    "text/x-ini",
    "text/x-properties",
    // Catch-all for code/config files browsers label as binary
    "application/octet-stream",
  ]
```

**CRITICAL NOTE on `text/html` duplication:** TextParser now lists `text/html` in its formats. DoclingParser also lists `text/html`. Since `ParserService.parse()` finds the FIRST matching parser (`this.parsers.find()`), and DoclingParser is first in the array, HTML files will still go to Docling. TextParser's `text/html` entry serves as a safety fallback if Docling is removed or the array order changes. This is intentional and correct.

**CRITICAL NOTE on `application/octet-stream` risk:** Adding this as a catch-all means any future format type that arrives as `application/octet-stream` (e.g., a binary file uploaded via MCP) will be passed to TextParser. TextParser will decode it as UTF-8 text, producing garbage content but not crashing. For alpha, this is acceptable since the frontend gate prevents binary files from reaching the upload UI. MCP callers should set correct MIME types. Add a log warning in TextParser when processing `application/octet-stream`.

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter && bun run typecheck 2>&1 | tail -10
# Expected: no errors
# If typecheck script not available:
cd /c/Users/noadmin/nospace/development/contexter && bun tsc --noEmit 2>&1 | tail -10
# Expected: no errors
```

**Done when:**
- [ ] TextParser.formats contains all MIME types listed above
- [ ] `application/octet-stream` is present as last item (catch-all)
- [ ] No TypeScript errors in docling.ts
- [ ] `text/html` is present in TextParser.formats (even though DoclingParser handles it first)

---

## Task 6: `src/services/parsers/docling.ts` — Add `application/octet-stream` log warning in TextParser.parse()

**File:** `src/services/parsers/docling.ts`  
**Location:** Inside `TextParser.parse()` method, after line 149 (before `const buffer = ...`)

**Action:** Add a warning log when TextParser receives `application/octet-stream`. This surfaces unexpected binary files reaching the parser.

**Old (lines 149–161):**
```typescript
  async parse(input: ParserInput): Promise<ParseResult> {
    const buffer = input.file instanceof ArrayBuffer
      ? input.file
      : await streamToBuffer(input.file)

    const content = new TextDecoder().decode(buffer)

    return {
      content,
      metadata: buildMetadata(input, content, detectFormat(input.mimeType), {}),
    }
  }
```

**New:**
```typescript
  async parse(input: ParserInput): Promise<ParseResult> {
    if (input.mimeType === "application/octet-stream") {
      console.warn(JSON.stringify({
        event: "text_parser_octet_stream_fallback",
        fileName: input.fileName,
        warning: "File arrived as application/octet-stream — decoded as UTF-8 text. Verify the file is a text-based format.",
      }))
    }

    const buffer = input.file instanceof ArrayBuffer
      ? input.file
      : await streamToBuffer(input.file)

    const content = new TextDecoder().decode(buffer)

    return {
      content,
      metadata: buildMetadata(input, content, detectFormat(input.mimeType), {}),
    }
  }
```

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter && bun tsc --noEmit 2>&1 | tail -10
# Expected: no errors
```

**Done when:**
- [ ] Warning log present for `application/octet-stream` in TextParser.parse()
- [ ] Warning is JSON-structured (consistent with other logs in docling.ts)
- [ ] No TypeScript errors

---

## Task 7: `src/services/parsers/docling.ts` — Expand `detectFormat()` mappings

**File:** `src/services/parsers/docling.ts`  
**Lines:** 290–308 (the `detectFormat` function)

**Action:** Extend the `map` with entries for all new MIME types added to TextParser.formats. This improves metadata/logging accuracy.

**Old (lines 290–308):**
```typescript
function detectFormat(mimeType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/csv": "csv",
    "application/json": "json",
    "text/plain": "txt",
    "text/markdown": "md",
    "text/html": "html",
    "text/xml": "xml",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  }
  return map[mimeType] || "unknown"
}
```

**New:**
```typescript
function detectFormat(mimeType: string): string {
  const map: Record<string, string> = {
    // Document parsers (Docling)
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.oasis.opendocument.spreadsheet": "ods",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    // Text formats (TextParser)
    "text/plain": "txt",
    "text/markdown": "md",
    "text/csv": "csv",
    "application/json": "json",
    "text/xml": "xml",
    "text/html": "html",
    "application/vnd.oasis.opendocument.text": "odt",
    "text/yaml": "yaml",
    "application/x-yaml": "yaml",
    "text/tab-separated-values": "tsv",
    "application/toml": "toml",
    "text/x-rst": "rst",
    "text/x-tex": "tex",
    "text/x-log": "log",
    "application/sql": "sql",
    "application/x-sql": "sql",
    "application/geo+json": "geojson",
    "application/x-ndjson": "ndjson",
    "text/vtt": "vtt",
    "application/x-subrip": "srt",
    // Source code
    "text/x-python": "py",
    "text/javascript": "js",
    "application/javascript": "js",
    "text/typescript": "ts",
    "application/typescript": "ts",
    "text/x-go": "go",
    "text/x-rustsrc": "rs",
    "text/x-java-source": "java",
    "text/x-c": "c",
    "text/x-c++src": "cpp",
    "text/x-csrc": "c",
    "text/x-csharp": "cs",
    "text/x-ruby": "rb",
    "application/x-ruby": "rb",
    "text/x-php": "php",
    "application/x-php": "php",
    "text/x-swift": "swift",
    "text/x-kotlin": "kt",
    "text/x-scala": "scala",
    "text/x-lua": "lua",
    "text/x-r": "r",
    "text/x-perl": "pl",
    "text/x-shellscript": "sh",
    "application/x-sh": "sh",
    "application/x-bat": "bat",
    "application/x-msdos-program": "bat",
    // Config
    "text/x-ini": "ini",
    "text/x-properties": "cfg",
    // Catch-all
    "application/octet-stream": "bin",
  }
  return map[mimeType] || "unknown"
}
```

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter && bun tsc --noEmit 2>&1 | tail -10
# Expected: no errors
```

**Done when:**
- [ ] detectFormat() maps all new MIME types to human-readable format strings
- [ ] `application/octet-stream` maps to `"bin"` (makes octet-stream fallback visible in logs)
- [ ] No TypeScript errors

---

## Task 8: `src/services/parsers/index.ts` — Add extension-based octet-stream fallback

**File:** `src/services/parsers/index.ts`  
**Location:** `ParserService.parse()` method (lines 28–37)

**Current behavior:** If no parser matches the MIME type, throws `Error: No parser found for MIME type: <mime>`.

**Problem:** When a browser sends `application/octet-stream` AND `application/octet-stream` is in TextParser.formats (after Task 5), the existing lookup already works — `parsers.find()` will find TextParser. Task 8 therefore is ONLY needed as a defense-in-depth measure for scenarios where a future refactor removes `application/octet-stream` from TextParser.formats.

**Decision:** Since Task 5 already adds `application/octet-stream` to TextParser.formats, Task 8 is DEFERRED. The defense-in-depth approach would add complexity without being needed now.

**Action:** No change to `src/services/parsers/index.ts` in this spec.

**Done when:**
- [ ] Verified that `parse()` in index.ts correctly routes `application/octet-stream` to TextParser after Task 5 is applied
- [ ] No changes needed

---

## Backend Commit

After Tasks 5–7 pass verification:

```bash
cd /c/Users/noadmin/nospace/development/contexter
git add src/services/parsers/docling.ts
git commit -m "feat(alpha-B1): expand TextParser to 50+ text MIME types, add octet-stream fallback"
```

---

## Acceptance Criteria

| ID | Criteria | Verify |
|---|---|---|
| AC-1 | Upload.tsx rejects pdf/docx/xlsx/pptx/png/mp3/mp4 | `t("toast.unsupportedFormat")` shown for each rejected ext |
| AC-2 | Upload.tsx accepts .py, .yaml, .go, .rs, .sql, .srt | No error on file drop with these extensions |
| AC-3 | Hero.tsx SUPPORTED_EXTENSIONS matches Upload.tsx exactly | Visual diff of the two Sets in the files |
| AC-4 | en.ts has no format strings mentioning "audio/video/images" without "coming after alpha" | Grep: `grep -n "audio\|video\|images" web/src/lib/translations/en.ts` — only FAQ and roadmap q2 entries allowed |
| AC-5 | ru.ts mirrors en.ts format changes in Russian | Manual check: each changed key in en.ts has a matching update in ru.ts |
| AC-6 | TextParser.formats includes `application/octet-stream` | `grep -n "octet-stream" src/services/parsers/docling.ts` → 2 hits (formats array + warn log) |
| AC-7 | Backend TypeScript compiles | `bun tsc --noEmit` → exit 0 |
| AC-8 | Frontend TypeScript compiles | `npx tsc --noEmit -p web/tsconfig.json` → exit 0 |
| AC-9 | detectFormat() returns correct string for new MIME types | Unit check: `detectFormat("text/x-python") === "py"` etc. |
| AC-10 | MCP upload_document not restricted (backend unchanged) | Backend still accepts `application/pdf` via API — DoclingParser.formats unmodified |

---

## Deploy Order

1. **Backend first** — deploy to Hetzner (new TextParser MIME types must be live before frontend allows the files through)
2. **Frontend** — CF Pages auto-deploys on merge to main (or trigger manually)

Reason: if frontend allows `.yaml` but backend doesn't have `text/yaml` in TextParser.formats, the file reaches the backend and throws "No parser found". Backend deploy first eliminates this window.

---

## Known Gaps (post-alpha backlog)

- Extension-less files (`Dockerfile`, `Makefile`, `.gitignore`) cannot be uploaded via UI — `getExtension()` returns `""`. Requires a `validateFile()` change and browser file dialog `accept` attribute update. Out of scope for this spec.
- DropZone `<input type="file">` has no `accept` attribute — all files appear in the browser picker, only rejected at drop/select time via `validateFile()`. This is intentional — adding `accept` with 50+ extensions would create a huge attribute string and is deferred.
- `image/svg+xml` is in TextParser.formats but `svg` is no longer in SUPPORTED_EXTENSIONS (removed from alpha set as it's a vector image format). The backend TextParser still handles SVG if uploaded via MCP. This is correct — frontend-only restriction.
