import { Component, For } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

const DIVIDER = "#E0CFA9";

const INSIGHTS = [
    {
        text: "Онбординг слишком сложный",
        count: 12,
        source: "транскрипты",
        sourceColor: "#6B4C9A",
    },
    {
        text: "Нет персонализации",
        count: 8,
        source: "тикеты",
        sourceColor: "#F2C200",
    },
    {
        text: "Ценность непонятна",
        count: 6,
        source: "интервью",
        sourceColor: "#1E3EA0",
    },
];

function pluralizeMentions(count: number): string {
    if (count === 1) return "упоминание";
    if (count < 5) return "упоминания";
    return "упоминаний";
}

const Insights: Component<{ data: FrameData }> = () => {
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
                <span class="text-sm font-bold text-h-text-1">Инсайты</span>
                <span
                    class="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wider"
                    style={{
                        background: "#EAF4EB",
                        color: "#2D7D46",
                        border: "1px solid rgba(45,125,70,0.2)",
                    }}
                >
                    3 найдено
                </span>
            </div>

            {/* Insight cards */}
            <div class="flex flex-col flex-1 overflow-y-auto px-5 py-4 gap-3">
                <For each={INSIGHTS}>
                    {(insight) => (
                        <div
                            class="flex flex-col gap-2 rounded-lg p-3"
                            style={{
                                background: "#F5EDD8",
                                border: "1px solid #E8DDD0",
                            }}
                        >
                            <div class="flex items-start justify-between gap-3">
                                <span class="text-[13px] font-medium text-h-text-1 leading-snug">
                                    {insight.text}
                                </span>
                                <span
                                    class="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                                    style={{
                                        background: "#EDE0C4",
                                        color: "#555555",
                                    }}
                                >
                                    {insight.count}
                                </span>
                            </div>

                            <div class="flex items-center gap-2">
                                <span
                                    class="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold"
                                    style={{
                                        background: `${insight.sourceColor}18`,
                                        color: insight.sourceColor,
                                        border: `1px solid ${insight.sourceColor}28`,
                                    }}
                                >
                                    {insight.source}
                                </span>
                                <span class="text-[11px] text-h-text-3">
                                    {insight.count}{" "}
                                    {pluralizeMentions(insight.count)}
                                </span>
                            </div>
                        </div>
                    )}
                </For>
            </div>
        </div>
    );
};

export default Insights;
