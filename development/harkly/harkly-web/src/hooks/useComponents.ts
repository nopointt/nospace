import { createSignal, onMount } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { FrameData, Viewport } from "~/lib/canvas/types";
import {
    WINDOW_DEFAULT_WIDTH,
    WINDOW_DEFAULT_HEIGHT,
} from "~/lib/canvas/constants";

const STORAGE_KEY = "harkly-canvas-state-v1";

function saveCanvasStateLocal(frames: FrameData[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(frames));
    } catch (e) {
        console.warn("[useComponents] localStorage save failed:", e);
    }
}

function loadCanvasStateLocal(): FrameData[] | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const frames = JSON.parse(raw) as FrameData[];
        // Deduplicate by ID, keep last occurrence
        const seen = new Map<string, FrameData>();
        for (const f of frames) {
            if (f.id) seen.set(f.id, f);
        }
        return Array.from(seen.values());
    } catch (e) {
        console.warn("[useComponents] localStorage parse failed:", e);
        return null;
    }
}

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

// Map D1 canvas_frames row to client FrameData
function dbFrameToClient(row: {
    id: string;
    module: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    floor: number;
    minimized: number;
    frameData: string | null;
}): FrameData {
    return {
        id: row.id,
        type: row.module as FrameData["type"],
        title: row.title,
        x: row.x,
        y: row.y,
        width: row.width,
        height: row.height,
        floor: row.floor,
    };
}

// Map client FrameData to API payload
function clientFrameToApi(f: FrameData) {
    return {
        id: f.id,
        module: f.type,
        title: f.title || f.type,
        x: f.x ?? 100,
        y: f.y ?? 100,
        width: f.width ?? WINDOW_DEFAULT_WIDTH,
        height: f.height ?? WINDOW_DEFAULT_HEIGHT,
        floor: f.floor ?? 0,
        frameData: null,
    };
}

export function useComponents(_viewport: () => Viewport, kbId?: string) {
    const saved = loadCanvasStateLocal();
    const [components, setComponents] = createStore<FrameData[]>(saved ?? []);
    const [activeId, setActiveId] = createSignal<string | null>(null);
    const [apiLoaded, setApiLoaded] = createSignal(false);

    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    // Debounced save — saves to both localStorage and API
    function debouncedSave(frames: FrameData[]) {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveCanvasStateLocal(frames);
            if (kbId && apiLoaded()) {
                saveToApi(frames).catch((err) =>
                    console.warn("[useComponents] API save failed:", err),
                );
            }
        }, 500);
    }

    // Save frames to API
    async function saveToApi(frames: FrameData[]) {
        try {
            await fetch(`/api/kb/${kbId}/canvas`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    frames: frames.map(clientFrameToApi),
                }),
            });
        } catch (err) {
            console.warn("[useComponents] API save error:", err);
        }
    }

    // Load from API on mount
    if (kbId) {
        onMount(async () => {
            try {
                const res = await fetch(`/api/kb/${kbId}/canvas`);
                if (res.ok) {
                    const json = (await res.json()) as {
                        data: {
                            frames: Array<{
                                id: string;
                                module: string;
                                title: string;
                                x: number;
                                y: number;
                                width: number;
                                height: number;
                                floor: number;
                                minimized: number;
                                frameData: string | null;
                            }>;
                            viewport: unknown;
                        };
                    };
                    if (json.data.frames.length > 0) {
                        const clientFrames = json.data.frames.map(dbFrameToClient);
                        setComponents(
                            produce((arr) => {
                                arr.splice(0, arr.length, ...clientFrames);
                            }),
                        );
                        saveCanvasStateLocal(clientFrames);
                    }
                }
                setApiLoaded(true);
            } catch (err) {
                console.warn("[useComponents] API load failed, using localStorage:", err);
                setApiLoaded(true);
            }
        });
    }

    const addFrame = (frame: Partial<FrameData> & { type: FrameData["type"] }) => {
        const id = frame.id || generateId();
        const newFrame: FrameData = {
            id,
            type: frame.type,
            title: frame.title,
            content: frame.content,
            x: frame.x ?? 100,
            y: frame.y ?? 100,
            width: frame.width ?? WINDOW_DEFAULT_WIDTH,
            height: frame.height ?? WINDOW_DEFAULT_HEIGHT,
            floor: frame.floor,
            branch: frame.branch,
            isPinned: frame.isPinned,
            color: frame.color,
        };
        setComponents((prev) => [...prev, newFrame]);
        setActiveId(id);
        queueMicrotask(() => debouncedSave([...components]));
        return id;
    };

    const removeComponent = (id: string) => {
        setComponents((prev) => prev.filter((c) => c.id !== id));
        if (activeId() === id) setActiveId(null);
        queueMicrotask(() => debouncedSave([...components]));
    };

    const replaceComponents = (frames: FrameData[]) => {
        setComponents(
            produce((arr) => {
                arr.splice(0, arr.length, ...frames);
            })
        );
        debouncedSave(frames);
    };

    const updateComponent = (
        id: string,
        updates: Partial<FrameData>
    ) => {
        setComponents(
            produce((state: FrameData[]) => {
                const idx = state.findIndex((c) => c.id === id);
                if (idx >= 0) {
                    Object.assign(state[idx], updates);
                }
            })
        );
        queueMicrotask(() => debouncedSave([...components]));
    };

    const saveCanvas = () =>
        saveCanvasStateLocal(JSON.parse(JSON.stringify([...components])));

    return {
        components,
        setComponents,
        replaceComponents,
        activeId,
        setActiveId,
        addFrame,
        removeComponent,
        updateComponent,
        saveCanvas,
    };
}
