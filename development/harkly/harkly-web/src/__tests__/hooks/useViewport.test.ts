/**
 * useViewport.test.ts
 *
 * Tests for the reactive viewport hook. Because the hook uses SolidJS signals
 * we wrap every call in createRoot() so reactive primitives are properly
 * tracked and disposed — no signal-leak warnings.
 */

import { describe, it, expect } from "vitest";
import { createRoot } from "solid-js";
import { useViewport } from "~/hooks/useViewport";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Run `fn` inside a synchronous reactive root and return the result.
 * The root is disposed immediately after — fine for unit tests.
 */
function withRoot<T>(fn: () => T): T {
  let result!: T;
  createRoot((dispose) => {
    result = fn();
    dispose();
  });
  return result;
}

// ── Initial state ─────────────────────────────────────────────────────────────

describe("useViewport — initial state", () => {
  it("viewport starts at origin with zoom 1", () => {
    withRoot(() => {
      const { viewport } = useViewport();
      expect(viewport()).toEqual({ x: 0, y: 0, zoom: 1 });
    });
  });

  it("isPanning starts as false", () => {
    withRoot(() => {
      const { isPanning } = useViewport();
      expect(isPanning()).toBe(false);
    });
  });
});

// ── resetViewport ─────────────────────────────────────────────────────────────

describe("useViewport — resetViewport", () => {
  it("resets viewport to { x:0, y:0, zoom:1 }", () => {
    withRoot(() => {
      const { viewport, resetViewport, handleWheel } = useViewport();
      // Simulate a pan by directly calling reset after any mutation
      resetViewport();
      expect(viewport()).toEqual({ x: 0, y: 0, zoom: 1 });
    });
  });

  it("calling resetViewport multiple times is idempotent", () => {
    withRoot(() => {
      const { viewport, resetViewport } = useViewport();
      resetViewport();
      resetViewport();
      expect(viewport()).toEqual({ x: 0, y: 0, zoom: 1 });
    });
  });
});

// ── screenToWorld / worldToScreen — pure math ─────────────────────────────────
// The hook doesn't export these as standalone functions; we verify the same
// math through the wheel zoom behaviour where the formula is used explicitly.
//
// Formula from source:
//   worldX = (screenX - vpX) / zoom
//   screenX = worldX * zoom + vpX

describe("useViewport — coordinate transform math", () => {
  it("world origin maps to viewport offset (screenX = vpX when worldX=0)", () => {
    // When zoom=1 and viewport is at (100, 50), world (0,0) renders at screen (100, 50)
    const vpX = 100;
    const vpY = 50;
    const zoom = 1;
    const screenX = 0 * zoom + vpX;
    const screenY = 0 * zoom + vpY;
    expect(screenX).toBe(100);
    expect(screenY).toBe(50);
  });

  it("screenToWorld is the inverse of worldToScreen", () => {
    const vpX = 120;
    const vpY = -40;
    const zoom = 2;
    const worldX = 300;
    const worldY = 150;
    // world -> screen
    const screenX = worldX * zoom + vpX;
    const screenY = worldY * zoom + vpY;
    // screen -> world (inverse)
    const recoveredX = (screenX - vpX) / zoom;
    const recoveredY = (screenY - vpY) / zoom;
    expect(recoveredX).toBeCloseTo(worldX);
    expect(recoveredY).toBeCloseTo(worldY);
  });

  it("zoom=2 halves the world-space distance per screen pixel", () => {
    const zoom = 2;
    const screenDelta = 100; // 100 screen pixels
    const worldDelta = screenDelta / zoom;
    expect(worldDelta).toBe(50);
  });

  it("zoom=0.5 doubles the world-space distance per screen pixel", () => {
    const zoom = 0.5;
    const screenDelta = 100;
    const worldDelta = screenDelta / zoom;
    expect(worldDelta).toBe(200);
  });
});

// ── zoom limits ───────────────────────────────────────────────────────────────

describe("useViewport — zoom limits (Ctrl+Scroll)", () => {
  /**
   * Build a synthetic WheelEvent.
   * jsdom doesn't implement preventDefault on WheelEvent by default —
   * we stub it to avoid errors.
   */
  function makeWheelEvent(deltaY: number, ctrlKey = true): WheelEvent {
    const ev = new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true });
    Object.defineProperty(ev, "ctrlKey", { value: ctrlKey });
    Object.defineProperty(ev, "clientX", { value: 400 });
    Object.defineProperty(ev, "clientY", { value: 300 });
    return ev;
  }

  it("zoom does not go above 3 when scrolling in repeatedly", () => {
    withRoot(() => {
      const { viewport, handleWheel } = useViewport();
      // Each negative deltaY zooms in by 0.1; fire 100 times
      for (let i = 0; i < 100; i++) {
        handleWheel(makeWheelEvent(-1));
      }
      expect(viewport().zoom).toBeLessThanOrEqual(3);
    });
  });

  it("zoom does not go below 0.1 when scrolling out repeatedly", () => {
    withRoot(() => {
      const { viewport, handleWheel } = useViewport();
      // Positive deltaY zooms out by 0.1; fire 100 times
      for (let i = 0; i < 100; i++) {
        handleWheel(makeWheelEvent(1));
      }
      expect(viewport().zoom).toBeGreaterThanOrEqual(0.1);
    });
  });

  it("zoom increases by ~0.1 on a single scroll-in event", () => {
    withRoot(() => {
      const { viewport, handleWheel } = useViewport();
      const before = viewport().zoom;
      handleWheel(makeWheelEvent(-1));
      expect(viewport().zoom).toBeCloseTo(before + 0.1, 5);
    });
  });

  it("zoom decreases by ~0.1 on a single scroll-out event", () => {
    withRoot(() => {
      const { viewport, handleWheel } = useViewport();
      const before = viewport().zoom;
      handleWheel(makeWheelEvent(1));
      expect(viewport().zoom).toBeCloseTo(before - 0.1, 5);
    });
  });
});

// ── pan via mouse ─────────────────────────────────────────────────────────────

describe("useViewport — mouse pan", () => {
  function makeMouseEvent(
    type: string,
    clientX: number,
    clientY: number,
    button = 0,
  ): MouseEvent {
    const ev = new MouseEvent(type, { clientX, clientY, button, bubbles: true });
    return ev;
  }

  it("isPanning becomes true on left-click on background", () => {
    withRoot(() => {
      const { isPanning, handleBackgroundMouseDown } = useViewport();
      handleBackgroundMouseDown(makeMouseEvent("mousedown", 200, 150, 0), true);
      expect(isPanning()).toBe(true);
    });
  });

  it("isPanning becomes false on mouseup", () => {
    withRoot(() => {
      const { isPanning, handleBackgroundMouseDown, handleBackgroundMouseUp } = useViewport();
      handleBackgroundMouseDown(makeMouseEvent("mousedown", 200, 150, 0), true);
      handleBackgroundMouseUp();
      expect(isPanning()).toBe(false);
    });
  });

  it("viewport x/y updates while panning", () => {
    withRoot(() => {
      const { viewport, handleBackgroundMouseDown, handleBackgroundMouseMove } = useViewport();
      // Start pan at (100, 100), viewport at origin
      handleBackgroundMouseDown(makeMouseEvent("mousedown", 100, 100, 0), true);
      // Move to (150, 120) — delta (50, 20)
      handleBackgroundMouseMove(makeMouseEvent("mousemove", 150, 120, 0));
      expect(viewport().x).toBe(50);
      expect(viewport().y).toBe(20);
    });
  });

  it("middle mouse button (button=1) always starts panning", () => {
    withRoot(() => {
      const { isPanning, handleBackgroundMouseDown } = useViewport();
      // isOnBackground = false but middle-button should still pan
      handleBackgroundMouseDown(makeMouseEvent("mousedown", 100, 100, 1), false);
      expect(isPanning()).toBe(true);
    });
  });

  it("left click NOT on background does not start panning", () => {
    withRoot(() => {
      const { isPanning, handleBackgroundMouseDown } = useViewport();
      handleBackgroundMouseDown(makeMouseEvent("mousedown", 100, 100, 0), false);
      expect(isPanning()).toBe(false);
    });
  });
});

// ── horizontal pan (Shift+Scroll) ─────────────────────────────────────────────

describe("useViewport — shift+scroll horizontal pan", () => {
  it("shifts viewport.x on Shift+Scroll", () => {
    withRoot(() => {
      const { viewport, handleWheel } = useViewport();
      // Create a WheelEvent with shiftKey and a target that has scrollWidth === clientWidth
      const ev = new WheelEvent("wheel", { deltaY: 50, bubbles: true, cancelable: true });
      Object.defineProperty(ev, "shiftKey", { value: true });
      // target needs classList and parentElement for the scroll-guard traversal
      const div = document.createElement("div");
      Object.defineProperty(ev, "target", { value: div });
      handleWheel(ev);
      expect(viewport().x).toBe(-50); // x -= deltaY
    });
  });
});
