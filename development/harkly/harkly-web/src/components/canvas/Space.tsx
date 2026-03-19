import { Component, onCleanup, onMount, createEffect } from "solid-js";
import {
    GRID_SIZE,
    CANVAS_BG,
    GRID_LINE_COLOR,
    GRID_LINE_WIDTH,
} from "~/lib/canvas/constants";

interface SpaceProps {
    viewport: { x: number; y: number; zoom: number };
}

const Space: Component<SpaceProps> = (props) => {
    let canvasRef: HTMLCanvasElement | undefined;

    onMount(() => {
        if (!canvasRef) return;
        const ctx = canvasRef.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            if (!canvasRef) return;
            if (
                canvasRef.width !== window.innerWidth ||
                canvasRef.height !== window.innerHeight
            ) {
                canvasRef.width = window.innerWidth;
                canvasRef.height = window.innerHeight;
            }
        };

        const drawGrid = () => {
            if (!canvasRef || !ctx) return;

            const w = canvasRef.width;
            const h = canvasRef.height;

            // Background
            ctx.fillStyle = CANVAS_BG;
            ctx.fillRect(0, 0, w, h);

            const gridSize = GRID_SIZE * props.viewport.zoom;
            const offsetX = props.viewport.x % gridSize;
            const offsetY = props.viewport.y % gridSize;

            // Draw line grid
            ctx.strokeStyle = GRID_LINE_COLOR;
            ctx.lineWidth = GRID_LINE_WIDTH;

            ctx.beginPath();
            for (let x = offsetX; x < w + gridSize; x += gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
            }
            for (let y = offsetY; y < h + gridSize; y += gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
            }
            ctx.stroke();
        };

        // Redraw whenever viewport or window changes
        createEffect(() => {
            // Access properties to ensure reactivity tracking
            const _ = [
                props.viewport.x,
                props.viewport.y,
                props.viewport.zoom,
            ];
            drawGrid();
        });

        resizeCanvas();

        const onResize = () => {
            resizeCanvas();
            drawGrid();
        };
        window.addEventListener("resize", onResize);

        onCleanup(() => {
            window.removeEventListener("resize", onResize);
        });
    });

    return (
        <canvas
            ref={canvasRef}
            class="absolute top-0 left-0 w-full h-full z-0 block"
        />
    );
};

export default Space;
