import { Component, Show, For, createSignal, createMemo } from "solid-js";
import type { Accessor, Setter } from "solid-js";
import { listCommands } from "~/lib/commands/registry";

interface OmnibarInputProps {
  input: Accessor<string>;
  setInput: Setter<string>;
  onSend: () => void;
}

const OmnibarInput: Component<OmnibarInputProps> = (props) => {
  const [selectedIdx, setSelectedIdx] = createSignal(0);
  const [showAutocomplete, setShowAutocomplete] = createSignal(false);
  const [isFocused, setIsFocused] = createSignal(false);

  const filteredCommands = createMemo(() => {
    const trimmed = props.input().trim().toLowerCase();
    if (trimmed.length === 0) return [];
    const commands = listCommands();
    return commands.filter(
      (cmd) => cmd.name.startsWith(trimmed) && cmd.name !== trimmed,
    );
  });

  const shouldShowAutocomplete = createMemo(
    () =>
      isFocused() && showAutocomplete() && filteredCommands().length > 0,
  );

  const acceptAutocomplete = (name: string) => {
    props.setInput(name);
    setShowAutocomplete(false);
    setSelectedIdx(0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const cmds = filteredCommands();

    if (shouldShowAutocomplete()) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((p) => Math.min(p + 1, cmds.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((p) => Math.max(p - 1, 0));
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const selected = cmds[selectedIdx()];
        if (selected) acceptAutocomplete(selected.name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setShowAutocomplete(false);
      props.onSend();
    }
  };

  const handleInput = (
    e: InputEvent & { currentTarget: HTMLInputElement },
  ) => {
    props.setInput(e.currentTarget.value);
    setShowAutocomplete(true);
    setSelectedIdx(0);
  };

  return (
    <div class="relative p-3">
      {/* Autocomplete dropdown */}
      <Show when={shouldShowAutocomplete()}>
        <div class="absolute bottom-full left-3 right-3 mb-1 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden z-10">
          <For each={filteredCommands()}>
            {(cmd, idx) => (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  acceptAutocomplete(cmd.name);
                }}
                class="w-full flex items-center justify-between px-3 py-2 text-left font-mono text-sm transition-colors"
                classList={{
                  "bg-orange-50 text-orange-600": idx() === selectedIdx(),
                  "text-neutral-700 hover:bg-neutral-50":
                    idx() !== selectedIdx(),
                }}
              >
                <span class="font-semibold">{cmd.name}</span>
                <span
                  class="text-xs"
                  classList={{
                    "text-orange-400": idx() === selectedIdx(),
                    "text-neutral-400": idx() !== selectedIdx(),
                  }}
                >
                  {cmd.description}
                </span>
              </button>
            )}
          </For>
        </div>
      </Show>

      <div class="flex items-center gap-2">
        <input
          type="text"
          value={props.input()}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            setShowAutocomplete(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            setShowAutocomplete(false);
          }}
          placeholder="Команда или поиск..."
          class="flex-1 bg-transparent border-none outline-none text-sm font-mono text-neutral-800 placeholder:text-neutral-400 caret-orange-500"
        />
        <button
          onClick={props.onSend}
          class="bg-orange-500 hover:bg-orange-600 w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0"
        >
          <svg
            class="w-4 h-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default OmnibarInput;
