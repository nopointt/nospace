/**
 * useSnap.test.ts
 *
 * Tests for the exported `detectFrameSnap` pure function from useSnap.ts.
 * This function is entirely deterministic (no signals involved), so we
 * can call it directly without a reactive root.
 *
 * IMPORTANT: The source uses `other.x || WINDOW_DEFAULT_X` (falsy fallback).
 * This means x=0 is treated as WINDOW_DEFAULT_X (100) and y=0 as WINDOW_DEFAULT_Y (100).
 * All test fixtures use non-zero coordinates to avoid the fallback behaviour.
 *
 * Constants from canvas/constants:
 *   SNAP_THRESHOLD       = 100   (max proximity to trigger a snap — strict <)
 *   SNAP_GAP             = 8     (pixel gap inserted between snapped frames)
 *   WINDOW_DEFAULT_WIDTH  = 400
 *   WINDOW_DEFAULT_HEIGHT = 300
 *   WINDOW_DEFAULT_X      = 100  (fallback when x is falsy)
 *   WINDOW_DEFAULT_Y      = 100  (fallback when y is falsy)
 */

import { describe, it, expect } from "vitest";
import { detectFrameSnap } from "~/hooks/useSnap";
import type { FrameData } from "~/lib/canvas/types";
import {
  SNAP_THRESHOLD,
  SNAP_GAP,
  WINDOW_DEFAULT_WIDTH,
  WINDOW_DEFAULT_HEIGHT,
} from "~/lib/canvas/constants";

// ── Fixtures ──────────────────────────────────────────────────────────────────

/**
 * Build a FrameData with explicit non-zero coordinates to avoid the
 * `|| WINDOW_DEFAULT_X` fallback in detectFrameSnap.
 */
function makeFrame(overrides: Partial<FrameData> & { id: string }): FrameData {
  return {
    type: "window",
    // Use non-zero defaults so the falsy-fallback in detectFrameSnap
    // does not silently replace them.
    x: 200,
    y: 200,
    width: WINDOW_DEFAULT_WIDTH,
    height: WINDOW_DEFAULT_HEIGHT,
    isPinned: false,
    ...overrides,
  };
}

// ── No snap ───────────────────────────────────────────────────────────────────

describe("detectFrameSnap — no snap", () => {
  it("returns null when component list is empty", () => {
    const dragged = { x: 500, y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    expect(detectFrameSnap("dragged", dragged, comp, [])).toBeNull();
  });

  it("returns null when the only other frame is the dragged frame itself", () => {
    const comp = makeFrame({ id: "dragged", x: 200, y: 200 });
    const dragged = { x: 200, y: 200, width: 400, height: 300 };
    expect(detectFrameSnap("dragged", dragged, comp, [comp])).toBeNull();
  });

  it("returns null when frames are far apart (beyond SNAP_THRESHOLD)", () => {
    // other: x=200, width=400 → right edge at 600
    // dragged left edge at 900 → distance = |900 - 600| = 300 > 100
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 900, y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    expect(detectFrameSnap("dragged", dragged, comp, [other])).toBeNull();
  });

  it("returns null when x distance is within threshold but y distance is too large", () => {
    // other: x=200, width=400 → right edge at 600
    // dragged x=650: dx = |650-600| = 50 < threshold (fine)
    // dragged y=500: dy = |500-200| = 300 > threshold (fails)
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 650, y: 500, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    expect(detectFrameSnap("dragged", dragged, comp, [other])).toBeNull();
  });

  it("skips a pinned other frame when dragged is not pinned", () => {
    // skip condition: other.isPinned && !comp.isPinned
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300, isPinned: true });
    // dragged directly adjacent to other's right edge — would normally snap
    const dragged = { x: 602, y: 201, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged", isPinned: false });
    expect(detectFrameSnap("dragged", dragged, comp, [other])).toBeNull();
  });
});

// ── Snap: right-edge of other → left-edge of dragged ─────────────────────────
// Condition: |dragged.x - (ox + ow)| < threshold AND |dragged.y - oy| < threshold

describe("detectFrameSnap — snap: right-edge of other to left-edge of dragged", () => {
  // other: x=200, width=400 → right edge at 600
  // Place dragged left edge at 610 → dx = |610-600| = 10 < 100, dy = 0 < 100

  it("detects snap when dragged.x is close to other right edge", () => {
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 610, y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result).not.toBeNull();
  });

  it("snap x is positioned at ox + ow + SNAP_GAP", () => {
    // ox=200, ow=400 → snap x = 200+400+8 = 608
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 610, y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.x).toBe(200 + 400 + SNAP_GAP);
  });

  it("snap y aligns with the other frame y (oy)", () => {
    const other = makeFrame({ id: "other", x: 200, y: 350, width: 400, height: 300 });
    const dragged = { x: 610, y: 355, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.y).toBe(350);
  });

  it("snap height matches the other frame height (oh)", () => {
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 250 });
    const dragged = { x: 610, y: 205, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.h).toBe(250);
  });

  it("snap width matches the dragged frame width", () => {
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 610, y: 200, width: 500, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.w).toBe(500);
  });

  it("attachedTo is the other frame id", () => {
    const other = makeFrame({ id: "panel-1", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 610, y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.attachedTo).toBe("panel-1");
  });
});

// ── Snap: left-edge of other → right-edge of dragged ─────────────────────────
// Condition: |dragged.x + dragged.width - ox| < threshold AND |dragged.y - oy| < threshold

describe("detectFrameSnap — snap: left-edge of other to right-edge of dragged", () => {
  it("detects snap when dragged right edge ≈ other left edge", () => {
    // other: x=700, y=200 → left edge at 700
    // dragged: x=300, width=400 → right edge at 700 → dx = |700-700| = 0 < 100
    const other = makeFrame({ id: "other", x: 700, y: 200, width: 400, height: 300 });
    const dragged = { x: 300, y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result).not.toBeNull();
  });

  it("snap x is positioned at ox - dragged.width - SNAP_GAP", () => {
    // ox=700, dragged.width=400 → snap x = 700-400-8 = 292
    const other = makeFrame({ id: "other", x: 700, y: 200, width: 400, height: 300 });
    const dragged = { x: 300, y: 202, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.x).toBe(700 - 400 - SNAP_GAP);
  });

  it("snap y aligns with the other frame y", () => {
    const other = makeFrame({ id: "other", x: 700, y: 250, width: 400, height: 300 });
    const dragged = { x: 300, y: 255, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.y).toBe(250);
  });

  it("attachedTo is the other frame id", () => {
    const other = makeFrame({ id: "right-panel", x: 700, y: 200, width: 400, height: 300 });
    const dragged = { x: 298, y: 201, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.attachedTo).toBe("right-panel");
  });
});

// ── Snap: bottom-edge of other → top-edge of dragged ─────────────────────────
// Condition: |dragged.y - (oy + oh)| < threshold AND |dragged.x - ox| < threshold

describe("detectFrameSnap — snap: bottom-edge of other to top-edge of dragged", () => {
  it("detects snap when dragged.y ≈ other bottom edge", () => {
    // other: y=200, height=300 → bottom edge at 500
    // dragged.y = 505 → dy = |505-500| = 5 < 100, dx = |200-200| = 0 < 100
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 200, y: 505, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result).not.toBeNull();
  });

  it("snap y is positioned at oy + oh + SNAP_GAP", () => {
    // oy=200, oh=300 → snap y = 200+300+8 = 508
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 201, y: 505, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.y).toBe(200 + 300 + SNAP_GAP);
  });

  it("snap x aligns with the other frame x", () => {
    const other = makeFrame({ id: "other", x: 400, y: 200, width: 400, height: 300 });
    const dragged = { x: 401, y: 505, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.x).toBe(400);
  });

  it("snap width matches the other frame width (ow)", () => {
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 350, height: 300 });
    const dragged = { x: 202, y: 503, width: 400, height: 250 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.w).toBe(350);
  });

  it("snap height matches the dragged frame height", () => {
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 202, y: 503, width: 400, height: 250 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.h).toBe(250);
  });

  it("attachedTo is the other frame id", () => {
    const other = makeFrame({ id: "top-frame", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 200, y: 502, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result?.attachedTo).toBe("top-frame");
  });
});

// ── needsPin propagation ──────────────────────────────────────────────────────

describe("detectFrameSnap — needsPin", () => {
  it("needsPin is false when other is not pinned", () => {
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300, isPinned: false });
    const dragged = { x: 610, y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged", isPinned: false });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result).not.toBeNull();
    expect(result?.needsPin).toBe(false);
  });

  it("needsPin is true when other is pinned (and snap occurs because dragged is also pinned)", () => {
    // skip condition: other.isPinned && !comp.isPinned
    // if both pinned: other.isPinned=true, comp.isPinned=true → !comp.isPinned=false → not skipped
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300, isPinned: true });
    const dragged = { x: 610, y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged", isPinned: true });
    const result = detectFrameSnap("dragged", dragged, comp, [other]);
    expect(result).not.toBeNull();
    expect(result?.needsPin).toBe(true);
  });
});

// ── Threshold boundary ────────────────────────────────────────────────────────

describe("detectFrameSnap — threshold boundary", () => {
  it("snaps when distance is exactly 1 less than SNAP_THRESHOLD", () => {
    // other: x=200, width=400 → right edge at 600
    // dragged.x = 600 + (SNAP_THRESHOLD - 1) = 699 → dx = 99 < 100 → snap
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 600 + (SNAP_THRESHOLD - 1), y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    expect(detectFrameSnap("dragged", dragged, comp, [other])).not.toBeNull();
  });

  it("does not snap when distance equals SNAP_THRESHOLD exactly", () => {
    // dx = SNAP_THRESHOLD → not < threshold → no snap
    const other = makeFrame({ id: "other", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 600 + SNAP_THRESHOLD, y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    expect(detectFrameSnap("dragged", dragged, comp, [other])).toBeNull();
  });
});

// ── Multiple candidates ───────────────────────────────────────────────────────

describe("detectFrameSnap — multiple candidates", () => {
  it("returns the first matching snap when multiple frames match", () => {
    // Both frames are at the same position — first one in the array wins
    const other1 = makeFrame({ id: "a", x: 200, y: 200, width: 400, height: 300 });
    const other2 = makeFrame({ id: "b", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 610, y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [other1, other2]);
    expect(result?.attachedTo).toBe("a");
  });

  it("skips non-matching frames and finds the second candidate", () => {
    // first frame is far away, second is close to dragged
    const far = makeFrame({ id: "far", x: 5000, y: 5000, width: 400, height: 300 });
    const close = makeFrame({ id: "close", x: 200, y: 200, width: 400, height: 300 });
    const dragged = { x: 610, y: 200, width: 400, height: 300 };
    const comp = makeFrame({ id: "dragged" });
    const result = detectFrameSnap("dragged", dragged, comp, [far, close]);
    expect(result?.attachedTo).toBe("close");
  });
});
