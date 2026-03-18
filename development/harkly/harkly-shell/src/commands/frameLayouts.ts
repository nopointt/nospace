import type { FrameData } from "../types/frame";
import { kernel } from "../kernel";

// --- Types ---

export type LayoutStrategy = "grid" | "stack" | "single" | "custom";

export interface FrameLayout {
    readonly name: string;
    readonly description: string;
    readonly strategy: LayoutStrategy;
    readonly frames: readonly FrameData[];
    // Grid strategy options
    readonly gridCols?: number;
    readonly gridGap?: number;
    readonly gridStartX?: number;
    readonly gridStartY?: number;
    // Stack strategy options
    readonly stackDirection?: "horizontal" | "vertical";
    readonly stackGap?: number;
    readonly stackStartX?: number;
    readonly stackStartY?: number;
}

// --- Default constants ---

const DEFAULT_GRID_COLS = 3;
const DEFAULT_GRID_GAP = 40;
const DEFAULT_GRID_START_X = 80;
const DEFAULT_GRID_START_Y = 80;

const DEFAULT_STACK_GAP = 40;
const DEFAULT_STACK_START_X = 80;
const DEFAULT_STACK_START_Y = 80;

const DEFAULT_FRAME_WIDTH = 400;
const DEFAULT_FRAME_HEIGHT = 400;

// --- Layout definitions ---

export const FRAME_LAYOUTS: Record<string, FrameLayout> = {
    mcb: {
        name: "Marketing Command Board",
        description: "6 MCB frames: strategy, signal brief, SEO, gap detail, task card, experiment",
        strategy: "custom",
        frames: [
            { id: "mcb-strategy-1", type: "mcb-strategy", title: "MCB \u2014 SEO Strategy", x: 80, y: 80, width: 520, height: 640 },
            { id: "mcb-signal-1", type: "mcb-signal-brief", title: "Signal: \u0411\u043b\u043e\u0433", x: 640, y: 80, width: 400, height: 560 },
            { id: "mcb-seo-1", type: "mcb-seo", title: "MCB-SEO Command", x: 1080, y: 80, width: 820, height: 560 },
            { id: "mcb-gap-1", type: "mcb-gap-detail", title: "Gap: Neural Search", x: 1940, y: 80, width: 400, height: 600 },
            { id: "mcb-task-1", type: "mcb-task-card", title: "Task: Blog Articles", x: 2380, y: 80, width: 440, height: 620 },
            { id: "mcb-exp-1", type: "mcb-experiment", title: "Exp: FAQ Geo-Pages", x: 2860, y: 80, width: 400, height: 560 },
        ],
    },

    kernel: {
        name: "Kernel Dashboard",
        description: "Kernel status and memory viewer frames",
        strategy: "custom",
        frames: [
            { id: "kernel-status-1", type: "agent-status", title: "Kernel Status", x: 80, y: 80, width: 380, height: 280 },
            { id: "memory-viewer-1", type: "memory-viewer", title: "Memory", x: 500, y: 80, width: 480, height: 520 },
        ],
    },

    g3: {
        name: "G3 Session",
        description: "G3 dialectical autocoding session frame",
        strategy: "single",
        frames: [
            { id: "g3-session-1", type: "g3-session", title: "G3 Session", width: 720, height: 600 },
        ],
    },

    help: {
        name: "Help",
        description: "List all available Omnibar commands",
        strategy: "single",
        frames: [
            { id: "help-1", type: "help", title: "Help", width: 480, height: 500 },
        ],
    },

    status: {
        name: "System Status",
        description: "Kernel health, memory stats, services overview",
        strategy: "single",
        frames: [
            { id: "status-1", type: "system-status", title: "System Status", width: 520, height: 620 },
        ],
    },

    dirizhyor: {
        name: "Dirizhyor",
        description: "Invoke full agent hierarchy: Intent → Chiefs → Leads → Result",
        strategy: "single",
        frames: [
            { id: "dirizhyor-1", type: "dirizhyor-session", title: "Dirizhyor", width: 760, height: 640 },
        ],
    },

    "memory-admin": {
        name: "Memory Admin",
        description: "Browse and manage Global, Domain, Project memory + frozen proposals",
        strategy: "single",
        frames: [
            { id: "memory-admin-1", type: "memory-admin", title: "Memory Admin", width: 680, height: 620 },
        ],
    },

    "regulator-log": {
        name: "Regulator Log",
        description: "Regulator violations timeline with severity filters",
        strategy: "single",
        frames: [
            { id: "regulator-log-1", type: "regulator-log", title: "Regulator Log", width: 640, height: 560 },
        ],
    },

    // --- Harkly floors ---

    "f0": {
        name: "F0 · Фрейминг",
        description: "Framing Studio with JTBD research question",
        strategy: "custom",
        frames: [
            { id: "fs-1", type: "framing-studio", title: "Студия фрейминга", x: 540, y: 100, width: 544, height: 480, floor: 0 },
        ],
    },

    "f1": {
        name: "F1 · Планирование",
        description: "Collection plan + source connectors",
        strategy: "custom",
        frames: [
            { id: "plan-1", type: "collection-plan", title: "План сбора", x: 80, y: 80, width: 384, height: 400, floor: 1 },
            { id: "src-files", type: "source-card", title: "Загрузка файлов", x: 520, y: 80, width: 320, height: 180, floor: 1 },
            { id: "src-tg", type: "source-card", title: "Telegram каналы", x: 880, y: 80, width: 320, height: 180, floor: 1 },
            { id: "src-trans", type: "source-card", title: "Транскрипты", x: 520, y: 300, width: 320, height: 180, floor: 1 },
            { id: "src-support", type: "source-card", title: "Тикеты поддержки", x: 880, y: 300, width: 320, height: 180, floor: 1 },
            { id: "src-vcru", type: "source-card", title: "vc.ru", x: 520, y: 520, width: 320, height: 180, floor: 1 },
            { id: "src-habr", type: "source-card", title: "Habr", x: 880, y: 520, width: 320, height: 180, floor: 1 },
        ],
    },

    "f2": {
        name: "F2 · Сырые данные",
        description: "Raw data collection and triage",
        strategy: "custom",
        frames: [
            { id: "raw-1", type: "raw-data", title: "Сырые данные", x: 300, y: 100, width: 500, height: 400, floor: 2 },
        ],
    },

    "f3": {
        name: "F3 · Инсайты",
        description: "Extracted insights and patterns",
        strategy: "custom",
        frames: [
            { id: "insights-1", type: "insights", title: "Инсайты", x: 300, y: 100, width: 500, height: 450, floor: 3 },
        ],
    },

    "f4": {
        name: "F4 · Артефакты",
        description: "Research artifacts: empathy map, fact pack, journey map",
        strategy: "custom",
        frames: [
            { id: "artifacts-1", type: "artifacts", title: "Артефакты", x: 300, y: 100, width: 500, height: 400, floor: 4 },
        ],
    },

    "f5": {
        name: "F5 · Блокнот",
        description: "Research notebook and working canvas",
        strategy: "custom",
        frames: [
            { id: "notebook-1", type: "notebook", title: "Блокнот", x: 300, y: 100, width: 500, height: 400, floor: 5 },
        ],
    },

    "harkly": {
        name: "Harkly Demo",
        description: "Full Harkly demo: all floors with content",
        strategy: "custom",
        frames: [
            // --- Branch 1: Отток после онбординга (JTBD) ---
            { id: "b1-fs", type: "framing-studio", title: "Студия фрейминга", x: 440, y: 80, width: 544, height: 480, floor: 0, branch: "Branch 1", content: "jtbd" },
            { id: "b1-plan", type: "collection-plan", title: "План сбора", x: 80, y: 80, width: 384, height: 400, floor: 1, branch: "Branch 1" },
            { id: "b1-files", type: "source-card", title: "Загрузка файлов", x: 520, y: 80, width: 320, height: 180, floor: 1, branch: "Branch 1" },
            { id: "b1-tg", type: "source-card", title: "Telegram каналы", x: 520, y: 300, width: 320, height: 180, floor: 1, branch: "Branch 1" },
            { id: "b1-support", type: "source-card", title: "Тикеты поддержки", x: 880, y: 80, width: 320, height: 180, floor: 1, branch: "Branch 1" },
            { id: "b1-vcru", type: "source-card", title: "vc.ru", x: 880, y: 300, width: 320, height: 180, floor: 1, branch: "Branch 1" },
            { id: "b1-raw", type: "raw-data", title: "Сырые данные", x: 200, y: 80, width: 560, height: 420, floor: 2, branch: "Branch 1" },
            { id: "b1-ins", type: "insights", title: "Инсайты", x: 200, y: 80, width: 560, height: 460, floor: 3, branch: "Branch 1" },
            { id: "b1-art", type: "artifacts", title: "Артефакты", x: 200, y: 80, width: 560, height: 420, floor: 4, branch: "Branch 1" },
            { id: "b1-nb", type: "notebook", title: "Блокнот", x: 120, y: 80, width: 600, height: 440, floor: 5, branch: "Branch 1" },

            // --- Branch 2: Ценообразование и willingness to pay (SPICE) ---
            { id: "b2-fs", type: "framing-studio", title: "Студия фрейминга · SPICE", x: 320, y: 120, width: 544, height: 480, floor: 0, branch: "Branch 2", content: "spice" },
            { id: "b2-plan", type: "collection-plan", title: "План сбора", x: 60, y: 100, width: 384, height: 380, floor: 1, branch: "Branch 2" },
            { id: "b2-tg", type: "source-card", title: "Telegram каналы", x: 500, y: 100, width: 320, height: 180, floor: 1, branch: "Branch 2" },
            { id: "b2-habr", type: "source-card", title: "Habr", x: 500, y: 320, width: 320, height: 180, floor: 1, branch: "Branch 2" },
            { id: "b2-trans", type: "source-card", title: "Транскрипты", x: 860, y: 100, width: 320, height: 180, floor: 1, branch: "Branch 2" },
            { id: "b2-raw", type: "raw-data", title: "Сырые данные", x: 280, y: 100, width: 520, height: 400, floor: 2, branch: "Branch 2" },
            { id: "b2-ins", type: "insights", title: "Инсайты", x: 240, y: 120, width: 580, height: 440, floor: 3, branch: "Branch 2" },
            { id: "b2-nb", type: "notebook", title: "Блокнот", x: 160, y: 60, width: 560, height: 400, floor: 5, branch: "Branch 2" },

            // --- Branch 3: Конкурентный анализ (PEO) ---
            { id: "b3-fs", type: "framing-studio", title: "Студия фрейминга · PEO", x: 500, y: 60, width: 544, height: 480, floor: 0, branch: "Branch 3", content: "peo" },
            { id: "b3-plan", type: "collection-plan", title: "План сбора", x: 100, y: 60, width: 384, height: 360, floor: 1, branch: "Branch 3" },
            { id: "b3-vcru", type: "source-card", title: "vc.ru", x: 540, y: 60, width: 320, height: 180, floor: 1, branch: "Branch 3" },
            { id: "b3-habr", type: "source-card", title: "Habr", x: 540, y: 280, width: 320, height: 180, floor: 1, branch: "Branch 3" },
            { id: "b3-files", type: "source-card", title: "Загрузка файлов", x: 900, y: 60, width: 320, height: 180, floor: 1, branch: "Branch 3" },
            { id: "b3-raw", type: "raw-data", title: "Сырые данные", x: 320, y: 80, width: 500, height: 380, floor: 2, branch: "Branch 3" },
            { id: "b3-art", type: "artifacts", title: "Артефакты", x: 260, y: 100, width: 540, height: 400, floor: 4, branch: "Branch 3" },
            { id: "b3-nb", type: "notebook", title: "Блокнот", x: 200, y: 100, width: 540, height: 380, floor: 5, branch: "Branch 3" },

            // --- Branch 4: Проблемы онбординга (Issue Tree) ---
            { id: "b4-fs", type: "framing-studio", title: "Студия фрейминга · Issue Tree", x: 380, y: 140, width: 544, height: 480, floor: 0, branch: "Branch 4", content: "issue-tree" },
            { id: "b4-plan", type: "collection-plan", title: "План сбора", x: 80, y: 120, width: 384, height: 400, floor: 1, branch: "Branch 4" },
            { id: "b4-support", type: "source-card", title: "Тикеты поддержки", x: 520, y: 120, width: 320, height: 180, floor: 1, branch: "Branch 4" },
            { id: "b4-trans", type: "source-card", title: "Транскрипты", x: 520, y: 340, width: 320, height: 180, floor: 1, branch: "Branch 4" },
            { id: "b4-tg", type: "source-card", title: "Telegram каналы", x: 880, y: 120, width: 320, height: 180, floor: 1, branch: "Branch 4" },
            { id: "b4-ins", type: "insights", title: "Инсайты", x: 220, y: 80, width: 600, height: 480, floor: 3, branch: "Branch 4" },
            { id: "b4-nb", type: "notebook", title: "Блокнот", x: 140, y: 80, width: 580, height: 420, floor: 5, branch: "Branch 4" },

            // --- Branch 5: Валидация MVP фичи (FINER) ---
            { id: "b5-fs", type: "framing-studio", title: "Студия фрейминга · FINER", x: 460, y: 100, width: 544, height: 480, floor: 0, branch: "Branch 5", content: "finer" },
            { id: "b5-plan", type: "collection-plan", title: "План сбора", x: 60, y: 80, width: 384, height: 380, floor: 1, branch: "Branch 5" },
            { id: "b5-files", type: "source-card", title: "Загрузка файлов", x: 500, y: 80, width: 320, height: 180, floor: 1, branch: "Branch 5" },
            { id: "b5-tg", type: "source-card", title: "Telegram каналы", x: 860, y: 80, width: 320, height: 180, floor: 1, branch: "Branch 5" },
            { id: "b5-raw", type: "raw-data", title: "Сырые данные", x: 260, y: 100, width: 540, height: 400, floor: 2, branch: "Branch 5" },
            { id: "b5-ins", type: "insights", title: "Инсайты", x: 260, y: 80, width: 540, height: 460, floor: 3, branch: "Branch 5" },
            { id: "b5-art", type: "artifacts", title: "Артефакты", x: 260, y: 80, width: 540, height: 420, floor: 4, branch: "Branch 5" },
            { id: "b5-nb", type: "notebook", title: "Блокнот", x: 180, y: 60, width: 580, height: 440, floor: 5, branch: "Branch 5" },
        ],
    },
};

// --- Layout resolver ---

/**
 * Resolve a FrameLayout into concrete FrameData[] with computed positions.
 * Returns a new array - never mutates the input layout.
 *
 * Strategies:
 * - "custom": returns frames as-is (positions already defined)
 * - "grid":   arranges frames in a grid with gridCols columns
 * - "stack":  arranges frames linearly (horizontal or vertical)
 * - "single": centers the single frame on the viewport (or uses defaults)
 */
export function resolveLayout(
    layout: FrameLayout,
    viewportWidth?: number,
    viewportHeight?: number,
): FrameData[] {
    switch (layout.strategy) {
        case "custom":
            return resolveCustom(layout);
        case "grid":
            return resolveGrid(layout);
        case "stack":
            return resolveStack(layout);
        case "single":
            return resolveSingle(layout, viewportWidth, viewportHeight);
        default: {
            const _exhaustive: never = layout.strategy;
            throw new Error(`Unknown layout strategy: ${_exhaustive}`);
        }
    }
}

// --- Strategy implementations ---

function resolveCustom(layout: FrameLayout): FrameData[] {
    return layout.frames.map((frame) => ({ ...frame }));
}

function resolveGrid(layout: FrameLayout): FrameData[] {
    const cols = layout.gridCols ?? DEFAULT_GRID_COLS;
    const gap = layout.gridGap ?? DEFAULT_GRID_GAP;
    const startX = layout.gridStartX ?? DEFAULT_GRID_START_X;
    const startY = layout.gridStartY ?? DEFAULT_GRID_START_Y;

    return layout.frames.map((frame, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const w = frame.width ?? DEFAULT_FRAME_WIDTH;
        const h = frame.height ?? DEFAULT_FRAME_HEIGHT;

        return {
            ...frame,
            x: startX + col * (w + gap),
            y: startY + row * (h + gap),
        };
    });
}

function resolveStack(layout: FrameLayout): FrameData[] {
    const direction = layout.stackDirection ?? "horizontal";
    const gap = layout.stackGap ?? DEFAULT_STACK_GAP;
    const startX = layout.stackStartX ?? DEFAULT_STACK_START_X;
    const startY = layout.stackStartY ?? DEFAULT_STACK_START_Y;

    let cursor = 0;

    return layout.frames.map((frame) => {
        const w = frame.width ?? DEFAULT_FRAME_WIDTH;
        const h = frame.height ?? DEFAULT_FRAME_HEIGHT;

        const x = direction === "horizontal" ? startX + cursor : startX;
        const y = direction === "vertical" ? startY + cursor : startY;

        cursor += (direction === "horizontal" ? w : h) + gap;

        return { ...frame, x, y };
    });
}

function resolveSingle(
    layout: FrameLayout,
    viewportWidth?: number,
    viewportHeight?: number,
): FrameData[] {
    const vw = viewportWidth ?? 1920;
    const vh = viewportHeight ?? 1080;

    return layout.frames.map((frame) => {
        const w = frame.width ?? DEFAULT_FRAME_WIDTH;
        const h = frame.height ?? DEFAULT_FRAME_HEIGHT;

        return {
            ...frame,
            x: Math.round((vw - w) / 2),
            y: Math.round((vh - h) / 2),
        };
    });
}

// --- Phase 9.4: Dynamic frame layouts from external JSON config ---

const LAYOUTS_STORAGE_KEY = "tlos-custom-frame-layouts";

/**
 * Load external layouts from localStorage (persisted JSON config).
 * Merges into FRAME_LAYOUTS — external layouts override built-in ones with same name.
 * Call at app startup after registerDefaultCommands().
 *
 * JSON format: Record<string, FrameLayout> (same shape as FRAME_LAYOUTS entries).
 * Users can set this via `localStorage.setItem("tlos-custom-frame-layouts", JSON.stringify({...}))`.
 */
export function loadExternalLayouts(): number {
    try {
        const raw = localStorage.getItem(LAYOUTS_STORAGE_KEY);
        if (!raw) return 0;

        const external = JSON.parse(raw) as Record<string, FrameLayout>;
        let loaded = 0;

        for (const [name, layout] of Object.entries(external)) {
            if (layout && layout.name && layout.frames && Array.isArray(layout.frames)) {
                FRAME_LAYOUTS[name] = layout;
                loaded++;
            }
        }

        if (loaded > 0) {
            console.log(`[frameLayouts] Loaded ${loaded} external layout(s) from ${LAYOUTS_STORAGE_KEY}`);
        }
        return loaded;
    } catch (err) {
        console.warn("[frameLayouts] Failed to load external layouts:", err);
        return 0;
    }
}

/**
 * Save a layout to the external config (localStorage).
 * Immediately available in FRAME_LAYOUTS after save.
 */
export function saveExternalLayout(name: string, layout: FrameLayout): void {
    try {
        // Update runtime
        FRAME_LAYOUTS[name] = layout;

        // Persist
        const raw = localStorage.getItem(LAYOUTS_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) as Record<string, FrameLayout> : {};
        existing[name] = layout;
        localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(existing));
    } catch (err) {
        console.warn("[frameLayouts] Failed to save external layout:", err);
    }
}

/**
 * Request layouts from kernel via NATS (hot-reload from server-side config).
 * The kernel responds with a `kernel:layouts` message containing layout definitions.
 * Subscribe to the response and merge into FRAME_LAYOUTS.
 */
export function requestKernelLayouts(): void {
    const unsub = kernel.subscribe((raw: string) => {
        try {
            const msg = JSON.parse(raw);
            if (msg.type === "kernel:layouts" && msg.layouts) {
                let loaded = 0;
                for (const [name, layout] of Object.entries(msg.layouts as Record<string, FrameLayout>)) {
                    if (layout && (layout as FrameLayout).frames) {
                        FRAME_LAYOUTS[name] = layout as FrameLayout;
                        loaded++;
                    }
                }
                if (loaded > 0) {
                    console.log(`[frameLayouts] Hot-reloaded ${loaded} layout(s) from kernel`);
                }
                unsub();
            }
        } catch { /* ignore */ }
    });

    kernel.send(JSON.stringify({ type: "kernel:get-layouts" }));

    // Auto-unsubscribe after 5s if no response
    setTimeout(unsub, 5000);
}
