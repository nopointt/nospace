import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  registerCommand,
  getCommand,
  listCommands,
  executeCommand,
} from "~/lib/commands/registry";
import type { CommandContext, CommandDef } from "~/lib/commands/registry";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    replaceComponents: vi.fn(),
    resetViewport: vi.fn(),
    ...overrides,
  };
}

function makeCommand(name: string, returns = true): CommandDef {
  return {
    name,
    description: `Description for ${name}`,
    handler: vi.fn().mockReturnValue(returns),
  };
}

// The registry is module-scoped (shared state across tests).
// We register unique names per test to avoid cross-test contamination.
let suffix = 0;
function uniqueName(base = "/test") {
  return `${base}-${++suffix}`;
}

// ── registerCommand + getCommand ──────────────────────────────────────────────

describe("registry — registerCommand / getCommand", () => {
  it("getCommand returns undefined for an unknown command", () => {
    expect(getCommand("/nonexistent-xyz-99999")).toBeUndefined();
  });

  it("getCommand returns the command after it is registered", () => {
    const name = uniqueName();
    const cmd = makeCommand(name);
    registerCommand(cmd);
    expect(getCommand(name)).toBe(cmd);
  });

  it("overwrites a command registered under the same name", () => {
    const name = uniqueName();
    const first = makeCommand(name);
    const second = { ...makeCommand(name), description: "overwritten" };
    registerCommand(first);
    registerCommand(second);
    expect(getCommand(name)?.description).toBe("overwritten");
  });

  it("getCommand is case-sensitive", () => {
    const name = uniqueName("/CaseSensitive");
    registerCommand(makeCommand(name));
    expect(getCommand(name.toLowerCase())).toBeUndefined();
    expect(getCommand(name)).toBeDefined();
  });

  it("stores command name unchanged", () => {
    const name = uniqueName();
    registerCommand(makeCommand(name));
    expect(getCommand(name)?.name).toBe(name);
  });

  it("stores command description unchanged", () => {
    const name = uniqueName();
    const cmd: CommandDef = {
      name,
      description: "exactly this",
      handler: vi.fn().mockReturnValue(true),
    };
    registerCommand(cmd);
    expect(getCommand(name)?.description).toBe("exactly this");
  });
});

// ── listCommands ──────────────────────────────────────────────────────────────

describe("registry — listCommands", () => {
  it("returns a readonly snapshot array", () => {
    const list = listCommands();
    expect(Array.isArray(list)).toBe(true);
  });

  it("includes newly registered commands", () => {
    const name = uniqueName();
    registerCommand(makeCommand(name));
    const names = listCommands().map((c) => c.name);
    expect(names).toContain(name);
  });

  it("snapshot is independent — mutating it does not affect the registry", () => {
    const name = uniqueName();
    registerCommand(makeCommand(name));
    const list = listCommands() as CommandDef[];
    const sizeBefore = listCommands().length;
    list.splice(0, list.length); // wipe the snapshot
    expect(listCommands().length).toBe(sizeBefore);
  });
});

// ── executeCommand ────────────────────────────────────────────────────────────

describe("registry — executeCommand", () => {
  it("returns false for an unregistered command", () => {
    const ctx = makeContext();
    const result = executeCommand("/never-registered-xyz", "", ctx);
    expect(result).toBe(false);
  });

  it("returns the handler return value when command exists", () => {
    const name = uniqueName();
    registerCommand(makeCommand(name, true));
    expect(executeCommand(name, "", makeContext())).toBe(true);
  });

  it("returns false when the handler explicitly returns false", () => {
    const name = uniqueName();
    registerCommand(makeCommand(name, false));
    expect(executeCommand(name, "", makeContext())).toBe(false);
  });

  it("forwards args string to the handler", () => {
    const name = uniqueName();
    const handler = vi.fn().mockReturnValue(true);
    registerCommand({ name, description: "d", handler });
    const ctx = makeContext();
    executeCommand(name, "hello world", ctx);
    expect(handler).toHaveBeenCalledWith("hello world", ctx);
  });

  it("forwards ctx to the handler", () => {
    const name = uniqueName();
    const handler = vi.fn().mockReturnValue(true);
    registerCommand({ name, description: "d", handler });
    const ctx = makeContext();
    executeCommand(name, "", ctx);
    expect(handler).toHaveBeenCalledWith(expect.anything(), ctx);
  });

  it("invokes handler exactly once per executeCommand call", () => {
    const name = uniqueName();
    const handler = vi.fn().mockReturnValue(true);
    registerCommand({ name, description: "d", handler });
    executeCommand(name, "", makeContext());
    executeCommand(name, "", makeContext());
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("does not invoke handler for an unregistered command", () => {
    const handler = vi.fn();
    executeCommand("/absolutely-missing", "", makeContext());
    expect(handler).not.toHaveBeenCalled();
  });
});

// ── handler interaction with CommandContext ───────────────────────────────────

describe("registry — handler/context interaction", () => {
  it("handler can call ctx.replaceComponents", () => {
    const name = uniqueName();
    registerCommand({
      name,
      description: "d",
      handler: (_args, ctx) => {
        ctx.replaceComponents([]);
        return true;
      },
    });
    const ctx = makeContext();
    executeCommand(name, "", ctx);
    expect(ctx.replaceComponents).toHaveBeenCalledWith([]);
  });

  it("handler can call ctx.resetViewport", () => {
    const name = uniqueName();
    registerCommand({
      name,
      description: "d",
      handler: (_args, ctx) => {
        ctx.resetViewport();
        return true;
      },
    });
    const ctx = makeContext();
    executeCommand(name, "", ctx);
    expect(ctx.resetViewport).toHaveBeenCalledTimes(1);
  });

  it("handler that does nothing returns its value without side effects", () => {
    const name = uniqueName();
    registerCommand({
      name,
      description: "d",
      handler: () => true,
    });
    const ctx = makeContext();
    const result = executeCommand(name, "", ctx);
    expect(result).toBe(true);
    expect(ctx.replaceComponents).not.toHaveBeenCalled();
    expect(ctx.resetViewport).not.toHaveBeenCalled();
  });
});
