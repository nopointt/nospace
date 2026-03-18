import { Component, createSignal, For, Show, onCleanup } from 'solid-js';
import { FLOORS } from '../hooks/useFloor';

interface FloorPillProps {
    floorName: () => string;
    currentFloor: () => number;
    onSelectFloor: (floor: number) => void;
}

const ChevronDown: Component = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const FloorPill: Component<FloorPillProps> = (props) => {
    const [open, setOpen] = createSignal(false);

    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-floor-dropdown]')) {
            setOpen(false);
        }
    };

    const toggle = () => {
        const next = !open();
        setOpen(next);
        if (next) {
            setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
        } else {
            document.removeEventListener('click', handleClickOutside);
        }
    };

    onCleanup(() => document.removeEventListener('click', handleClickOutside));

    return (
        <div class="relative" data-floor-dropdown>
            <button
                type="button"
                onClick={toggle}
                class="flex items-center gap-1.5 h-7 px-3 bg-h-surface rounded-full ring-1 ring-black/10 shadow-sm text-h-text-2 hover:bg-h-hover transition-colors cursor-pointer select-none"
                title="Этаж"
            >
                <span class="text-[11px] font-sans leading-none whitespace-nowrap">
                    {props.floorName()}
                </span>
                <ChevronDown />
            </button>

            <Show when={open()}>
                <div class="absolute top-9 right-0 w-48 bg-h-surface rounded-lg ring-1 ring-h-border-s shadow-lg overflow-hidden z-[999]">
                    <For each={FLOORS}>
                        {(floor) => (
                            <button
                                type="button"
                                onClick={() => {
                                    props.onSelectFloor(floor.id);
                                    setOpen(false);
                                    document.removeEventListener('click', handleClickOutside);
                                }}
                                class={`w-full flex items-center gap-3 px-3 py-2 text-left cursor-pointer transition-colors ${
                                    floor.id === props.currentFloor()
                                        ? 'bg-h-elevated text-h-text-1 font-medium'
                                        : 'text-h-text-2 hover:bg-h-hover'
                                }`}
                            >
                                <span class="text-[10px] font-mono text-h-text-3 w-5">F{floor.id}</span>
                                <span class="text-[12px]">{floor.name}</span>
                            </button>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};

export default FloorPill;
