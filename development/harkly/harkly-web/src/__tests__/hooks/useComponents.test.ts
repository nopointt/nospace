/**
 * useComponents.test.ts
 *
 * Tests for the reactive parts of useComponents that can be exercised without
 * a browser DOM (addFrame, removeComponent, updateComponent, replaceComponents).
 *
 * Strategy:
 *   - Wrap everything in createRoot() to satisfy SolidJS reactive requirements.
 *   - localStorage is available in jsdom — it is cleared before each test via
 *     the beforeEach hook so tests are independent.
 *   - fetch is NOT called in these tests (kbId is omitted → no API interaction).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createRoot } from "solid-js";
import { useComponents } from "~/hooks/useComponents";
import type { FrameData, Viewport } from "~/lib/canvas/types";
import {
  WINDOW_DEFAULT_WIDTH,
  WINDOW_DEFAULT_HEIGHT,
} from "~/lib/canvas/constants";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "harkly-canvas-state-v1";

/** Viewport accessor stub — useComponents only uses the type, never calls it */
const fakeViewport = (): Viewport => ({ x: 0, y: 0, zoom: 1 });

function withRoot<T>(fn: () => T): T {
  let result!: T;
  createRoot((dispose) => {
    result = fn();
    dispose();
  });
  return result;
}

function makeFrame(overrides: Partial<FrameData> & { type: FrameData["type"] }): Partial<FrameData> & { type: FrameData["type"] } {
  return {
    x: 100,
    y: 100,
    width: 400,
    height: 300,
    ...overrides,
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

// ── Initial state ─────────────────────────────────────────────────────────────

describe("useComponents — initial state (no localStorage)", () => {
  it("components starts as empty array when localStorage is empty", () => {
    withRoot(() => {
      const { components } = useComponents(fakeViewport);
      expect(components).toHaveLength(0);
    });
  });

  it("activeId starts as null", () => {
    withRoot(() => {
      const { activeId } = useComponents(fakeViewport);
      expect(activeId()).toBeNull();
    });
  });
});

// ── addFrame ──────────────────────────────────────────────────────────────────

describe("useComponents — addFrame", () => {
  it("adds a frame to the components array", () => {
    withRoot(() => {
      const { components, addFrame } = useComponents(fakeViewport);
      addFrame({ type: "window", title: "Test" });
      expect(components).toHaveLength(1);
    });
  });

  it("returns the generated id", () => {
    withRoot(() => {
      const { addFrame } = useComponents(fakeViewport);
      const id = addFrame({ type: "window" });
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });
  });

  it("uses the provided id when given", () => {
    withRoot(() => {
      const { components, addFrame } = useComponents(fakeViewport);
      addFrame({ id: "my-fixed-id", type: "panel" });
      expect(components[0].id).toBe("my-fixed-id");
    });
  });

  it("sets activeId to the new frame id", () => {
    withRoot(() => {
      const { activeId, addFrame } = useComponents(fakeViewport);
      const id = addFrame({ type: "text" });
      expect(activeId()).toBe(id);
    });
  });

  it("default x/y is 100 when not specified", () => {
    withRoot(() => {
      const { components, addFrame } = useComponents(fakeViewport);
      addFrame({ type: "window" });
      expect(components[0].x).toBe(100);
      expect(components[0].y).toBe(100);
    });
  });

  it("default width is WINDOW_DEFAULT_WIDTH when not specified", () => {
    withRoot(() => {
      const { components, addFrame } = useComponents(fakeViewport);
      addFrame({ type: "window" });
      expect(components[0].width).toBe(WINDOW_DEFAULT_WIDTH);
    });
  });

  it("default height is WINDOW_DEFAULT_HEIGHT when not specified", () => {
    withRoot(() => {
      const { components, addFrame } = useComponents(fakeViewport);
      addFrame({ type: "window" });
      expect(components[0].height).toBe(WINDOW_DEFAULT_HEIGHT);
    });
  });

  it("honours explicit x/y/width/height", () => {
    withRoot(() => {
      const { components, addFrame } = useComponents(fakeViewport);
      addFrame({ type: "window", x: 250, y: 350, width: 600, height: 400 });
      expect(components[0].x).toBe(250);
      expect(components[0].y).toBe(350);
      expect(components[0].width).toBe(600);
      expect(components[0].height).toBe(400);
    });
  });

  it("stores type, title, and content correctly", () => {
    withRoot(() => {
      const { components, addFrame } = useComponents(fakeViewport);
      addFrame({ type: "text", title: "My Note", content: "Hello world" });
      expect(components[0].type).toBe("text");
      expect(components[0].title).toBe("My Note");
      expect(components[0].content).toBe("Hello world");
    });
  });

  it("adding multiple frames grows the array", () => {
    withRoot(() => {
      const { components, addFrame } = useComponents(fakeViewport);
      addFrame({ type: "window" });
      addFrame({ type: "panel" });
      addFrame({ type: "text" });
      expect(components).toHaveLength(3);
    });
  });

  it("does NOT mutate original frames already in the store", () => {
    withRoot(() => {
      const { components, addFrame } = useComponents(fakeViewport);
      addFrame({ id: "frame-1", type: "window" });
      const snapBefore = { ...components[0] };
      addFrame({ id: "frame-2", type: "panel" });
      expect(components[0]).toMatchObject(snapBefore);
    });
  });
});

// ── removeComponent ───────────────────────────────────────────────────────────

describe("useComponents — removeComponent", () => {
  it("removes the frame with the given id", () => {
    withRoot(() => {
      const { components, addFrame, removeComponent } = useComponents(fakeViewport);
      const id = addFrame({ type: "window" });
      removeComponent(id);
      expect(components).toHaveLength(0);
    });
  });

  it("only removes the matching frame; others are untouched", () => {
    withRoot(() => {
      const { components, addFrame, removeComponent } = useComponents(fakeViewport);
      addFrame({ id: "keep", type: "window" });
      const removeId = addFrame({ id: "remove", type: "panel" });
      removeComponent(removeId);
      expect(components).toHaveLength(1);
      expect(components[0].id).toBe("keep");
    });
  });

  it("clears activeId when the active frame is removed", () => {
    withRoot(() => {
      const { activeId, addFrame, removeComponent } = useComponents(fakeViewport);
      const id = addFrame({ type: "window" });
      expect(activeId()).toBe(id);
      removeComponent(id);
      expect(activeId()).toBeNull();
    });
  });

  it("does not change activeId when a non-active frame is removed", () => {
    withRoot(() => {
      const { activeId, addFrame, removeComponent } = useComponents(fakeViewport);
      const id1 = addFrame({ id: "a", type: "window" });
      addFrame({ id: "b", type: "panel" });
      // activeId should now be 'b' (last added)
      removeComponent(id1);
      expect(activeId()).toBe("b");
    });
  });

  it("is a no-op for an id that does not exist", () => {
    withRoot(() => {
      const { components, addFrame, removeComponent } = useComponents(fakeViewport);
      addFrame({ type: "window" });
      removeComponent("nonexistent-id");
      expect(components).toHaveLength(1);
    });
  });
});

// ── updateComponent ───────────────────────────────────────────────────────────

describe("useComponents — updateComponent", () => {
  it("updates the title of an existing frame", () => {
    withRoot(() => {
      const { components, addFrame, updateComponent } = useComponents(fakeViewport);
      addFrame({ id: "f1", type: "window", title: "Old" });
      updateComponent("f1", { title: "New" });
      expect(components[0].title).toBe("New");
    });
  });

  it("updates x and y positions", () => {
    withRoot(() => {
      const { components, addFrame, updateComponent } = useComponents(fakeViewport);
      addFrame({ id: "f1", type: "window", x: 0, y: 0 });
      updateComponent("f1", { x: 300, y: 400 });
      expect(components[0].x).toBe(300);
      expect(components[0].y).toBe(400);
    });
  });

  it("updates width and height", () => {
    withRoot(() => {
      const { components, addFrame, updateComponent } = useComponents(fakeViewport);
      addFrame({ id: "f1", type: "window", width: 400, height: 300 });
      updateComponent("f1", { width: 800, height: 600 });
      expect(components[0].width).toBe(800);
      expect(components[0].height).toBe(600);
    });
  });

  it("partial update does not wipe unrelated fields", () => {
    withRoot(() => {
      const { components, addFrame, updateComponent } = useComponents(fakeViewport);
      addFrame({ id: "f1", type: "window", title: "Keep Me", x: 10, y: 20 });
      updateComponent("f1", { x: 50 });
      expect(components[0].title).toBe("Keep Me");
      expect(components[0].y).toBe(20);
    });
  });

  it("is a no-op for an id that does not exist", () => {
    withRoot(() => {
      const { components, addFrame, updateComponent } = useComponents(fakeViewport);
      addFrame({ id: "f1", type: "window", title: "Unchanged" });
      updateComponent("no-such-id", { title: "Should Not Apply" });
      expect(components[0].title).toBe("Unchanged");
    });
  });
});

// ── replaceComponents ─────────────────────────────────────────────────────────

describe("useComponents — replaceComponents", () => {
  it("replaces all frames with the provided array", () => {
    withRoot(() => {
      const { components, addFrame, replaceComponents } = useComponents(fakeViewport);
      addFrame({ type: "window" });
      addFrame({ type: "panel" });
      const newFrames: FrameData[] = [{ id: "fresh", type: "text" }];
      replaceComponents(newFrames);
      expect(components).toHaveLength(1);
      expect(components[0].id).toBe("fresh");
    });
  });

  it("replaceComponents with empty array clears all frames", () => {
    withRoot(() => {
      const { components, addFrame, replaceComponents } = useComponents(fakeViewport);
      addFrame({ type: "window" });
      addFrame({ type: "panel" });
      replaceComponents([]);
      expect(components).toHaveLength(0);
    });
  });

  it("replaceComponents with multiple frames sets them all", () => {
    withRoot(() => {
      const { components, replaceComponents } = useComponents(fakeViewport);
      const frames: FrameData[] = [
        { id: "a", type: "window" },
        { id: "b", type: "panel" },
        { id: "c", type: "text" },
      ];
      replaceComponents(frames);
      expect(components).toHaveLength(3);
    });
  });
});

// ── localStorage persistence ──────────────────────────────────────────────────

describe("useComponents — localStorage restoration", () => {
  it("loads frames from localStorage on creation when available", () => {
    const frames: FrameData[] = [
      { id: "stored-1", type: "window", title: "From Storage" },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(frames));

    withRoot(() => {
      const { components } = useComponents(fakeViewport);
      expect(components).toHaveLength(1);
      expect(components[0].id).toBe("stored-1");
      expect(components[0].title).toBe("From Storage");
    });
  });

  it("deduplicates frames by id when loading from localStorage", () => {
    const frames: FrameData[] = [
      { id: "dup", type: "window", title: "First" },
      { id: "dup", type: "window", title: "Second" },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(frames));

    withRoot(() => {
      const { components } = useComponents(fakeViewport);
      expect(components).toHaveLength(1);
      // Last occurrence wins per source code
      expect(components[0].title).toBe("Second");
    });
  });

  it("handles malformed localStorage JSON gracefully (returns empty store)", () => {
    localStorage.setItem(STORAGE_KEY, "not valid json {{{}");

    withRoot(() => {
      const { components } = useComponents(fakeViewport);
      expect(components).toHaveLength(0);
    });
  });

  it("handles empty localStorage gracefully (returns empty store)", () => {
    // localStorage is already cleared in beforeEach
    withRoot(() => {
      const { components } = useComponents(fakeViewport);
      expect(components).toHaveLength(0);
    });
  });
});
