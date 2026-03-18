import { createSignal } from "solid-js";
import { produce, SetStoreFunction } from "solid-js/store";
import type { FrameData, SnapPreview, GroupRect, GroupTransform, Viewport } from "../types/frame";
import {
    WINDOW_DEFAULT_WIDTH,
    WINDOW_DEFAULT_HEIGHT,
} from "../constants";

export function useSnap(
    components: FrameData[],
    setComponents: SetStoreFunction<FrameData[]>,
    viewport: () => Viewport
) {
    const [snapPreview] = createSignal<SnapPreview | null>(null);
    const [selectedGroup, setSelectedGroup] = createSignal<Set<string>>(new Set());
    const [initialGroupRects, setInitialGroupRects] = createSignal<{ [id: string]: GroupRect }>({});
    const [groupTransform, setGroupTransform] = createSignal<GroupTransform | null>(null);

    const captureGroupRects = (id: string) => {
        const group = selectedGroup();
        const rects: { [id: string]: GroupRect } = {};
        if (group.has(id) && group.size > 1) {
            components.forEach(c => {
                if (group.has(c.id)) rects[c.id] = { x: c.x || 0, y: c.y || 0, w: c.width || WINDOW_DEFAULT_WIDTH, h: c.height || WINDOW_DEFAULT_HEIGHT };
            });
        } else {
            const c = components.find(c => c.id === id);
            rects[id] = { x: c?.x || 0, y: c?.y || 0, w: c?.width || WINDOW_DEFAULT_WIDTH, h: c?.height || WINDOW_DEFAULT_HEIGHT };
        }
        setInitialGroupRects(rects);
    };

    const handleDoubleClick = (id: string) => {
        const visited = new Set<string>([id]);
        const queue = [id];
        while (queue.length > 0) {
            const currId = queue.shift()!;
            const curr = components.find(c => c.id === currId);
            if (curr) {
                if (curr.attachedTo && !visited.has(curr.attachedTo)) { visited.add(curr.attachedTo); queue.push(curr.attachedTo); }
                components.forEach(c => { if (c.attachedTo === currId && !visited.has(c.id)) { visited.add(c.id); queue.push(c.id); } });
            }
        }
        setSelectedGroup(visited.size > 1 ? visited : new Set<string>());
    };

    const handleDrag = (id: string, rect: { x: number; y: number; width: number; height: number }) => {
        const group = selectedGroup();
        const initial = initialGroupRects();

        // Group drag
        if (group.has(id) && group.size > 1 && initial[id]) {
            const initMain = initial[id];
            const dx = rect.x - initMain.x, dy = rect.y - initMain.y;
            if (dx === 0 && dy === 0) return;
            setGroupTransform({ leaderId: id, sx: 1, sy: 1, lx: rect.x, ly: rect.y, leaderInitial: initMain });
            setComponents(produce((state: FrameData[]) => {
                state.forEach(c => { if (group.has(c.id) && initial[c.id]) { const i = initial[c.id]; c.x = i.x + dx; c.y = i.y + dy; } });
            }));
            return;
        }

        // Single frame drag
        if (group.size > 0 && !group.has(id)) setSelectedGroup(new Set<string>());
        setGroupTransform(null);

        setComponents(produce((state: FrameData[]) => {
            const t = state.find(c => c.id === id);
            if (t) { t.x = rect.x; t.y = rect.y; }
        }));
    };

    const handleDragEnd = (id: string, x: number, y: number) => {
        setComponents(produce((state: FrameData[]) => {
            const t = state.find(c => c.id === id);
            if (t) { t.x = x; t.y = y; }
        }));
    };

    const handleResize = (id: string, rect: { x: number; y: number; width: number; height: number }) => {
        const group = selectedGroup();
        const initial = initialGroupRects();
        if (group.has(id) && group.size > 1 && initial[id]) {
            const initMain = initial[id];
            const sx = rect.width / (initMain.w || 1), sy = rect.height / (initMain.h || 1);
            setGroupTransform({ leaderId: id, sx, sy, lx: rect.x, ly: rect.y, leaderInitial: initMain });
            setComponents(produce((state: FrameData[]) => {
                state.forEach(c => {
                    if (group.has(c.id) && initial[c.id]) {
                        const i = initial[c.id];
                        c.x = rect.x + (i.x - initMain.x) * sx;
                        c.y = rect.y + (i.y - initMain.y) * sy;
                        c.width = i.w * sx; c.height = i.h * sy;
                    }
                });
            }));
        } else {
            setGroupTransform(null);
            setComponents(produce((state: FrameData[]) => {
                const c = state.find(c => c.id === id);
                if (c) { c.x = rect.x; c.y = rect.y; c.width = rect.width; c.height = rect.height; }
            }));
        }
    };

    const handlePin = (id: string, pinned: boolean) => {
        setComponents(produce((state: FrameData[]) => {
            const c = state.find(c => c.id === id);
            if (!c) return;
            c.isPinned = pinned;
        }));
    };

    return { snapPreview, selectedGroup, setSelectedGroup, groupTransform, setGroupTransform, initialGroupRects, setInitialGroupRects, captureGroupRects, handleDrag, handleDragEnd, handleResize, handlePin, handleDoubleClick };
}
