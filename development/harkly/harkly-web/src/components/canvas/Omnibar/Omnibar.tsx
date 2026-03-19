import {
  Component,
  createSignal,
  onMount,
  onCleanup,
  Show,
} from "solid-js";
import OmnibarInput from "./OmnibarInput";
import { executeCommand } from "~/lib/commands/registry";
import { registerDefaultCommands } from "~/lib/commands/defaults";
import type { CommandContext } from "~/lib/commands/registry";
import type { FrameData } from "~/lib/canvas/types";

interface OmnibarProps {
  replaceComponents: (frames: FrameData[]) => void;
  resetViewport: () => void;
}

const Omnibar: Component<OmnibarProps> = (props) => {
  const [visible, setVisible] = createSignal(false);
  const [input, setInput] = createSignal("");

  // Register commands once
  onMount(() => {
    registerDefaultCommands();
  });

  // Cmd+K / Ctrl+K toggle
  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setVisible((p) => !p);
      }
      if (e.key === "Escape" && visible()) {
        setVisible(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  const handleSend = () => {
    const cmd = input().trim();
    if (!cmd) return;

    const ctx: CommandContext = {
      replaceComponents: props.replaceComponents,
      resetViewport: props.resetViewport,
    };

    // Try to execute as a registered command
    const handled = executeCommand(cmd, "", ctx);
    if (handled) {
      setInput("");
      return;
    }

    // If not a command, just clear input (no kernel in web version)
    setInput("");
  };

  return (
    <Show when={visible()}>
      <div class="fixed bottom-6 left-6 z-[1000]">
        <div class="w-[320px] bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
          <OmnibarInput
            input={input}
            setInput={setInput}
            onSend={handleSend}
          />
        </div>
      </div>
    </Show>
  );
};

export default Omnibar;
