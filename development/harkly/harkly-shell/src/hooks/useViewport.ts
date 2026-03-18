import { createSignal } from "solid-js";
import type { Viewport } from "../types/frame";

export function useViewport() {
    const [viewport, setViewport] = createSignal<Viewport>({ x: 0, y: 0, zoom: 1 });
    const [isPanning, setIsPanning] = createSignal(false);
    const [panStart, setPanStart] = createSignal({ x: 0, y: 0 });

    const handleBackgroundMouseDown = (e: MouseEvent, isOnBackground: boolean) => {
        if (e.button === 1) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - viewport().x, y: e.clientY - viewport().y });
            return;
        }
        if (isOnBackground) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - viewport().x, y: e.clientY - viewport().y });
        }
    };

    const handleBackgroundMouseMove = (e: MouseEvent) => {
        if (isPanning()) {
            setViewport({ ...viewport(), x: e.clientX - panStart().x, y: e.clientY - panStart().y });
        }
    };

    const handleBackgroundMouseUp = () => setIsPanning(false);

    const handleWheel = (e: WheelEvent) => {
        // Ctrl+Alt or Ctrl+Shift = floor/branch scroll (handled in App.tsx)
        if (e.ctrlKey && (e.altKey || e.shiftKey)) return;

        if (e.ctrlKey) {
            // Ctrl+Scroll = zoom
            e.preventDefault();
            const oldZoom = viewport().zoom;
            const nextZoom = e.deltaY > 0 ? Math.max(0.1, oldZoom - 0.1) : Math.min(3, oldZoom + 0.1);
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
                if (shiftEl.classList?.contains('group/window')) break;
                shiftEl = shiftEl.parentElement;
            }
            // Shift+Scroll = horizontal pan
            e.preventDefault();
            setViewport({ ...viewport(), x: viewport().x - e.deltaY });
            return;
        }

        // Check if target is inside a scrollable frame — let it scroll naturally
        let el = e.target as HTMLElement | null;
        while (el) {
            if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
                return; // let the frame content scroll
            }
            if (el.classList?.contains('group/window')) break; // stop at frame boundary
            el = el.parentElement;
        }

        // Plain scroll = vertical pan
        e.preventDefault();
        setViewport({ ...viewport(), y: viewport().y - e.deltaY });
    };

    const resetViewport = () => setViewport({ x: 0, y: 0, zoom: 1 });

    return { viewport, isPanning, handleBackgroundMouseDown, handleBackgroundMouseMove, handleBackgroundMouseUp, handleWheel, resetViewport };
}
