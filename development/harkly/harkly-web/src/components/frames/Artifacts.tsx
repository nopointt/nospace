import { Component, For } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

const DIVIDER = "#E0CFA9";

const ARTIFACT_TYPES = [
    { label: "Empathy Map", iconPath: "users", color: "#6B4C9A" },
    { label: "Fact Pack", iconPath: "package", color: "#1E3EA0" },
    { label: "Journey Map", iconPath: "map", color: "#2D7D46" },
    { label: "Evidence Map", iconPath: "layers", color: "#B8860B" },
];

const IconUsers = (p: { color: string }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={p.color}
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const IconPackage = (p: { color: string }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={p.color}
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
);

const IconMap = (p: { color: string }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={p.color}
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
);

const IconLayers = (p: { color: string }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={p.color}
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
    </svg>
);

function renderIcon(iconPath: string, color: string) {
    switch (iconPath) {
        case "users":
            return <IconUsers color={color} />;
        case "package":
            return <IconPackage color={color} />;
        case "map":
            return <IconMap color={color} />;
        default:
            return <IconLayers color={color} />;
    }
}

const Artifacts: Component<{ data: FrameData }> = () => {
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
                class="flex items-center px-5 py-3 shrink-0"
                style={{
                    background: "#EDE0C4",
                    "border-bottom": `1px solid ${DIVIDER}`,
                }}
            >
                <span class="text-sm font-bold text-h-text-1">Артефакты</span>
            </div>

            {/* 2x2 Grid */}
            <div class="flex-1 overflow-y-auto p-4">
                <div class="grid grid-cols-2 gap-3 h-full">
                    <For each={ARTIFACT_TYPES}>
                        {(artifact) => (
                            <button
                                class="flex flex-col items-center justify-center gap-2.5 rounded-lg p-4 transition-all text-left"
                                style={{
                                    background: "#F5EDD8",
                                    border: "1px solid #E8DDD0",
                                }}
                                onMouseEnter={(e) => {
                                    const b =
                                        e.currentTarget as HTMLButtonElement;
                                    b.style.background = "#EDE0C4";
                                    b.style.borderColor = "#C6C6C6";
                                }}
                                onMouseLeave={(e) => {
                                    const b =
                                        e.currentTarget as HTMLButtonElement;
                                    b.style.background = "#F5EDD8";
                                    b.style.borderColor = "#E8DDD0";
                                }}
                            >
                                <div
                                    class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                    style={{
                                        background: `${artifact.color}12`,
                                        border: `1px solid ${artifact.color}22`,
                                    }}
                                >
                                    {renderIcon(
                                        artifact.iconPath,
                                        artifact.color
                                    )}
                                </div>
                                <span class="text-[12px] font-semibold text-h-text-1 text-center leading-tight">
                                    {artifact.label}
                                </span>
                            </button>
                        )}
                    </For>
                </div>
            </div>
        </div>
    );
};

export default Artifacts;
