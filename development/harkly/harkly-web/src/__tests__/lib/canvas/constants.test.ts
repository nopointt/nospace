import { describe, it, expect } from "vitest";
import {
  WINDOW_DEFAULT_X,
  WINDOW_DEFAULT_Y,
  WINDOW_DEFAULT_WIDTH,
  WINDOW_DEFAULT_HEIGHT,
  WINDOW_MIN_SIZE,
  SNAP_THRESHOLD,
  SNAP_GAP,
  OMNIBAR_WIDTH,
  SNAP_MAGNETISM,
  SNAP_OMNIBAR_RANGE,
  SNAP_OMNIBAR_OCCUPIED_RADIUS,
  SNAP_OMNIBAR_CENTER_TOLERANCE,
  SNAP_PREVIEW_TOP_OFFSET,
  OMNIBAR_BAR_HEIGHT,
  OMNIBAR_HEADER_HEIGHT,
  SNAP_PINNED_CENTER_RADIUS,
  GRID_SIZE,
  CANVAS_BG,
  GRID_LINE_COLOR,
  GRID_LINE_WIDTH,
} from "~/lib/canvas/constants";

describe("canvas/constants — window defaults", () => {
  it("WINDOW_DEFAULT_X is 100", () => {
    expect(WINDOW_DEFAULT_X).toBe(100);
  });

  it("WINDOW_DEFAULT_Y is 100", () => {
    expect(WINDOW_DEFAULT_Y).toBe(100);
  });

  it("WINDOW_DEFAULT_WIDTH is 400", () => {
    expect(WINDOW_DEFAULT_WIDTH).toBe(400);
  });

  it("WINDOW_DEFAULT_HEIGHT is 300", () => {
    expect(WINDOW_DEFAULT_HEIGHT).toBe(300);
  });

  it("WINDOW_MIN_SIZE is 150", () => {
    expect(WINDOW_MIN_SIZE).toBe(150);
  });

  it("WINDOW_MIN_SIZE is smaller than WINDOW_DEFAULT_WIDTH", () => {
    expect(WINDOW_MIN_SIZE).toBeLessThan(WINDOW_DEFAULT_WIDTH);
  });

  it("WINDOW_MIN_SIZE is smaller than WINDOW_DEFAULT_HEIGHT", () => {
    expect(WINDOW_MIN_SIZE).toBeLessThan(WINDOW_DEFAULT_HEIGHT);
  });
});

describe("canvas/constants — snap: frame-to-frame", () => {
  it("SNAP_THRESHOLD is 100", () => {
    expect(SNAP_THRESHOLD).toBe(100);
  });

  it("SNAP_GAP is 8", () => {
    expect(SNAP_GAP).toBe(8);
  });

  it("SNAP_GAP is a small positive number", () => {
    expect(SNAP_GAP).toBeGreaterThan(0);
    expect(SNAP_GAP).toBeLessThan(SNAP_THRESHOLD);
  });
});

describe("canvas/constants — snap: omnibar", () => {
  it("OMNIBAR_WIDTH is 600", () => {
    expect(OMNIBAR_WIDTH).toBe(600);
  });

  it("SNAP_MAGNETISM is 120", () => {
    expect(SNAP_MAGNETISM).toBe(120);
  });

  it("SNAP_OMNIBAR_RANGE is 180", () => {
    expect(SNAP_OMNIBAR_RANGE).toBe(180);
  });

  it("SNAP_OMNIBAR_OCCUPIED_RADIUS is 100", () => {
    expect(SNAP_OMNIBAR_OCCUPIED_RADIUS).toBe(100);
  });

  it("SNAP_OMNIBAR_CENTER_TOLERANCE is 50", () => {
    expect(SNAP_OMNIBAR_CENTER_TOLERANCE).toBe(50);
  });

  it("SNAP_PREVIEW_TOP_OFFSET is 20", () => {
    expect(SNAP_PREVIEW_TOP_OFFSET).toBe(20);
  });

  it("OMNIBAR_BAR_HEIGHT is 100", () => {
    expect(OMNIBAR_BAR_HEIGHT).toBe(100);
  });

  it("OMNIBAR_HEADER_HEIGHT is 80", () => {
    expect(OMNIBAR_HEADER_HEIGHT).toBe(80);
  });

  it("SNAP_PINNED_CENTER_RADIUS is 100", () => {
    expect(SNAP_PINNED_CENTER_RADIUS).toBe(100);
  });

  it("OMNIBAR_CENTER_TOLERANCE is smaller than SNAP_MAGNETISM", () => {
    expect(SNAP_OMNIBAR_CENTER_TOLERANCE).toBeLessThan(SNAP_MAGNETISM);
  });
});

describe("canvas/constants — grid", () => {
  it("GRID_SIZE is 64", () => {
    expect(GRID_SIZE).toBe(64);
  });

  it("GRID_SIZE is a power of two", () => {
    expect(GRID_SIZE & (GRID_SIZE - 1)).toBe(0);
  });

  it("CANVAS_BG is a valid hex color", () => {
    expect(CANVAS_BG).toBe("#FFF8E7");
    expect(CANVAS_BG).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("GRID_LINE_COLOR is a valid hex color", () => {
    expect(GRID_LINE_COLOR).toBe("#EBEBEB");
    expect(GRID_LINE_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("GRID_LINE_WIDTH is 0.5", () => {
    expect(GRID_LINE_WIDTH).toBe(0.5);
  });

  it("GRID_LINE_WIDTH is a positive sub-pixel value", () => {
    expect(GRID_LINE_WIDTH).toBeGreaterThan(0);
    expect(GRID_LINE_WIDTH).toBeLessThan(1);
  });
});
