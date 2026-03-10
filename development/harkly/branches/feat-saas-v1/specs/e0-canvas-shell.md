# EPIC SPEC — E0.5: Canvas Shell
> Tags: [canvas, infinite-canvas, chat, agents, orchestrator, multi-provider, toolbar, floor]
> Дата: 2026-03-08
> Статус: 🟡 PLANNING

---

## Classification

| Field | Value |
|---|---|
| **GAIA Level** | L3 |
| **Token Budget** | ~400K |
| **Depends On** | E0 (scaffold, auth, DB) |
| **Topology** | Single-Agent (Qwen) |
| **HITL Checkpoint** | После базового canvas render + после agent messaging работает |

---

## Definition of Ready (DoR)

- [x] GAIA Level assigned
- [x] Token Budget fixed
- [x] Problem Statement written
- [x] AC finalized
- [x] Verification Gates defined
- [x] Dependencies resolved (E0)
- [x] Out of Scope listed

---

## Problem Statement

Canvas Shell — это полная оболочка Harkly: infinite canvas как рабочая поверхность, chat-интерфейс с реальными AI-агентами (у каждого свой провайдер, модель, контекст), agent status bar, bottom toolbar. Всё последующее (E1-E6) — это Frame-компоненты внутри этого shell. Shell должен работать до того как написана хоть одна строка кода для исследований.

---

## Scope

**In scope:**
- Infinite canvas: CSS transform pan/zoom + beige grid background
- Frame component system: абсолютное позиционирование + drag + resize + z-index
- Chat panel: 3 позиции (left/center/right), collapse/expand, история сообщений
- Agent status bar: список запущенных агентов, статус каждого, play/pause
- Bottom toolbar: input + attach + context window display + model selector + modes + scripts + MCP toggle
- Top right UI: floor indicator (номер) + coordinates + user avatar (→ dropdown: settings, billing, logout)
- Agent configuration panel (кнопка "Agents" → drawer/modal)
- Multi-agent system: orchestrator (первый, не удаляется) + configurable sub-agents
- Per-agent: name, provider (Anthropic/OpenAI/Ollama/custom), model string, API key (encrypted), messages[], context_used, context_max, status
- Agent messaging: send message → routes to selected agent → streams response → updates messages[]
- Canvas state persistence: pan/zoom/frame positions → localStorage
- Floor navigation: floor 0-5 indicator (visual only in v1, semantic context for agents in v2)
- Keyboard shortcuts: Cmd+K (omnibar/agent input), Cmd+1..6 (floor shortcuts placeholder)
- Empty canvas state (pre-E1): shows "Start a research" placeholder frame in center

**Out of scope:**
- Реальные исследовательские фреймы (E1-E6)
- Agent-to-agent communication protocol (v2) — в v1 orchestrator только
- Multi-user canvas (collaboration, cursors) — v2
- Canvas sharing (публичная ссылка на canvas view) — v2
- Keyboard canvas navigation (vim-style hjkl) — v2
- Canvas minimap — v2
- Scripts система (placeholder кнопка есть, функционал — v2)
- MCP connections UI (placeholder кнопка есть, функционал — v2)
- Modes selector (placeholder есть, функционал — v2)

---

## Data Models

### Agent (in-memory + localStorage, NOT in DB for v1)

```typescript
// types/agent.ts
export type AgentProvider = 'anthropic' | 'openai' | 'ollama' | 'custom'

export type AgentStatus = 'idle' | 'thinking' | 'responding' | 'error' | 'paused'

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface Agent {
  id: string
  name: string
  provider: AgentProvider
  model: string           // e.g. "claude-sonnet-4-6", "gpt-4o", "llama3.2"
  apiKey?: string         // stored in localStorage, never sent to our server
  baseUrl?: string        // for Ollama/custom providers
  contextMax: number      // max tokens for this model
  contextUsed: number     // current usage estimate
  status: AgentStatus
  isOrchestrator: boolean // first agent, cannot be deleted
  messages: AgentMessage[]
  systemPrompt?: string
  color: string           // UI color accent for this agent
}
```

### Canvas State (localStorage)

```typescript
// types/canvas.ts
export interface CanvasState {
  pan: { x: number; y: number }
  zoom: number            // 0.25 – 2.0
  frames: CanvasFrame[]
}

export interface CanvasFrame {
  id: string
  type: string            // 'framing-studio' | 'corpus-triage' | etc. (E1-E6)
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  isMinimized: boolean
  projectId?: string      // which ResearchProject this frame belongs to
  data?: Record<string, unknown>  // frame-specific state
}
```

### Chat State (in-memory, resets on reload for v1)

```typescript
// types/chat.ts
export type ChatPosition = 'left' | 'center' | 'right'

export interface ChatState {
  position: ChatPosition
  isCollapsed: boolean
  selectedAgentId: string
}
```

### Agent Storage (localStorage key: `harkly-agents`)

API keys stored ONLY in localStorage (client-side), never transmitted to Harkly servers. This is a hard security requirement.

---

## Component Architecture

```
app/
  (app)/
    workspace/
      [workspaceId]/
        page.tsx          ← Main canvas page (single route for the app)

components/
  canvas/
    Canvas.tsx            ← Root canvas component (pan/zoom container)
    CanvasGrid.tsx        ← Beige grid background (CSS background-image)
    CanvasFrame.tsx       ← Individual draggable/resizable window
    FrameChrome.tsx       ← Window header (title, minimize, close buttons)
    useCanvasState.ts     ← Pan/zoom state + keyboard shortcuts
    useFrames.ts          ← Frame CRUD, positions, z-index management
  chat/
    ChatPanel.tsx         ← Main chat wrapper (positions left/center/right)
    ChatMessages.tsx      ← Message history (virtualized list)
    ChatInput.tsx         ← Textarea + send button
    ChatPositionControls.tsx  ← Left/right arrow icons
    useChat.ts            ← Chat state, position, collapse
  agents/
    AgentStatusBar.tsx    ← Running agents list + status badges
    AgentConfigPanel.tsx  ← Drawer: list + add/edit/delete agents
    AgentCard.tsx         ← Single agent config form
    AgentBadge.tsx        ← Status indicator (Thinking... | Research... | idle)
    useAgents.ts          ← Agent state, CRUD, messaging
  toolbar/
    BottomToolbar.tsx     ← Full bottom bar wrapper
    ContextWindowDisplay.tsx  ← "50K / 128K" display
    ModelSelector.tsx     ← Dropdown to change model of selected agent
    ModesToggle.tsx       ← Placeholder button
    ScriptsToggle.tsx     ← Placeholder button
    McpToggle.tsx         ← Placeholder button
    AttachButton.tsx      ← File attach (placeholder in v1)
  topright/
    FloorIndicator.tsx    ← "3" + floor label
    CoordinatesDisplay.tsx ← "x: 420, y: 180" (canvas pan coordinates)
    UserAvatarMenu.tsx    ← Circle → DropdownMenu (settings, billing, logout)
  layout/
    AppShell.tsx          ← Assembles all shell components
```

---

## Canvas Implementation

### Pan & Zoom

```typescript
// CSS transform approach (performant, no canvas API needed)
// The "world" div transforms; frames are children with absolute positions in world space

<div className="canvas-viewport" style={{ overflow: 'hidden', width: '100vw', height: '100vh' }}>
  <div
    className="canvas-world"
    style={{
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      transformOrigin: '0 0',
      position: 'absolute',
    }}
  >
    <CanvasGrid />
    {frames.map(frame => <CanvasFrame key={frame.id} {...frame} />)}
  </div>
</div>
```

**Pan:** mouse drag on canvas background (not on frames) → update pan.x, pan.y
**Zoom:** mouse wheel → update zoom (clamp 0.25 – 2.0), zoom toward cursor point
**Touch:** pinch-to-zoom + two-finger pan (basic support)

### Grid Background

```css
.canvas-grid {
  background-color: #faf8f0;  /* beige */
  background-image:
    linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px);
  background-size: 40px 40px;
  width: 10000px;
  height: 10000px;
  position: absolute;
  top: -5000px;
  left: -5000px;
}
```

### Frame Drag & Resize

Use `@use-gesture/react` for drag (performant, no re-renders on mousemove):

```typescript
const bind = useDrag(({ offset: [x, y] }) => {
  updateFrame(frame.id, { x, y })
}, { from: () => [frame.x, frame.y] })
```

Resize: drag handles on frame corners/edges → update width/height (min: 240x160).

---

## Chat Panel Layout

### Position States

```
LEFT:                    CENTER:                  RIGHT:
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│ Chat  │        │       │       Chat     │       │        │ Chat  │
│       │ Canvas │       │ Canvas │ Panel │       │ Canvas │       │
│       │        │       │        │       │       │        │       │
│       │        │       │        │       │       │        │       │
└───────┴────────┘       └────────┴───────┘       └────────┴───────┘
  Arrow: → only           Arrows: ← →               Arrow: ← only
```

Chat panel width: 380px fixed.
Canvas viewport adjusts accordingly.

### Position transition

CSS transition on margin/transform. Arrow buttons:
- Center position: both arrows visible (← moves to left, → moves to right)
- Left position: only → arrow visible (moves to center)
- Right position: only ← arrow visible (moves to center)

### Collapse/Expand

Dark pill button at top of chat panel (draggable handle area):
- Expanded: full height, messages visible
- Collapsed: only bottom toolbar visible (height ~80px), messages hidden
- CSS height transition

### Chat Panel Structure (from bottom up)

```
┌─ Chat Panel ──────────────────────────────┐
│ [← →] collapse toggle     [floor] [avatar]│  ← top chrome (moves with chat)
├───────────────────────────────────────────┤
│ Agent Status Bar                          │  ← running agents
│  [⏸ Thinking...] [⏸ Research...] [▶] [▶] │
├───────────────────────────────────────────┤
│                                           │
│  Message history (scrollable)             │
│                                           │
├───────────────────────────────────────────┤
│ [input textarea                         ] │  ← input row
│ [📎][50K/128K][claude-sonnet-4-6▼][...] ] │  ← toolbar row
└───────────────────────────────────────────┘
```

**When chat is LEFT or RIGHT:** floor indicator + avatar move to be INSIDE the chat panel top chrome (not on canvas). When chat is CENTER: floor + avatar are in top-right of canvas. This is the behavior shown in the screenshots.

---

## Agent System

### Default State (first load)

One orchestrator agent pre-configured:
```typescript
{
  id: 'orchestrator',
  name: 'Orchestrator',
  provider: 'anthropic',
  model: 'claude-sonnet-4-6',
  apiKey: '',  // user must set
  contextMax: 200000,
  contextUsed: 0,
  status: 'idle',
  isOrchestrator: true,
  messages: [],
  systemPrompt: 'You are the orchestrator for Harkly research platform...',
  color: '#6366f1'
}
```

### Agent Configuration Panel

Opens via "Agents" button click. `Sheet` (drawer) from right:
- List of agents (orchestrator first, locked name)
- "Add agent" button → new row
- Each agent: name input, provider dropdown, model input, API key input (type=password), system prompt textarea, delete button (except orchestrator)
- "Test connection" button per agent → sends minimal ping to provider
- shadcn: `Sheet`, `Form`, `Input`, `Select`, `Textarea`, `Button`

### Sending Messages

```typescript
async function sendMessage(content: string, agentId: string) {
  // 1. Add user message to agent.messages
  // 2. Set agent.status = 'thinking'
  // 3. Build API request based on agent.provider
  // 4. Stream response (SSE or fetch with ReadableStream)
  // 5. Update agent.messages with streamed assistant response
  // 6. Update agent.contextUsed estimate
  // 7. Set agent.status = 'idle'
}
```

### Provider API Adapters

```typescript
// lib/providers/anthropic.ts
async function* streamAnthropic(agent: Agent, messages: AgentMessage[]) { ... }

// lib/providers/openai.ts
async function* streamOpenAI(agent: Agent, messages: AgentMessage[]) { ... }

// lib/providers/ollama.ts
async function* streamOllama(agent: Agent, messages: AgentMessage[]) { ... }
```

**CRITICAL:** API calls go directly from browser to provider APIs. They do NOT proxy through Harkly's Next.js server. This means:
- CORS: providers must allow browser-to-API calls (Anthropic does, OpenAI does, Ollama does for localhost)
- API keys: stored in localStorage, sent directly to provider, never hit our server
- No API key logging on our side

### Context Window Display

Estimated context = sum of message token counts (rough estimate: chars / 4).
Updates after each message. Color changes:
- Green: < 50% used
- Yellow: 50-80% used
- Red: > 80% used

### Agent Status Bar Behavior

- Shows only agents that have been used (status != idle AND messages.length > 0)
- OR: shows all configured agents always (simpler, go with this)
- Each agent chip: colored dot (by agent.color) + name + status text + pause/play button
- Clicking agent chip: selects that agent (chat shows their message history)
- "Thinking..." status: animated pulsing dot
- Paused: agent.status = 'paused', stops streaming

---

## UI Dimensions & Colors

```css
/* Canvas */
--canvas-bg: #faf8f0;        /* beige */
--canvas-grid: rgba(0,0,0,0.06);
--canvas-grid-size: 40px;

/* Chat panel */
--chat-width: 380px;
--chat-bg: #ffffff;
--chat-border: rgba(0,0,0,0.08);

/* Bottom toolbar */
--toolbar-height: 80px;
--toolbar-bg: #f5f5f5;

/* Frames */
--frame-bg: #ffffff;
--frame-border: rgba(0,0,0,0.08);
--frame-shadow: 0 2px 8px rgba(0,0,0,0.08);
--frame-radius: 8px;

/* Agent status */
--agent-bar-height: 36px;
--agent-bar-bg: #f9f9f9;
--agent-bar-border: rgba(0,0,0,0.06);
```

---

## Route Structure

```
/                   ← Landing + waitlist (from E0)
/login              ← Auth (from E0)
/register           ← Auth (from E0)
/app/[workspaceId]  ← Canvas Shell (this epic)
/share/[token]      ← Public artifact view (E6)
```

Single canvas route. URL does NOT change when opening frames — canvas state in localStorage.

---

## Acceptance Criteria (AC)

- [ ] **AC-051**: `/app/[workspaceId]` рендерится с beige canvas и grid
- [ ] **AC-052**: Canvas пан: drag on background → canvas moves, pan state persists в localStorage
- [ ] **AC-053**: Canvas зум: mouse wheel → zoom in/out (clamp 0.25–2.0)
- [ ] **AC-054**: Zoom происходит relative to cursor position (не к центру экрана)
- [ ] **AC-055**: Chat panel отображается в центре по умолчанию (initial state)
- [ ] **AC-056**: Стрелка → (когда chat center) перемещает chat в right position
- [ ] **AC-057**: Стрелка ← (когда chat center) перемещает chat в left position
- [ ] **AC-058**: Когда chat left → только стрелка → видна
- [ ] **AC-059**: Когда chat right → только стрелка ← видна
- [ ] **AC-060**: Collapse button сворачивает chat до toolbar height (~80px)
- [ ] **AC-061**: Expand восстанавливает полный размер
- [ ] **AC-062**: Floor indicator показывает "0" по умолчанию (clickable placeholder)
- [ ] **AC-063**: Avatar круг в top right открывает DropdownMenu (Settings, Billing, Logout)
- [ ] **AC-064**: Когда chat LEFT или RIGHT — floor + avatar перемещаются внутрь chat panel top
- [ ] **AC-065**: Когда chat CENTER — floor + avatar в top-right corner canvas
- [ ] **AC-066**: Agent status bar показывает список агентов с именем + статусом
- [ ] **AC-067**: По умолчанию один агент "Orchestrator" с provider=anthropic
- [ ] **AC-068**: "Agents" button открывает Agent Configuration panel (Sheet)
- [ ] **AC-069**: В Agent Config: можно добавить нового агента (name + provider + model + API key)
- [ ] **AC-070**: API key сохраняется в localStorage (НЕ в БД, НЕ отправляется на сервер)
- [ ] **AC-071**: "Test connection" отправляет минимальный запрос к provider API
- [ ] **AC-072**: Orchestrator агент не может быть удалён
- [ ] **AC-073**: Ввод сообщения в input + Enter → сообщение добавляется в историю
- [ ] **AC-074**: Сообщение отправляется выбранному агенту (его provider API)
- [ ] **AC-075**: Response стримится в UI (текст появляется постепенно)
- [ ] **AC-076**: Во время стриминга: agent.status = 'thinking', пульсирующий индикатор
- [ ] **AC-077**: После ответа: agent.status = 'idle', context counter обновляется
- [ ] **AC-078**: Pause button останавливает стриминг
- [ ] **AC-079**: Context window display показывает "50K / 200K" (используемый / максимальный)
- [ ] **AC-080**: Model selector dropdown меняет model у текущего агента
- [ ] **AC-081**: "Scripts" кнопка присутствует (placeholder, не функциональна)
- [ ] **AC-082**: "MCP" кнопка присутствует (placeholder)
- [ ] **AC-083**: "Modes" кнопка присутствует (placeholder)
- [ ] **AC-084**: CanvasFrame компонент: drag перемещает frame на канвасе
- [ ] **AC-085**: CanvasFrame: resize через corner handles меняет width/height
- [ ] **AC-086**: Frame positions сохраняются в localStorage, восстанавливаются при reload
- [ ] **AC-087**: Canvas state (pan, zoom, frames) персистируется per workspaceId
- [ ] **AC-088**: Empty canvas показывает placeholder "Start a research question" в центре
- [ ] **AC-089**: Нет TypeScript ошибок

---

## Verification Gates

| Шаг | Команда / Условие | Ожидаемый результат |
|---|---|---|
| Build | `bun run build` | Exit 0 |
| Canvas renders | GET `/app/[workspaceId]` | 200, beige canvas with grid |
| Pan | Mouse drag on canvas | Canvas moves, position saved to localStorage |
| Zoom | Mouse wheel | Zoom changes, stays within 0.25-2.0 |
| Chat position | Click → arrow | Chat moves right, only ← arrow visible |
| Chat collapse | Click collapse button | Chat shrinks to toolbar height |
| Agent send | Type + Enter with valid API key | Message appears, response streams |
| Provider error | Type + Enter with invalid API key | Error message shown in chat |
| Frame drag | Drag a frame | Frame moves on canvas |
| Persistence | Reload page | Pan, zoom, frame positions restored |
| API key safety | Check Network tab in DevTools | No requests to harkly.ru/api with api keys |
| Unit tests | `bun run test` | All pass |

---

## Definition of Done (DoD)

- [ ] Все AC выше: PASS
- [ ] Все Verification Gates: PASS
- [ ] Unit tests: canvas pan/zoom math + context estimation + agent state machine + provider adapter (mock)
- [ ] **CRITICAL**: API keys never appear in Network requests to Harkly servers
- [ ] **CRITICAL**: No API keys in console.log or error messages
- [ ] Canvas performance: pan/zoom smooth at 60fps (no layout thrashing)
- [ ] `@use-gesture/react` used for drag (not native onMouseMove)
- [ ] Нет `any` типов
- [ ] Все компоненты < 300 строк
