import { Component } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

const DIVIDER = "#E0CFA9";

const RawData: Component<{ data: FrameData }> = () => {
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
                <span class="text-sm font-bold text-h-text-1">
                    Сырые данные
                </span>
                <span
                    class="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider"
                    style={{
                        background: "rgba(30,62,160,0.08)",
                        color: "#1E3EA0",
                        border: "1px solid rgba(30,62,160,0.2)",
                    }}
                >
                    <span
                        class="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: "#1E3EA0" }}
                    />
                    Сбор...
                </span>
            </div>

            {/* Body */}
            <div class="flex flex-col flex-1 overflow-y-auto px-5 py-4 gap-3">
                {/* Skeleton lines */}
                <div
                    class="h-8 w-full rounded"
                    style={{
                        background:
                            "linear-gradient(90deg, #EDE0C4 0%, #E0CFA9 50%, #EDE0C4 100%)",
                        "background-size": "200% 100%",
                        opacity: "0.7",
                    }}
                />
                <div
                    class="h-8 w-4/5 rounded"
                    style={{
                        background:
                            "linear-gradient(90deg, #EDE0C4 0%, #E0CFA9 50%, #EDE0C4 100%)",
                        "background-size": "200% 100%",
                        opacity: "0.6",
                    }}
                />
                <div
                    class="h-8 w-full rounded"
                    style={{
                        background:
                            "linear-gradient(90deg, #EDE0C4 0%, #E0CFA9 50%, #EDE0C4 100%)",
                        "background-size": "200% 100%",
                        opacity: "0.5",
                    }}
                />
                <div
                    class="h-8 w-3/5 rounded"
                    style={{
                        background:
                            "linear-gradient(90deg, #EDE0C4 0%, #E0CFA9 50%, #EDE0C4 100%)",
                        "background-size": "200% 100%",
                        opacity: "0.4",
                    }}
                />

                {/* Status text */}
                <div class="mt-auto pt-4 flex flex-col gap-1">
                    <span class="text-xs text-h-text-3">
                        47 документов из 4 источников
                    </span>
                    <span
                        class="text-xs text-h-text-3"
                        style={{ "font-style": "italic" }}
                    >
                        Нормализация и дедупликация...
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RawData;
