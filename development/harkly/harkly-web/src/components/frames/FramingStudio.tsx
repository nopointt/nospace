import { Component, createSignal, For } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

// --- Framework data ---

interface FrameworkDef {
    id: string;
    label: string;
    rows: { badge: string; value: string }[];
}

const FRAMEWORKS: FrameworkDef[] = [
    {
        id: "jtbd",
        label: "JTBD",
        rows: [
            {
                badge: "Когда",
                value: "мне нужно понять, почему B2B PM-ы избегают клиентских исследований",
            },
            {
                badge: "Хочу",
                value: "выяснить конкретные барьеры: время, инструменты, навыки",
            },
            {
                badge: "Чтобы",
                value: "спроектировать фичи, которые устраняют реальные блокеры",
            },
        ],
    },
    {
        id: "spice",
        label: "SPICE",
        rows: [
            {
                badge: "Setting",
                value: "B2B SaaS компании, продуктовые команды 3-15 человек",
            },
            {
                badge: "Perspective",
                value: "Продакт-менеджеры с опытом 1-5 лет",
            },
            {
                badge: "Intervention",
                value: "Автоматизация сбора и анализа качественных данных",
            },
            {
                badge: "Comparison",
                value: "Текущий процесс: ручной сбор в Notion + Excel",
            },
            {
                badge: "Evaluation",
                value: "Время от вопроса до инсайта, количество источников",
            },
        ],
    },
    {
        id: "peo",
        label: "PEO",
        rows: [
            {
                badge: "Population",
                value: "B2B продакт-менеджеры в RU, избегающие исследований",
            },
            {
                badge: "Exposure",
                value: "Отсутствие единого инструмента для мульти-источниковых исследований",
            },
            {
                badge: "Outcome",
                value: "Решения на основе интуиции -> неверные приоритеты",
            },
        ],
    },
    {
        id: "issue-tree",
        label: "Issue Tree",
        rows: [
            {
                badge: "Корень",
                value: "Почему PM-ы не проводят клиентские исследования?",
            },
            {
                badge: "Ветка 1",
                value: "Нет времени -> слишком долго собирать данные вручную",
            },
            {
                badge: "Ветка 2",
                value: "Нет инструментов -> данные разбросаны по 4-6 сервисам",
            },
            {
                badge: "Ветка 3",
                value: "Нет навыков -> не знают как анализировать качественные данные",
            },
            {
                badge: "Ветка 4",
                value: "Нет ценности -> руководство не видит ROI",
            },
        ],
    },
    {
        id: "finer",
        label: "FINER",
        rows: [
            {
                badge: "Feasible",
                value: "Выборка 100 PM — пограничная для качественного исследования",
            },
            {
                badge: "Interesting",
                value: "Отток влияет на North Star метрику (retention)",
            },
            {
                badge: "Novel",
                value: "Данных по этой когорте ранее не собирали",
            },
            {
                badge: "Ethical",
                value: "Участие добровольное, данные анонимизированы",
            },
            {
                badge: "Relevant",
                value: "Результаты идут в roadmap Q2 2026",
            },
        ],
    },
];

const QUESTION =
    "Почему B2B продакт-менеджеры испытывают трудности с клиентскими исследованиями?";

function resolveInitialFramework(content: string | undefined): string {
    if (!content) return "jtbd";
    const found = FRAMEWORKS.find((f) => f.id === content.toLowerCase());
    return found ? found.id : "jtbd";
}

// --- Sub-components ---

const Divider = () => (
    <div
        style={{
            height: "1px",
            background: "#E0CFA9",
            "flex-shrink": "0",
        }}
    />
);

const TableRow: Component<{ badge: string; value: string }> = (props) => (
    <div
        class="flex items-center"
        style={{ gap: "12px", padding: "10px 24px" }}
    >
        <div
            class="flex items-center justify-center shrink-0 font-semibold"
            style={{
                width: "64px",
                height: "24px",
                background: "#EDE0C4",
                "border-radius": "6px",
                "font-size": "10px",
                color: "#1E3EA0",
            }}
        >
            {props.badge}
        </div>
        <span
            class="flex-1 text-h-text-1"
            style={{
                "font-size": "13px",
                "font-weight": "400",
                "line-height": "1.5",
            }}
        >
            {props.value}
        </span>
    </div>
);

// --- Framework chip ---

interface ChipProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const FrameworkChip: Component<ChipProps> = (props) => {
    const activeStyle = {
        background: "#EDE0C4",
        "box-shadow": "none",
        "font-weight": "600",
        color: "#555555",
    };
    const inactiveStyle = {
        background: "transparent",
        "box-shadow": "inset 0 0 0 1px #E8DDD0",
        "font-weight": "400",
        color: "#555555",
    };

    return (
        <button
            onClick={props.onClick}
            class="flex items-center justify-center cursor-pointer border-none transition-all duration-200 ease-out"
            style={{
                height: "24px",
                padding: "0 8px",
                "border-radius": "4px",
                "font-size": "10px",
                "white-space": "nowrap",
                ...(props.isActive ? activeStyle : inactiveStyle),
            }}
        >
            {props.label}
        </button>
    );
};

// --- Main component ---

const FramingStudio: Component<{ data: FrameData }> = (props) => {
    const [activeId, setActiveId] = createSignal<string>(
        resolveInitialFramework(props.data.content)
    );
    const [expanded, setExpanded] = createSignal(false);

    const current = () => FRAMEWORKS.find((f) => f.id === activeId())!;

    function handleChipClick(fw: FrameworkDef) {
        if (fw.id === activeId()) {
            setExpanded((v) => !v);
            return;
        }

        if (!expanded()) {
            setActiveId(fw.id);
            setExpanded(true);
            return;
        }

        // Already expanded and user clicked a different chip -- spawn new frame
        window.dispatchEvent(
            new CustomEvent("harkly:spawn-frame", {
                detail: {
                    type: "framing-studio",
                    title: `Студия фрейминга · ${fw.label}`,
                    x: (props.data.x ?? 0) + (props.data.width ?? 544) + 40,
                    y: props.data.y ?? 0,
                    width: 544,
                    height: 480,
                    content: fw.id,
                },
            })
        );
    }

    return (
        <div class="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div
                class="flex flex-col shrink-0"
                style={{ padding: "20px 24px", gap: "6px" }}
            >
                <div
                    class="flex items-center justify-between"
                    style={{ gap: "8px" }}
                >
                    <span
                        class="text-h-text-1 shrink-0"
                        style={{
                            "font-size": "15px",
                            "font-weight": "600",
                        }}
                    >
                        Студия фрейминга
                    </span>

                    <div
                        class="flex items-center"
                        style={{ gap: "4px", overflow: "hidden" }}
                    >
                        <div
                            class="flex items-center transition-all duration-200 ease-out"
                            style={{
                                gap: "4px",
                                overflow: "hidden",
                                "max-width": expanded() ? "400px" : "0px",
                                opacity: expanded() ? "1" : "0",
                            }}
                        >
                            <For
                                each={FRAMEWORKS.filter(
                                    (f) => f.id !== activeId()
                                )}
                            >
                                {(fw) => (
                                    <FrameworkChip
                                        label={fw.label}
                                        isActive={false}
                                        onClick={() => handleChipClick(fw)}
                                    />
                                )}
                            </For>
                        </div>

                        <FrameworkChip
                            label={current().label}
                            isActive={true}
                            onClick={() => handleChipClick(current())}
                        />
                    </div>
                </div>

                <span
                    class="text-h-text-2"
                    style={{
                        "font-size": "13px",
                        "font-weight": "400",
                        "line-height": "1.5",
                    }}
                >
                    {QUESTION}
                </span>
            </div>

            <Divider />

            {/* Table */}
            <div class="flex flex-col flex-1 overflow-auto">
                <For each={current().rows}>
                    {(row) => (
                        <TableRow badge={row.badge} value={row.value} />
                    )}
                </For>
            </div>

            <Divider />

            {/* Footer */}
            <div
                class="flex items-center justify-end shrink-0"
                style={{ gap: "8px", padding: "16px 24px" }}
            >
                <button
                    class="flex items-center justify-center ring-1 ring-h-border bg-transparent border-none cursor-pointer rounded-lg"
                    style={{
                        height: "36px",
                        padding: "0 16px",
                        "font-size": "13px",
                        "font-weight": "500",
                        color: "#1C1C1C",
                    }}
                >
                    Уточнить
                </button>
                <button
                    class="flex items-center justify-center border-none cursor-pointer rounded-lg"
                    style={{
                        height: "36px",
                        padding: "0 16px",
                        background: "#1E3EA0",
                        "font-size": "13px",
                        "font-weight": "600",
                        color: "#FFFFFF",
                    }}
                >
                    Начать исследование
                </button>
            </div>
        </div>
    );
};

export default FramingStudio;
