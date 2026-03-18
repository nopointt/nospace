import { Component, createSignal, For, Show, onCleanup } from 'solid-js';

interface BranchPillProps {
    branchName: () => string;
    branches: () => string[];
    onSelectBranch: (name: string) => void;
    onCreateBranch: () => void;
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

const BranchPill: Component<BranchPillProps> = (props) => {
    const [open, setOpen] = createSignal(false);

    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-branch-dropdown]')) {
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
        <div class="relative" data-branch-dropdown>
            <button
                type="button"
                onClick={toggle}
                class="flex items-center gap-1.5 h-7 px-3 bg-h-surface rounded-full ring-1 ring-black/10 shadow-sm text-h-text-2 hover:bg-h-hover transition-colors cursor-pointer select-none"
                title="Ветка исследования"
            >
                <span class="text-[11px] font-sans leading-none whitespace-nowrap">
                    {props.branchName()}
                </span>
                <ChevronDown />
            </button>

            <Show when={open()}>
                <div class="absolute top-9 right-0 w-52 bg-h-surface rounded-lg ring-1 ring-h-border-s shadow-lg overflow-hidden z-[999]">
                    <For each={props.branches()}>
                        {(branch) => (
                            <button
                                type="button"
                                onClick={() => {
                                    props.onSelectBranch(branch);
                                    setOpen(false);
                                    document.removeEventListener('click', handleClickOutside);
                                }}
                                class={`w-full flex items-center gap-3 px-3 py-2 text-left cursor-pointer transition-colors ${
                                    branch === props.branchName()
                                        ? 'bg-h-elevated text-h-text-1 font-medium'
                                        : 'text-h-text-2 hover:bg-h-hover'
                                }`}
                            >
                                <span class="text-[12px]">{branch}</span>
                            </button>
                        )}
                    </For>
                    <div class="border-t border-h-border-s">
                        <button
                            type="button"
                            onClick={() => {
                                props.onCreateBranch();
                                setOpen(false);
                                document.removeEventListener('click', handleClickOutside);
                            }}
                            class="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer text-h-blue hover:bg-h-hover transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            <span class="text-[12px]">Новая ветка</span>
                        </button>
                    </div>
                </div>
            </Show>
        </div>
    );
};

export default BranchPill;
