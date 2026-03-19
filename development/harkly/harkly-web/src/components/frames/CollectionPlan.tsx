import { Component, For } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

const DIVIDER_COLOR = "#E0CFA9";

const CONCEPT_ROW_1 = ["отток", "retention", "онбординг", "1-я неделя"];
const CONCEPT_ROW_2 = ["причины ухода", "churn signals"];

const CollectionPlan: Component<{ data: FrameData }> = () => {
    return (
        <div
            class="flex flex-col h-full overflow-hidden"
            style={{ "font-family": "Inter, sans-serif" }}
        >
            {/* Header */}
            <div
                class="flex items-center justify-between shrink-0"
                style={{ height: "48px", padding: "0 16px" }}
            >
                <span
                    style={{
                        "font-size": "15px",
                        "font-weight": "600",
                        color: "#1C1C1C",
                        "line-height": "1",
                    }}
                >
                    План сбора
                </span>
                <span
                    style={{
                        background: "#EAF4EB",
                        "border-radius": "4px",
                        padding: "2px 8px",
                        display: "inline-flex",
                        "align-items": "center",
                        "justify-content": "center",
                        "font-size": "10px",
                        "font-weight": "600",
                        color: "#2D7D46",
                    }}
                >
                    Готов
                </span>
            </div>

            {/* Divider */}
            <div
                style={{
                    height: "1px",
                    background: DIVIDER_COLOR,
                    "flex-shrink": "0",
                }}
            />

            {/* Research question */}
            <div
                class="flex flex-col shrink-0"
                style={{ gap: "8px", padding: "12px 16px" }}
            >
                <span
                    style={{
                        "font-size": "11px",
                        "font-weight": "500",
                        color: "#8E8E8E",
                    }}
                >
                    Исследовательский вопрос
                </span>
                <p
                    style={{
                        "font-size": "13px",
                        "font-weight": "400",
                        color: "#1C1C1C",
                        "line-height": "1.5",
                        margin: "0",
                    }}
                >
                    Когда PM сталкивается с оттоком после первой недели, он
                    хочет понять причины, чтобы улучшить retention
                </p>
            </div>

            {/* Divider */}
            <div
                style={{
                    height: "1px",
                    background: DIVIDER_COLOR,
                    "flex-shrink": "0",
                }}
            />

            {/* Concepts */}
            <div
                class="flex flex-col shrink-0"
                style={{ gap: "8px", padding: "12px 16px" }}
            >
                <span
                    style={{
                        "font-size": "11px",
                        "font-weight": "500",
                        color: "#8E8E8E",
                    }}
                >
                    Концепты поиска
                </span>
                <div class="flex" style={{ gap: "8px", "flex-wrap": "wrap" }}>
                    <For each={CONCEPT_ROW_1}>
                        {(tag) => (
                            <span
                                style={{
                                    background: "#EDE0C4",
                                    "border-radius": "4px",
                                    padding: "4px 8px",
                                    "font-size": "11px",
                                    "font-weight": "500",
                                    color: "#555555",
                                }}
                            >
                                {tag}
                            </span>
                        )}
                    </For>
                </div>
                <div class="flex" style={{ gap: "8px", "flex-wrap": "wrap" }}>
                    <For each={CONCEPT_ROW_2}>
                        {(tag) => (
                            <span
                                style={{
                                    background: "#EDE0C4",
                                    "border-radius": "4px",
                                    padding: "4px 8px",
                                    "font-size": "11px",
                                    "font-weight": "500",
                                    color: "#555555",
                                }}
                            >
                                {tag}
                            </span>
                        )}
                    </For>
                </div>
            </div>

            {/* Divider */}
            <div
                style={{
                    height: "1px",
                    background: DIVIDER_COLOR,
                    "flex-shrink": "0",
                }}
            />

            {/* Footer */}
            <div
                class="flex items-center shrink-0"
                style={{ gap: "8px", padding: "12px 16px" }}
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle
                        cx="7"
                        cy="7"
                        r="6.5"
                        stroke="#2D7D46"
                        stroke-width="1.2"
                    />
                    <path
                        d="M4.5 7l2 2 3.5-3.5"
                        stroke="#2D7D46"
                        stroke-width="1.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
                <span
                    style={{
                        "font-size": "12px",
                        "font-weight": "400",
                        color: "#8E8E8E",
                    }}
                >
                    4 источника · 6 запросов
                </span>
            </div>
        </div>
    );
};

export default CollectionPlan;
