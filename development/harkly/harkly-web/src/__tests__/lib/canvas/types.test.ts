/**
 * types.test.ts — compile-time shape verification for canvas/types.ts
 *
 * Strategy: construct literal objects that satisfy each exported interface.
 * If the type shapes change incompatibly the TypeScript compiler will catch it
 * before the test even runs. Runtime assertions confirm the objects survive
 * a round-trip without unexpected coercions.
 */

import { describe, it, expect } from "vitest";
import type {
  FramePosition,
  FrameData,
  Viewport,
  SnapPreview,
  GroupRect,
  GroupTransform,
} from "~/lib/canvas/types";

// ── FramePosition ────────────────────────────────────────────────────────────

describe("canvas/types — FramePosition", () => {
  it("accepts a fully-specified position", () => {
    const pos: FramePosition = { x: 10, y: 20, width: 400, height: 300, isPinned: false };
    expect(pos.x).toBe(10);
    expect(pos.y).toBe(20);
    expect(pos.width).toBe(400);
    expect(pos.height).toBe(300);
    expect(pos.isPinned).toBe(false);
  });

  it("isPinned can be true", () => {
    const pos: FramePosition = { x: 0, y: 0, width: 600, height: 480, isPinned: true };
    expect(pos.isPinned).toBe(true);
  });
});

// ── FrameData ────────────────────────────────────────────────────────────────

describe("canvas/types — FrameData", () => {
  const VALID_TYPES: FrameData["type"][] = [
    "window",
    "text",
    "panel",
    "framing-studio",
    "collection-plan",
    "source-card",
    "raw-data",
    "insights",
    "artifacts",
    "notebook",
    "error",
  ];

  it("accepts a minimal FrameData (id + type only)", () => {
    const frame: FrameData = { id: "frame-1", type: "window" };
    expect(frame.id).toBe("frame-1");
    expect(frame.type).toBe("window");
  });

  it("lists exactly 11 valid frame types", () => {
    expect(VALID_TYPES).toHaveLength(11);
  });

  it.each(VALID_TYPES)("type '%s' is a valid FrameData type", (t) => {
    const frame: FrameData = { id: `frame-${t}`, type: t };
    expect(frame.type).toBe(t);
  });

  it("accepts all optional fields", () => {
    const preSnap: FramePosition = { x: 0, y: 0, width: 400, height: 300, isPinned: false };
    const frame: FrameData = {
      id: "full-frame",
      type: "panel",
      title: "My Panel",
      content: "some content",
      x: 100,
      y: 200,
      width: 400,
      height: 300,
      floor: 2,
      branch: "raw-data",
      isPinned: false,
      preSnapState: preSnap,
      attachedTo: "other-frame",
      dockedTo: "omnibar",
      color: "#f2b90d",
    };
    expect(frame.title).toBe("My Panel");
    expect(frame.floor).toBe(2);
    expect(frame.preSnapState).toBe(preSnap);
    expect(frame.color).toBe("#f2b90d");
  });

  it("optional fields default to undefined when omitted", () => {
    const frame: FrameData = { id: "sparse", type: "text" };
    expect(frame.title).toBeUndefined();
    expect(frame.x).toBeUndefined();
    expect(frame.floor).toBeUndefined();
    expect(frame.color).toBeUndefined();
  });
});

// ── Viewport ─────────────────────────────────────────────────────────────────

describe("canvas/types — Viewport", () => {
  it("accepts positive zoom", () => {
    const vp: Viewport = { x: 0, y: 0, zoom: 1.5 };
    expect(vp.zoom).toBe(1.5);
  });

  it("accepts negative pan values (panned left/up)", () => {
    const vp: Viewport = { x: -200, y: -150, zoom: 1 };
    expect(vp.x).toBeLessThan(0);
    expect(vp.y).toBeLessThan(0);
  });

  it("has exactly three fields", () => {
    const vp: Viewport = { x: 10, y: 20, zoom: 2 };
    expect(Object.keys(vp)).toHaveLength(3);
  });
});

// ── SnapPreview ───────────────────────────────────────────────────────────────

describe("canvas/types — SnapPreview", () => {
  it("accepts minimal snap preview (x, y, w, h)", () => {
    const preview: SnapPreview = { x: 50, y: 100, w: 400, h: 300 };
    expect(preview.w).toBe(400);
    expect(preview.h).toBe(300);
  });

  it("accepts optional fields: needsPin, attachedTo, dockedTo", () => {
    const preview: SnapPreview = {
      x: 0,
      y: 0,
      w: 600,
      h: 480,
      needsPin: true,
      attachedTo: "frame-a",
      dockedTo: "omnibar",
    };
    expect(preview.needsPin).toBe(true);
    expect(preview.attachedTo).toBe("frame-a");
    expect(preview.dockedTo).toBe("omnibar");
  });
});

// ── GroupRect ─────────────────────────────────────────────────────────────────

describe("canvas/types — GroupRect", () => {
  it("holds x, y, w, h as numbers", () => {
    const rect: GroupRect = { x: 10, y: 20, w: 300, h: 200 };
    expect(rect.x).toBe(10);
    expect(rect.y).toBe(20);
    expect(rect.w).toBe(300);
    expect(rect.h).toBe(200);
  });

  it("has exactly four fields", () => {
    const rect: GroupRect = { x: 0, y: 0, w: 1, h: 1 };
    expect(Object.keys(rect)).toHaveLength(4);
  });
});

// ── GroupTransform ────────────────────────────────────────────────────────────

describe("canvas/types — GroupTransform", () => {
  it("accepts a full GroupTransform", () => {
    const initial: GroupRect = { x: 0, y: 0, w: 400, h: 300 };
    const transform: GroupTransform = {
      leaderId: "leader-1",
      sx: 1.2,
      sy: 0.8,
      lx: 100,
      ly: 150,
      leaderInitial: initial,
    };
    expect(transform.leaderId).toBe("leader-1");
    expect(transform.sx).toBe(1.2);
    expect(transform.sy).toBe(0.8);
    expect(transform.leaderInitial).toBe(initial);
  });

  it("leaderInitial is a GroupRect", () => {
    const initial: GroupRect = { x: 5, y: 10, w: 200, h: 100 };
    const transform: GroupTransform = {
      leaderId: "x",
      sx: 1,
      sy: 1,
      lx: 0,
      ly: 0,
      leaderInitial: initial,
    };
    expect(Object.keys(transform.leaderInitial)).toEqual(
      expect.arrayContaining(["x", "y", "w", "h"]),
    );
  });
});
