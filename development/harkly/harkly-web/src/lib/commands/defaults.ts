/**
 * Default commands for Harkly Web canvas.
 * Stripped of kernel/tLOS-specific commands — only local canvas ops.
 */

import { registerCommand } from "./registry";
import type { CommandContext } from "./registry";

/**
 * Call once at app startup to seed the registry with built-in commands.
 */
export function registerDefaultCommands(): void {
  // /layout — reset canvas to default grid layout
  registerCommand({
    name: "/layout",
    description: "Сбросить раскладку фреймов",
    handler: (_args: string, ctx: CommandContext): boolean => {
      ctx.replaceComponents([]);
      ctx.resetViewport();
      return true;
    },
  });

  // /clear — clear all frames from canvas
  registerCommand({
    name: "/clear",
    description: "Очистить канвас",
    handler: (_args: string, ctx: CommandContext): boolean => {
      ctx.replaceComponents([]);
      return true;
    },
  });

  // /reset — reset viewport to origin
  registerCommand({
    name: "/reset",
    description: "Сбросить камеру к началу",
    handler: (_args: string, ctx: CommandContext): boolean => {
      ctx.resetViewport();
      return true;
    },
  });

  // /help — show help frame
  registerCommand({
    name: "/help",
    description: "Показать справку",
    handler: (_args: string, ctx: CommandContext): boolean => {
      ctx.replaceComponents([
        {
          id: `help-${Date.now()}`,
          type: "window",
          title: "Справка",
          content: [
            "Команды Harkly:",
            "",
            "/layout — сбросить раскладку",
            "/clear — очистить канвас",
            "/reset — сбросить камеру",
            "/help — эта справка",
            "",
            "Горячие клавиши:",
            "Ctrl+K — Omnibar",
            "Ctrl+S — сохранить",
            "Ctrl+0 — сбросить масштаб",
            "Ctrl+Alt+↑↓ — этажи",
          ].join("\n"),
          width: 360,
          height: 320,
          x: 200,
          y: 200,
        },
      ]);
      ctx.resetViewport();
      return true;
    },
  });
}
