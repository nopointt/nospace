import type { Component } from 'solid-js';
import type { FrameData } from './types/frame';
import { onMount, onCleanup, For, createSignal } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';
import Omnibar from './components/Omnibar';
import Space from './components/Space';
import DynamicComponent from './components/DynamicComponent';
import TrafficLights from './components/TrafficLights';
import { kernel } from './kernel';
import { useViewport } from './hooks/useViewport';
import { useComponents } from './hooks/useComponents';
import { useSnap } from './hooks/useSnap';
import { registerDefaultCommands } from './commands/defaultCommands';
import { FRAME_LAYOUTS, resolveLayout, loadExternalLayouts } from './commands/frameLayouts';
import { useIntentPipeline } from './hooks/useIntentPipeline';
import { useFloor } from './hooks/useFloor';
import FloorPill from './components/FloorPill';
import BranchPill from './components/BranchPill';
import CoordPill from './components/CoordPill';

const App: Component = () => {
    const { viewport, isPanning, handleBackgroundMouseDown: vpMouseDown, handleBackgroundMouseMove, handleBackgroundMouseUp: vpMouseUp, handleWheel, resetViewport } = useViewport();
    const { components, setComponents, replaceComponents, activeId, setActiveId, thought, error, setError, subscribeToKernel, removeComponent, saveCanvas } = useComponents(viewport);
    const { snapPreview, selectedGroup, setSelectedGroup, groupTransform, setGroupTransform, initialGroupRects, setInitialGroupRects, captureGroupRects, handleDrag, handleDragEnd, handleResize, handlePin, handleDoubleClick } = useSnap(components, setComponents, viewport);

    // --- Command Registry + Intent Pipeline ---
    registerDefaultCommands();
    loadExternalLayouts();

    const intentPipeline = useIntentPipeline(
        { replaceComponents, resetViewport },
        (_raw) => {
            // Kernel-routed intents are handled by Omnibar's handleSend
            // which sends the WebSocket message. Nothing extra needed here.
        },
    );

    const { currentFloor, setCurrentFloor, currentBranch, branches, floorName, floorUp, floorDown, goToFloor, createBranch, switchBranch } = useFloor();
    const [isMaximized, setIsMaximized] = createSignal(false);

    const handleBackgroundMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isOnBackground = target.id === "desktop-root" || target.id === "space-canvas" || target.tagName === "CANVAS";
        if (isOnBackground) { setSelectedGroup(new Set<string>()); setActiveId(null); setGroupTransform(null); }
        vpMouseDown(e, isOnBackground);
    };

    const handleBackgroundMouseUp = () => { vpMouseUp(); setGroupTransform(null); };

    onMount(() => {
        kernel.connect();
        getCurrentWindow().maximize().then(() => setIsMaximized(true));

        // Load harkly demo layout if canvas is empty or has no floor data
        const hasFloors = components.some(c => c.floor != null);
        if (components.length === 0 || !hasFloors) {
            const harklyLayout = FRAME_LAYOUTS["harkly"];
            if (harklyLayout) {
                setComponents(resolveLayout(harklyLayout));
            }
        }

        let unlistenResize: (() => void) | undefined;
        getCurrentWindow().onResized(() => {
            getCurrentWindow().isMaximized().then(v => setIsMaximized(v));
        }).then(fn => { unlistenResize = fn; });

        const unsubKernel = subscribeToKernel();
        window.addEventListener("mousemove", handleBackgroundMouseMove);
        window.addEventListener("mouseup", handleBackgroundMouseUp);
        window.addEventListener("wheel", handleWheel, { passive: false });

        const handleGlobalKey = (e: KeyboardEvent) => {
            if (e.key === "C" && e.ctrlKey && e.shiftKey) {
                resetViewport();
            }
        };

        const handleFloorScroll = (e: WheelEvent) => {
            if (e.ctrlKey && e.altKey) {
                e.preventDefault();
                if (e.deltaY < 0) { floorUp(); resetViewport(); }
                else if (e.deltaY > 0) { floorDown(); resetViewport(); }
            } else if (e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                const list = branches();
                const idx = list.indexOf(currentBranch());
                if (e.deltaY < 0 && idx > 0) { switchBranch(list[idx - 1]); resetViewport(); }
                else if (e.deltaY > 0 && idx < list.length - 1) { switchBranch(list[idx + 1]); resetViewport(); }
            }
        };
        window.addEventListener("wheel", handleFloorScroll, { passive: false });
        document.addEventListener("keydown", handleGlobalKey);

        const handleSpawnFrame = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!detail?.type) return;

            const newFrame: FrameData = {
                id: `${detail.type}-${Date.now()}`,
                type: detail.type as FrameData['type'],
                title: detail.title || detail.type,
                x: detail.x ?? window.innerWidth / 2 - 200,
                y: detail.y ?? 100,
                width: detail.width ?? 544,
                height: detail.height ?? 480,
                content: detail.content,
                floor: detail.floor ?? currentFloor(),
                branch: detail.branch ?? currentBranch(),
            };

            setComponents(prev => [...prev, newFrame]);
        };
        window.addEventListener('harkly:spawn-frame', handleSpawnFrame);

        onCleanup(() => {
            unlistenResize?.();
            unsubKernel();
            window.removeEventListener("mousemove", handleBackgroundMouseMove);
            window.removeEventListener("mouseup", handleBackgroundMouseUp);
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("wheel", handleFloorScroll);
            document.removeEventListener("keydown", handleGlobalKey);
            window.removeEventListener('harkly:spawn-frame', handleSpawnFrame);
        });
    });

    return (
        <div
            id="desktop-root"
            onMouseDown={handleBackgroundMouseDown}
            class={`w-full h-full relative overflow-hidden text-h-text-1 select-none ${isPanning() ? 'cursor-grabbing' : 'cursor-default'} ${isMaximized() ? '' : 'ring-1 ring-h-border-s'}`}
        >
            <Space viewport={viewport()} />

            {/* Camera Layer — world-space frames */}
            <div
                class="absolute inset-0 pointer-events-none"
                style={{
                    transform: `translate(${viewport().x}px, ${viewport().y}px) scale(${viewport().zoom})`,
                    "transform-origin": "0 0"
                }}
            >
                <div class="relative w-full h-full">
                    {snapPreview() && (
                        <div
                            class="absolute bg-cyan-500/10 border-2 border-dashed border-cyan-500/30 rounded-lg transition-all duration-200 pointer-events-none"
                            style={{ left: `${snapPreview()?.x}px`, top: `${snapPreview()?.y}px`, width: `${snapPreview()?.w}px`, height: `${snapPreview()?.h}px`, "z-index": 5 }}
                        />
                    )}

                    <For each={components.filter(c => !c.isPinned && (c.floor == null || c.floor === currentFloor()) && ((c.branch ?? 'Branch 1') === currentBranch()))}>
                        {(comp) => (
                            <DynamicComponent
                                data={comp}
                                viewport={viewport()}
                                isActive={comp.id === activeId() || selectedGroup().has(comp.id)}
                                groupTransform={groupTransform()}
                                initialRect={initialGroupRects()[comp.id]}
                                onActivate={(e: MouseEvent) => {
                                    if (e.shiftKey) {
                                        setSelectedGroup(prev => { const next = new Set(prev); next.has(comp.id) ? next.delete(comp.id) : next.add(comp.id); return next; });
                                    } else {
                                        if (!selectedGroup().has(comp.id)) setSelectedGroup(new Set<string>());
                                        setActiveId(comp.id);
                                        if (selectedGroup().has(comp.id)) captureGroupRects(comp.id);
                                    }
                                }}
                                onClose={(id) => removeComponent(id)}
                                onDrag={(id, rect) => {
                                    if (Object.keys(initialGroupRects()).length === 0) captureGroupRects(id);
                                    handleDrag(id, rect);
                                }}
                                onInteractionUpdate={handleDrag}
                                onDragEnd={(id, x, y) => { handleDragEnd(id, x, y); setInitialGroupRects({}); setGroupTransform(null); saveCanvas(); }}
                                onResizeStart={(id) => { if (Object.keys(initialGroupRects()).length === 0) captureGroupRects(id); }}
                                onResize={(id, rect) => {
                                    if (Object.keys(initialGroupRects()).length === 0) captureGroupRects(id);
                                    handleResize(id, rect);
                                }}
                                onPin={handlePin}
                                onDoubleClick={handleDoubleClick}
                            />
                        )}
                    </For>
                </div>
            </div>

            {/* Pinned Layer — screen-space frames */}
            <div class="absolute inset-0 pointer-events-none z-[800]">
                <div class="relative w-full h-full">
                    <For each={components.filter(c => c.isPinned)}>
                        {(comp) => (
                            <DynamicComponent
                                data={comp}
                                viewport={{ x: 0, y: 0, zoom: 1 }}
                                isActive={comp.id === activeId()}
                                onActivate={() => setActiveId(comp.id)}
                                onClose={(id) => removeComponent(id)}
                                onDrag={handleDrag}
                                onDragEnd={handleDragEnd}
                                onPin={handlePin}
                            />
                        )}
                    </For>
                </div>
            </div>

            {/* Top Bar */}
            <div class="fixed top-4 left-4 right-4 flex items-center justify-between z-50">
                <TrafficLights
                    variant="window"
                    onClose={() => getCurrentWindow().close()}
                    onMinimize={() => getCurrentWindow().minimize()}
                    onMaximize={() => getCurrentWindow().toggleMaximize()}
                />
                <div class="flex items-center gap-2 pointer-events-auto">
                    <FloorPill floorName={floorName} currentFloor={currentFloor} onSelectFloor={(id) => { goToFloor(id); resetViewport(); }} />
                    <BranchPill branchName={currentBranch} branches={branches} onSelectBranch={(name) => { switchBranch(name); resetViewport(); }} onCreateBranch={() => { createBranch(); resetViewport(); }} />
                    <CoordPill x={() => Math.round(-viewport().x)} y={() => Math.round(-viewport().y)} />
                </div>
            </div>

            <Omnibar intentPipeline={intentPipeline} />

            {thought() && (
                <div class="fixed bottom-36 left-1/2 transform -translate-x-1/2 w-[600px] z-[900] pointer-events-none flex justify-start pl-[52px]">
                    <span class="text-[13px] font-mono text-h-text-3 opacity-60 italic selection:bg-none">{thought()}</span>
                </div>
            )}

            {error() && (
                <div class="fixed bottom-36 left-1/2 transform -translate-x-1/2 w-[580px] z-[900] transition-all duration-300">
                    <div class="bg-red-50 border border-red-300 rounded-xl p-4 shadow-xl text-red-900">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <div class="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span class="text-[10px] font-mono text-red-700 uppercase tracking-widest font-bold">Kernel Exception</span>
                            </div>
                            <button onClick={() => setError(null)} class="text-red-400 hover:text-red-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <p class="text-xs font-mono text-red-900 leading-relaxed bg-red-100 p-2 rounded border border-red-200">{error()}</p>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;
