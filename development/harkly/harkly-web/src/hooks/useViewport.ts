import { createSignal } from "solid-js";
import type { Viewport } from "~/lib/canvas/types";

export function useViewport() {
    const [viewport, setViewport] = createSignal<Viewport>({
        x: 0,
        y: 0,
        zoom: 1,
    });
    const [isPanning, setIsPanning] = createSignal(false);
    const [panStart, setPanStart] = createSignal({ x: 0, y: 0 });

    // --- Touch state ---
    let lastTouchDistance: number | null = null;
    let lastTouchCenter: { x: number; y: number } | null = null;
    let activeTouches: Touch[] = [];

    const handleBackgroundMouseDown = (
        e: MouseEvent,
        isOnBackground: boolean
    ) => {
        // Middle mouse button always pans
        if (e.button === 1) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({
                x: e.clientX - viewport().x,
                y: e.clientY - viewport().y,
            });
            return;
        }
        // Left click on background pans
        if (isOnBackground) {
            setIsPanning(true);
            setPanStart({
                x: e.clientX - viewport().x,
                y: e.clientY - viewport().y,
            });
        }
    };

    const handleBackgroundMouseMove = (e: MouseEvent) => {
        if (isPanning()) {
            setViewport({
                ...viewport(),
                x: e.clientX - panStart().x,
                y: e.clientY - panStart().y,
            });
        }
    };

    const handleBackgroundMouseUp = () => setIsPanning(false);

    const handleWheel = (e: WheelEvent) => {
        // Ctrl+Alt or Ctrl+Shift = floor/branch scroll (handled externally)
        if (e.ctrlKey && (e.altKey || e.shiftKey)) return;

        if (e.ctrlKey) {
            // Ctrl+Scroll = zoom
            e.preventDefault();
            const oldZoom = viewport().zoom;
            const nextZoom =
                e.deltaY > 0
                    ? Math.max(0.1, oldZoom - 0.1)
                    : Math.min(3, oldZoom + 0.1);
            const worldMouseX = (e.clientX - viewport().x) / oldZoom;
            const worldMouseY = (e.clientY - viewport().y) / oldZoom;
            setViewport({
                x: e.clientX - worldMouseX * nextZoom,
                y: e.clientY - worldMouseY * nextZoom,
                zoom: nextZoom,
            });
            return;
        }

        if (e.shiftKey) {
            // Check if inside scrollable frame
            let shiftEl = e.target as HTMLElement | null;
            while (shiftEl) {
                if (shiftEl.scrollWidth > shiftEl.clientWidth + 1) return;
                if (shiftEl.classList?.contains("group/window")) break;
                shiftEl = shiftEl.parentElement;
            }
            // Shift+Scroll = horizontal pan
            e.preventDefault();
            setViewport({ ...viewport(), x: viewport().x - e.deltaY });
            return;
        }

        // Check if target is inside a scrollable frame -- let it scroll naturally
        let el = e.target as HTMLElement | null;
        while (el) {
            if (
                el.scrollHeight > el.clientHeight + 1 ||
                el.scrollWidth > el.clientWidth + 1
            ) {
                return; // let the frame content scroll
            }
            if (el.classList?.contains("group/window")) break; // stop at frame boundary
            el = el.parentElement;
        }

        // Plain scroll = vertical pan
        e.preventDefault();
        setViewport({ ...viewport(), y: viewport().y - e.deltaY });
    };

    // --- Touch handlers ---

    const handleTouchStart = (e: TouchEvent) => {
        activeTouches = Array.from(e.touches);

        if (activeTouches.length === 1) {
            // Single finger pan
            const touch = activeTouches[0];
            setIsPanning(true);
            setPanStart({
                x: touch.clientX - viewport().x,
                y: touch.clientY - viewport().y,
            });
        } else if (activeTouches.length === 2) {
            // Two-finger pinch zoom
            const [t1, t2] = activeTouches;
            lastTouchDistance = Math.hypot(
                t2.clientX - t1.clientX,
                t2.clientY - t1.clientY
            );
            lastTouchCenter = {
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2,
            };
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        activeTouches = Array.from(e.touches);

        if (activeTouches.length === 1 && isPanning()) {
            const touch = activeTouches[0];
            setViewport({
                ...viewport(),
                x: touch.clientX - panStart().x,
                y: touch.clientY - panStart().y,
            });
        } else if (
            activeTouches.length === 2 &&
            lastTouchDistance !== null &&
            lastTouchCenter !== null
        ) {
            const [t1, t2] = activeTouches;
            const newDistance = Math.hypot(
                t2.clientX - t1.clientX,
                t2.clientY - t1.clientY
            );
            const newCenter = {
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2,
            };

            const scaleFactor = newDistance / lastTouchDistance;
            const oldZoom = viewport().zoom;
            const nextZoom = Math.max(0.1, Math.min(3, oldZoom * scaleFactor));

            // Zoom towards pinch center
            const worldCenterX =
                (lastTouchCenter.x - viewport().x) / oldZoom;
            const worldCenterY =
                (lastTouchCenter.y - viewport().y) / oldZoom;

            // Pan by center movement
            const dx = newCenter.x - lastTouchCenter.x;
            const dy = newCenter.y - lastTouchCenter.y;

            setViewport({
                x: newCenter.x - worldCenterX * nextZoom + dx,
                y: newCenter.y - worldCenterY * nextZoom + dy,
                zoom: nextZoom,
            });

            lastTouchDistance = newDistance;
            lastTouchCenter = newCenter;
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        activeTouches = Array.from(e.touches);
        if (activeTouches.length < 2) {
            lastTouchDistance = null;
            lastTouchCenter = null;
        }
        if (activeTouches.length === 0) {
            setIsPanning(false);
        }
    };

    const resetViewport = () => setViewport({ x: 0, y: 0, zoom: 1 });

    return {
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
    };
}
