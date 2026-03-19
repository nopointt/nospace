/**
 * Command Registry for Harkly Web.
 * Ported from harkly-shell, stripped of kernel integration.
 * Pure local command dispatch only.
 */

import type { FrameData } from "~/lib/canvas/types";

// ── Types ────────────────────────────────────────────────────

export interface CommandContext {
  readonly replaceComponents: (frames: FrameData[]) => void;
  readonly resetViewport: () => void;
}

export interface CommandDef {
  readonly name: string;
  readonly description: string;
  readonly handler: (args: string, ctx: CommandContext) => boolean;
}

// ── Registry (module-scoped) ────────────────────────────────

const registry: Map<string, CommandDef> = new Map();

/** Register a command. Overwrites any previous command with the same name. */
export function registerCommand(def: CommandDef): void {
  registry.set(def.name, def);
}

/** Retrieve a command definition by exact name. */
export function getCommand(name: string): CommandDef | undefined {
  return registry.get(name);
}

/** Return a snapshot array of every registered command. */
export function listCommands(): readonly CommandDef[] {
  return [...registry.values()];
}

/**
 * Look up `name` in the registry and, if found, invoke its handler.
 * Returns `true` when the command was found AND the handler consumed it.
 */
export function executeCommand(
  name: string,
  args: string,
  ctx: CommandContext,
): boolean {
  const def = registry.get(name);
  if (!def) return false;
  return def.handler(args, ctx);
}
