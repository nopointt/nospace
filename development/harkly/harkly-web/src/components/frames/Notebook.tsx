import { Component, createSignal } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

const DIVIDER = "#E0CFA9";

const Notebook: Component<{ data: FrameData }> = () => {
    const [notes, setNotes] = createSignal("");

    return (
        <div
            class="flex flex-col h-full overflow-hidden"
            style={{
                background: "#FFF8E7",
                color: "#1C1C1C",
                "font-family": "Inter, sans-serif",
            }}
        >
            {/* Header */}
            <div
                class="flex items-center justify-between px-5 py-3 shrink-0"
                style={{
                    background: "#EDE0C4",
                    "border-bottom": `1px solid ${DIVIDER}`,
                }}
            >
                <span class="text-sm font-bold text-h-text-1">Блокнот</span>
                <span
                    class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                        background: "#F5EDD8",
                        color: "#555555",
                        border: "1px solid #E8DDD0",
                    }}
                >
                    <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M8 2v12M2 8h12"
                            stroke="#8E8E8E"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                    </svg>
                    Branch 1
                </span>
            </div>

            {/* Textarea area */}
            <div class="flex flex-col flex-1 overflow-hidden px-5 py-4 gap-3">
                <textarea
                    class="flex-1 resize-none rounded-lg p-3 text-[13px] leading-relaxed text-h-text-1 outline-none transition-colors"
                    style={{
                        background: "#F5EDD8",
                        border: "1px solid #E8DDD0",
                        "font-family": "Inter, sans-serif",
                    }}
                    placeholder="Заметки по исследованию..."
                    value={notes()}
                    onInput={(e) => setNotes(e.currentTarget.value)}
                    onFocus={(e) => {
                        (
                            e.currentTarget as HTMLTextAreaElement
                        ).style.borderColor = "#C6C6C6";
                    }}
                    onBlur={(e) => {
                        (
                            e.currentTarget as HTMLTextAreaElement
                        ).style.borderColor = "#E8DDD0";
                    }}
                />

                <p class="text-[11px] text-h-text-3 text-center">
                    Рабочий стол — записывайте наблюдения по ходу работы
                </p>
            </div>
        </div>
    );
};

export default Notebook;
