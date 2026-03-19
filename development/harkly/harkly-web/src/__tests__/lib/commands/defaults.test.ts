import { describe, it, expect, vi } from "vitest";
import { registerDefaultCommands } from "~/lib/commands/defaults";
import { getCommand, listCommands, executeCommand } from "~/lib/commands/registry";
import type { CommandContext } from "~/lib/commands/registry";

// registerDefaultCommands() is idempotent — calling it again just overwrites
// the same names. We call it once at the top so tests can rely on the commands
// being present regardless of import/test order.
registerDefaultCommands();

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    replaceComponents: vi.fn(),
    resetViewport: vi.fn(),
    ...overrides,
  };
}

const DEFAULT_COMMAND_NAMES = ["/layout", "/clear", "/reset", "/help"] as const;

// ── Registration ──────────────────────────────────────────────────────────────

describe("defaults — registration", () => {
  it.each(DEFAULT_COMMAND_NAMES)(
    "'%s' is registered after registerDefaultCommands()",
    (name) => {
      expect(getCommand(name)).toBeDefined();
    },
  );

  it("registers exactly 4 known default command names", () => {
    const allNames = listCommands().map((c) => c.name);
    const defaultsPresent = DEFAULT_COMMAND_NAMES.filter((n) => allNames.includes(n));
    expect(defaultsPresent).toHaveLength(DEFAULT_COMMAND_NAMES.length);
  });

  it.each(DEFAULT_COMMAND_NAMES)(
    "'%s' has a non-empty description",
    (name) => {
      const cmd = getCommand(name);
      expect(cmd?.description).toBeTruthy();
      expect(cmd?.description.trim().length).toBeGreaterThan(0);
    },
  );

  it.each(DEFAULT_COMMAND_NAMES)(
    "'%s' command name matches its def.name field",
    (name) => {
      expect(getCommand(name)?.name).toBe(name);
    },
  );
});

// ── /layout ───────────────────────────────────────────────────────────────────

describe("defaults — /layout", () => {
  it("returns true", () => {
    expect(executeCommand("/layout", "", makeContext())).toBe(true);
  });

  it("calls replaceComponents with empty array", () => {
    const ctx = makeContext();
    executeCommand("/layout", "", ctx);
    expect(ctx.replaceComponents).toHaveBeenCalledWith([]);
  });

  it("calls resetViewport", () => {
    const ctx = makeContext();
    executeCommand("/layout", "", ctx);
    expect(ctx.resetViewport).toHaveBeenCalledTimes(1);
  });
});

// ── /clear ────────────────────────────────────────────────────────────────────

describe("defaults — /clear", () => {
  it("returns true", () => {
    expect(executeCommand("/clear", "", makeContext())).toBe(true);
  });

  it("calls replaceComponents with empty array", () => {
    const ctx = makeContext();
    executeCommand("/clear", "", ctx);
    expect(ctx.replaceComponents).toHaveBeenCalledWith([]);
  });

  it("does NOT call resetViewport", () => {
    const ctx = makeContext();
    executeCommand("/clear", "", ctx);
    expect(ctx.resetViewport).not.toHaveBeenCalled();
  });
});

// ── /reset ────────────────────────────────────────────────────────────────────

describe("defaults — /reset", () => {
  it("returns true", () => {
    expect(executeCommand("/reset", "", makeContext())).toBe(true);
  });

  it("calls resetViewport", () => {
    const ctx = makeContext();
    executeCommand("/reset", "", ctx);
    expect(ctx.resetViewport).toHaveBeenCalledTimes(1);
  });

  it("does NOT call replaceComponents", () => {
    const ctx = makeContext();
    executeCommand("/reset", "", ctx);
    expect(ctx.replaceComponents).not.toHaveBeenCalled();
  });
});

// ── /help ─────────────────────────────────────────────────────────────────────

describe("defaults — /help", () => {
  it("returns true", () => {
    expect(executeCommand("/help", "", makeContext())).toBe(true);
  });

  it("calls replaceComponents with exactly one frame", () => {
    const ctx = makeContext();
    executeCommand("/help", "", ctx);
    const [frames] = (ctx.replaceComponents as ReturnType<typeof vi.fn>).mock.calls[0] as [
      unknown[],
    ];
    expect(frames).toHaveLength(1);
  });

  it("help frame has type 'window'", () => {
    const ctx = makeContext();
    executeCommand("/help", "", ctx);
    const [frames] = (ctx.replaceComponents as ReturnType<typeof vi.fn>).mock.calls[0] as [
      Array<{ type: string }>,
    ];
    expect(frames[0].type).toBe("window");
  });

  it("help frame has a non-empty title", () => {
    const ctx = makeContext();
    executeCommand("/help", "", ctx);
    const [frames] = (ctx.replaceComponents as ReturnType<typeof vi.fn>).mock.calls[0] as [
      Array<{ title?: string }>,
    ];
    expect(frames[0].title).toBeTruthy();
  });

  it("help frame content lists all default commands", () => {
    const ctx = makeContext();
    executeCommand("/help", "", ctx);
    const [frames] = (ctx.replaceComponents as ReturnType<typeof vi.fn>).mock.calls[0] as [
      Array<{ content?: string }>,
    ];
    const content = frames[0].content ?? "";
    for (const name of DEFAULT_COMMAND_NAMES) {
      expect(content).toContain(name);
    }
  });

  it("help frame has positive width and height", () => {
    const ctx = makeContext();
    executeCommand("/help", "", ctx);
    const [frames] = (ctx.replaceComponents as ReturnType<typeof vi.fn>).mock.calls[0] as [
      Array<{ width: number; height: number }>,
    ];
    expect(frames[0].width).toBeGreaterThan(0);
    expect(frames[0].height).toBeGreaterThan(0);
  });

  it("calls resetViewport", () => {
    const ctx = makeContext();
    executeCommand("/help", "", ctx);
    expect(ctx.resetViewport).toHaveBeenCalledTimes(1);
  });

  it("generates a frame id that starts with 'help-'", () => {
    const ctx = makeContext();
    executeCommand("/help", "", ctx);
    const [frames] = (ctx.replaceComponents as ReturnType<typeof vi.fn>).mock.calls[0] as [
      Array<{ id: string }>,
    ];
    expect(frames[0].id).toMatch(/^help-\d+$/);
  });
});

// ── Idempotency ───────────────────────────────────────────────────────────────

describe("defaults — registerDefaultCommands idempotency", () => {
  it("calling registerDefaultCommands() twice does not duplicate commands", () => {
    const countBefore = listCommands().filter((c) =>
      DEFAULT_COMMAND_NAMES.includes(c.name as (typeof DEFAULT_COMMAND_NAMES)[number]),
    ).length;
    registerDefaultCommands();
    const countAfter = listCommands().filter((c) =>
      DEFAULT_COMMAND_NAMES.includes(c.name as (typeof DEFAULT_COMMAND_NAMES)[number]),
    ).length;
    expect(countAfter).toBe(countBefore);
  });

  it("re-registered commands still work correctly", () => {
    registerDefaultCommands();
    const ctx = makeContext();
    expect(executeCommand("/clear", "", ctx)).toBe(true);
  });
});
