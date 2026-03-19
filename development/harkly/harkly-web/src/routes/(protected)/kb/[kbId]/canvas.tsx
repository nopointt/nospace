import { Component, For, onMount, onCleanup } from "solid-js";
import { useParams } from "@solidjs/router";
import Space from "~/components/canvas/Space";
import FrameContainer from "~/components/canvas/FrameContainer";
import Omnibar from "~/components/canvas/Omnibar/Omnibar";
import { useViewport } from "~/hooks/useViewport";
import { useComponents } from "~/hooks/useComponents";
import { useSnap } from "~/hooks/useSnap";
import { useFloor, FLOORS } from "~/hooks/useFloor";
import type { FrameData } from "~/lib/canvas/types";

const CanvasPage: Component = () => {
    const params = useParams<{ kbId: string }>();

    const {
        viewport,
        isPanning,
        handleBackgroundMouseDown,
        handleBackgroundMouseMove,
        handleBackgroundMouseUp,
        handleWheel,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        resetViewport,
    } = useViewport();

    const {
        components,
        setComponents,
        replaceComponents,
        activeId,
        setActiveId,
        addFrame,
        removeComponent,
        saveCanvas,
    } = useComponents(viewport, params.kbId);

    const {
        groupTransform,
        initialGroupRects,
        captureGroupRects,
        handleDrag,
        handleDragEnd,
        handleResize,
        handlePin,
        handleDoubleClick,
    } = useSnap(components, setComponents, viewport);

    const {
        currentFloor,
        floorName,
        floorNameEn,
        floorUp,
        floorDown,
        currentBranch,
    } = useFloor();

    // Listen for spawn-frame custom events (e.g., from FramingStudio)
    onMount(() => {
        const onSpawnFrame = (e: Event) => {
            const detail = (e as CustomEvent).detail as Partial<FrameData> & {
                type: FrameData["type"];
            };
            addFrame(detail);
        };
        window.addEventListener("harkly:spawn-frame", onSpawnFrame);

        // Keyboard shortcuts
        const onKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Alt+ArrowUp/Down = floor navigation
            if (e.ctrlKey && e.altKey && e.key === "ArrowUp") {
                e.preventDefault();
                floorUp();
            }
            if (e.ctrlKey && e.altKey && e.key === "ArrowDown") {
                e.preventDefault();
                floorDown();
            }
            // Ctrl+S = save canvas
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                saveCanvas();
            }
            // Ctrl+0 = reset viewport
            if (e.ctrlKey && e.key === "0") {
                e.preventDefault();
                resetViewport();
            }
        };
        window.addEventListener("keydown", onKeyDown);

        onCleanup(() => {
            window.removeEventListener("harkly:spawn-frame", onSpawnFrame);
            window.removeEventListener("keydown", onKeyDown);
        });
    });

    // Filter components by current floor
    const visibleComponents = () =>
        components.filter(
            (c) => c.floor === undefined || c.floor === currentFloor()
        );

    return (
        <div
            class="relative w-full h-screen overflow-hidden select-none"
            classList={{ "cursor-grabbing": isPanning() }}
            onMouseDown={(e) => {
                const isBackground =
                    e.target === e.currentTarget ||
                    (e.target as HTMLElement).tagName === "CANVAS";
                handleBackgroundMouseDown(e, isBackground);
            }}
            onMouseMove={handleBackgroundMouseMove}
            onMouseUp={handleBackgroundMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Grid background */}
            <Space viewport={viewport()} />

            {/* Frames layer -- world-space transform */}
            <div
                class="absolute top-0 left-0 w-0 h-0 pointer-events-none"
                style={{
                    transform: `translate(${viewport().x}px, ${viewport().y}px) scale(${viewport().zoom})`,
                    "transform-origin": "0 0",
                }}
            >
                <For each={visibleComponents()}>
                    {(comp) => (
                        <FrameContainer
                            data={comp}
                            viewport={viewport()}
                            isActive={activeId() === comp.id}
                            onActivate={() => {
                                setActiveId(comp.id);
                                captureGroupRects(comp.id);
                            }}
                            onClose={removeComponent}
                            onDrag={handleDrag}
                            onDragEnd={handleDragEnd}
                            onResizeStart={captureGroupRects}
                            onResize={handleResize}
                            onPin={handlePin}
                            onDoubleClick={handleDoubleClick}
                            onInteractionUpdate={handleDrag}
                            groupTransform={groupTransform()}
                            initialRect={initialGroupRects()[comp.id] ?? null}
                        />
                    )}
                </For>
            </div>

            {/* Floor indicator (bottom-left) */}
            <div class="fixed bottom-4 left-4 z-50 flex items-center gap-3 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-h-border-s shadow-sm">
                <button
                    onClick={floorDown}
                    class="text-h-text-3 hover:text-h-text-1 transition-colors text-sm font-mono"
                    disabled={currentFloor() === 0}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <div class="flex flex-col items-center min-w-[80px]">
                    <span class="text-[10px] font-semibold text-h-text-3 uppercase tracking-wider">
                        {floorNameEn()}
                    </span>
                    <span class="text-[11px] text-h-text-2">
                        {floorName()}
                    </span>
                </div>
                <button
                    onClick={floorUp}
                    class="text-h-text-3 hover:text-h-text-1 transition-colors text-sm font-mono"
                    disabled={currentFloor() === FLOORS.length - 1}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>

            {/* Branch + KB indicator (bottom-right) */}
            <div class="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-h-border-s shadow-sm">
                <span class="text-[10px] text-h-text-3 font-mono">
                    {currentBranch()}
                </span>
                <span class="text-[10px] text-h-text-3 font-mono opacity-50">
                    |
                </span>
                <span class="text-[10px] text-h-text-3 font-mono">
                    kb:{params.kbId?.slice(0, 8)}
                </span>
            </div>

            {/* Zoom indicator (bottom-center) */}
            <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-h-border-s shadow-sm">
                <span class="text-[10px] text-h-text-3 font-mono tabular-nums">
                    {Math.round(viewport().zoom * 100)}%
                </span>
            </div>

            {/* Omnibar (Ctrl+K toggle) */}
            <Omnibar
                replaceComponents={replaceComponents}
                resetViewport={resetViewport}
            />

            {/* Back to KB button (top-left) */}
            <a
                href={`/kb/${params.kbId}`}
                class="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-h-border-s shadow-sm text-sm text-h-text-2 hover:text-h-text-1 transition-colors"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Назад
            </a>
        </div>
    );
};

export default CanvasPage;
