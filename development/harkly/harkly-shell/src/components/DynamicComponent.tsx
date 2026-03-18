import { Component, createSignal, onCleanup, createEffect, onMount, createMemo, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import ErrorBoundary from "./ErrorBoundary";
import { FRAME_REGISTRY } from "./frameRegistry";
import TrafficLights from "./TrafficLights";
import type { FrameData, GroupTransform, GroupRect } from "../types/frame";
import {
    WINDOW_DEFAULT_X,
    WINDOW_DEFAULT_Y,
    WINDOW_DEFAULT_WIDTH,
    WINDOW_DEFAULT_HEIGHT,
    WINDOW_MIN_SIZE,
} from "../constants";

// --- Fix #10: Module-level shared window event delegation ---
// Instead of each DynamicComponent instance adding its own window mousemove/mouseup
// listener, we maintain a single pair of listeners and fan out to registered handlers.
// This means N mounted frames cost O(1) window listeners, not O(N).

type MoveHandler = (e: MouseEvent) => void;
type UpHandler = () => void;

const _moveHandlers = new Set<MoveHandler>();
const _upHandlers = new Set<UpHandler>();

function _sharedMouseMove(e: MouseEvent) {
    _moveHandlers.forEach(h => h(e));
}

function _sharedMouseUp() {
    _upHandlers.forEach(h => h());
}

function registerHandlers(onMove: MoveHandler, onUp: UpHandler) {
    const wasEmpty = _moveHandlers.size === 0;
    _moveHandlers.add(onMove);
    _upHandlers.add(onUp);
    if (wasEmpty) {
        window.addEventListener("mousemove", _sharedMouseMove);
        window.addEventListener("mouseup", _sharedMouseUp);
    }
}

function unregisterHandlers(onMove: MoveHandler, onUp: UpHandler) {
    _moveHandlers.delete(onMove);
    _upHandlers.delete(onUp);
    if (_moveHandlers.size === 0) {
        window.removeEventListener("mousemove", _sharedMouseMove);
        window.removeEventListener("mouseup", _sharedMouseUp);
    }
}

// Backwards compat alias
export type ComponentData = FrameData;

interface DynamicComponentProps {
    data: ComponentData;
    viewport: { x: number, y: number, zoom: number };
    isActive?: boolean;
    onActivate?: (e: MouseEvent) => void;
    onClose?: (id: string) => void;
    onDrag?: (id: string, rect: { x: number, y: number, width: number, height: number }) => void;
    onDragEnd?: (id: string, x: number, y: number) => void;
    onResizeStart?: (id: string) => void;
    onResize?: (id: string, rect: { x: number, y: number, width: number, height: number }) => void;
    onPin?: (id: string, pinned: boolean) => void;
    onInteractionUpdate?: (id: string, rect: { x: number, y: number, width: number, height: number }) => void;
    onDoubleClick?: (id: string) => void;
    groupTransform?: GroupTransform | {
        leaderId: string,
        sx: number, sy: number,
        lx: number, ly: number,
        leaderInitial: { x: number, y: number, w: number, h: number }
    } | null;
    initialRect?: { x: number, y: number, w: number, h: number };
}

const DynamicComponent: Component<DynamicComponentProps> = (props) => {
    const [pos, setPos] = createSignal({ x: props.data.x || WINDOW_DEFAULT_X, y: props.data.y || WINDOW_DEFAULT_Y });
    const [size, setSize] = createSignal({ width: props.data.width || WINDOW_DEFAULT_WIDTH, height: props.data.height || WINDOW_DEFAULT_HEIGHT });

    // Smooth Group Sync
    const visualPos = createMemo(() => {
        const gt = props.groupTransform;
        const ir = props.initialRect;
        if (gt && ir && gt.leaderId !== props.data.id && gt.leaderInitial) {
            // MyPos = LeaderCurrentPos + (MyInitialPos - LeaderInitialPos) * Scale
            const dx = (ir.x - gt.leaderInitial.x) * gt.sx;
            const dy = (ir.y - gt.leaderInitial.y) * gt.sy;
            return { x: gt.lx + dx, y: gt.ly + dy };
        }
        return pos();
    });

    const visualSize = createMemo(() => {
        const gt = props.groupTransform;
        const ir = props.initialRect;
        if (gt && ir && gt.leaderId !== props.data.id && gt.leaderInitial) {
            return { width: ir.w * gt.sx, height: ir.h * gt.sy };
        }
        return size();
    });

    const [isDragging, setIsDragging] = createSignal(false);
    const [isResizing, setIsResizing] = createSignal<string | null>(null); // 'n', 's', 'e', 'w', 'se', etc.
    const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });
    const [isMinimized, setIsMinimized] = createSignal(false);
    const [zIndex, setZIndex] = createSignal(10);

    createEffect(() => {
        if (props.isActive) {
            setZIndex(100);
        } else {
            setZIndex(10);
        }
    });

    // Support property-to-signal synchronization for remote moves/pins
    createEffect(() => {
        if (!isDragging() && !isResizing()) {
            setPos({ x: props.data.x || WINDOW_DEFAULT_X, y: props.data.y || WINDOW_DEFAULT_Y });
            setSize({ width: props.data.width || WINDOW_DEFAULT_WIDTH, height: props.data.height || WINDOW_DEFAULT_HEIGHT });
        }
    });

    const handleMouseDown = (e: MouseEvent) => {
        if (isMinimized()) return;
        e.stopPropagation();

        props.onActivate?.(e);

        setIsDragging(true);
        // Calculate offset in World Coordinates
        const worldX = (e.clientX - props.viewport.x) / props.viewport.zoom;
        const worldY = (e.clientY - props.viewport.y) / props.viewport.zoom;
        setDragOffset({
            x: worldX - pos().x,
            y: worldY - pos().y
        });
    };

    const handleResizeStart = (e: MouseEvent, dir: string) => {
        e.stopPropagation();
        props.onActivate?.(e);
        setIsResizing(dir);
        props.onResizeStart?.(props.data.id);
    };

    // Fix #11: Throttle mousemove with requestAnimationFrame.
    // clientX/clientY are captured synchronously from the event before scheduling
    // so the values are always fresh even if multiple events arrive before the frame.
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
        if (rafId !== null) return; // already scheduled for this frame
        const clientX = e.clientX;
        const clientY = e.clientY;
        rafId = requestAnimationFrame(() => {
            rafId = null;
            const worldX = (clientX - props.viewport.x) / props.viewport.zoom;
            const worldY = (clientY - props.viewport.y) / props.viewport.zoom;

            if (isDragging()) {
                const newPos = {
                    x: worldX - dragOffset().x,
                    y: worldY - dragOffset().y
                };
                setPos(newPos);
                // Optimization: Only notify parent for side-effects (e.g. snapping ghost), NOT for committing state
                props.onInteractionUpdate?.(props.data.id, { ...newPos, ...size() });
            } else if (isResizing()) {
                const dir = isResizing();
                if (dir?.includes('e')) {
                    setSize(prev => ({ ...prev, width: Math.max(WINDOW_MIN_SIZE, worldX - pos().x) }));
                }
                if (dir?.includes('s')) {
                    setSize(prev => ({ ...prev, height: Math.max(WINDOW_MIN_SIZE, worldY - pos().y) }));
                }
                if (dir?.includes('w')) {
                    const deltaX = worldX - pos().x;
                    const newWidth = Math.max(WINDOW_MIN_SIZE, size().width - deltaX);
                    if (newWidth > WINDOW_MIN_SIZE) {
                        setPos(prev => ({ ...prev, x: worldX }));
                        setSize(prev => ({ ...prev, width: newWidth }));
                    }
                }
                if (dir?.includes('n')) {
                    const deltaY = worldY - pos().y;
                    const newHeight = Math.max(WINDOW_MIN_SIZE, size().height - deltaY);
                    if (newHeight > WINDOW_MIN_SIZE) {
                        setPos(prev => ({ ...prev, y: worldY }));
                        setSize(prev => ({ ...prev, height: newHeight }));
                    }
                }
                // Trigger resize updates to parent (Optimized: use interaction update for preview)
                props.onResize?.(props.data.id, { ...pos(), ...size() });
                props.onInteractionUpdate?.(props.data.id, { ...pos(), ...size() });
            }
        });
    };

    const handleMouseUp = () => {
        if (isDragging()) {
            props.onDragEnd?.(props.data.id, pos().x, pos().y);
        }
        if (isResizing()) {
            props.onResize?.(props.data.id, { ...pos(), ...size() });
        }
        setIsDragging(false);
        setIsResizing(null);
    };

    onMount(() => {
        // Fix #10: use shared delegation — registers into the module-level set
        registerHandlers(handleMouseMove, handleMouseUp);
    });

    onCleanup(() => {
        // Fix #10: deregister from the shared set; cancels window listeners when last instance unmounts
        unregisterHandlers(handleMouseMove, handleMouseUp);
        // Fix #11: cancel any pending RAF on unmount to avoid stale state updates
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    });

    const frameType = () => props.data.type;

    return (
        <div
            class="absolute group/window pointer-events-auto"
            classList={{
                'ring-2 ring-h-blue shadow-lg': props.isActive,
                'shadow-md': !props.isActive,
                'h-auto!': isMinimized()
            }}
            style={{
                transform: `translate(${visualPos().x}px, ${visualPos().y}px)`,
                width: `${visualSize().width}px`,
                height: isMinimized() ? '32px' : `${visualSize().height}px`,
                "z-index": zIndex()
            }}
            onMouseDown={(e) => props.onActivate?.(e)}
            onDblClick={(e) => { e.stopPropagation(); props.onDoubleClick?.(props.data.id); }}
        >
            {/* Resize Handles */}
            {!isMinimized() && (
                <>
                    <div class="absolute -top-1 -left-1 w-3 h-3 cursor-nw-resize z-50" onMouseDown={(e) => handleResizeStart(e, 'nw')}></div>
                    <div class="absolute -top-1 -right-1 w-3 h-3 cursor-ne-resize z-50" onMouseDown={(e) => handleResizeStart(e, 'ne')}></div>
                    <div class="absolute -bottom-1 -left-1 w-3 h-3 cursor-sw-resize z-50" onMouseDown={(e) => handleResizeStart(e, 'sw')}></div>
                    <div class="absolute -bottom-1 -right-1 w-3 h-3 cursor-se-resize z-50" onMouseDown={(e) => handleResizeStart(e, 'se')}></div>
                    <div class="absolute top-0 left-0 right-0 h-1 cursor-n-resize z-40" onMouseDown={(e) => handleResizeStart(e, 'n')}></div>
                    <div class="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize z-40" onMouseDown={(e) => handleResizeStart(e, 's')}></div>
                    <div class="absolute top-0 bottom-0 left-0 w-1 cursor-w-resize z-40" onMouseDown={(e) => handleResizeStart(e, 'w')}></div>
                    <div class="absolute top-0 bottom-0 right-0 w-1 cursor-e-resize z-40" onMouseDown={(e) => handleResizeStart(e, 'e')}></div>
                </>
            )}

            <div class="flex flex-col h-full bg-h-surface border border-h-border-s rounded-lg overflow-hidden shadow-md animate-h-enter">
                {/* Unified Header */}
                <div
                    class="h-8 bg-h-elevated border-b border-h-border-s flex items-center px-3 justify-between cursor-move select-none"
                    onMouseDown={handleMouseDown}
                >
                    <div class="flex items-center justify-between w-full overflow-hidden">
                        <span class="text-[10px] font-sans font-semibold text-h-text-3 truncate uppercase tracking-[0.15em]">
                            {props.data.title || props.data.type}
                        </span>
                        <div class="flex items-center gap-2 shrink-0 ml-2">
                            <button onClick={() => setIsMinimized(!isMinimized())} class="text-h-text-3 hover:text-h-text-2 transition-colors" title="Свернуть">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                            </button>
                            <button onClick={() => props.onPin?.(props.data.id, !props.data.isPinned)} class="text-h-text-3 hover:text-h-text-2 transition-colors" title="Закрепить">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
                            </button>
                            <button onClick={() => props.onClose?.(props.data.id)} class="text-h-text-3 hover:text-h-red transition-colors" title="Закрыть">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {!isMinimized() && (
                    <div class="flex-1 overflow-hidden relative">
                        <Show
                            when={frameType() in FRAME_REGISTRY}
                            fallback={<div class="p-4 text-h-text-3 text-sm font-mono">Unknown frame type: {props.data.type}</div>}
                        >
                            <ErrorBoundary>
                                <Dynamic component={FRAME_REGISTRY[frameType()]} data={props.data} />
                            </ErrorBoundary>
                        </Show>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DynamicComponent;
