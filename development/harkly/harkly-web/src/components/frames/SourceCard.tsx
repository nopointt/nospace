import { Component, JSX } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

// -- Icon components (inline SVG, 16x16 white) --

const IconUpload = (): JSX.Element => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const IconMessageCircle = (): JSX.Element => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const IconFileText = (): JSX.Element => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);

const IconHeadphones = (): JSX.Element => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
);

const IconGlobe = (): JSX.Element => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const IconSearch = (): JSX.Element => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#8E8E8E"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

// -- Source variant definitions --

type StatusKind = "connected" | "warning" | "disconnected";

interface SourceVariant {
    description: string;
    iconBg: string;
    icon: () => JSX.Element;
    statusKind: StatusKind;
    statusText: string;
    queryText: string;
}

const SOURCES: Record<string, SourceVariant> = {
    "Загрузка файлов": {
        description: "PDF, DOCX, аудио, видео",
        iconBg: "#1E3EA0",
        icon: IconUpload,
        statusKind: "connected",
        statusText: "Подключено · 12 файлов · 5 мин назад",
        queryText: "Семантический поиск · отток, retention, онбординг",
    },
    "Telegram каналы": {
        description: "Мониторинг каналов",
        iconBg: "#229ED9",
        icon: IconMessageCircle,
        statusKind: "connected",
        statusText: "Подключено · 3 канала · 5 мин назад",
        queryText: "отток OR retention · 3 канала · 3 мес",
    },
    "Транскрипты": {
        description: "Zoom, аудио, расшифровки",
        iconBg: "#6B4C9A",
        icon: IconFileText,
        statusKind: "connected",
        statusText: "Подключено · 8 транскриптов · 5 мин назад",
        queryText: "Семантический поиск · причины ухода, churn signals",
    },
    "Тикеты поддержки": {
        description: "Zendesk, Intercom",
        iconBg: "#F2C200",
        icon: IconHeadphones,
        statusKind: "warning",
        statusText: "Требуется авторизация · 3д назад",
        queryText: "NLP сканирование · тег 'отток' · 90 дней",
    },
    "vc.ru": {
        description: "Статьи и комментарии",
        iconBg: "#C6C6C6",
        icon: IconGlobe,
        statusKind: "disconnected",
        statusText: "Не подключен",
        queryText: "retention SaaS, отток пользователей · все категории",
    },
    Habr: {
        description: "Технические статьи",
        iconBg: "#C6C6C6",
        icon: IconGlobe,
        statusKind: "disconnected",
        statusText: "Не подключен",
        queryText: "churn analysis, user retention · технические",
    },
};

const DEFAULT_VARIANT = SOURCES["Загрузка файлов"];

function statusDotColor(kind: StatusKind): string {
    if (kind === "warning") return "#F2C200";
    if (kind === "disconnected") return "#C6C6C6";
    return "#2D7D46";
}

function statusTextColor(kind: StatusKind): string {
    if (kind === "warning") return "#B8860B";
    if (kind === "disconnected") return "#8E8E8E";
    return "#555555";
}

function statusFontWeight(kind: StatusKind): string {
    return kind === "warning" ? "500" : "400";
}

// -- Component --

const SourceCard: Component<{ data: FrameData }> = (props) => {
    const title = () => props.data.title ?? "";
    const variant = () => SOURCES[title()] ?? DEFAULT_VARIANT;

    return (
        <div
            class="flex flex-col h-full overflow-hidden"
            style={{
                gap: "12px",
                padding: "16px",
                "font-family": "Inter, sans-serif",
            }}
        >
            {/* Header row */}
            <div
                class="flex items-center"
                style={{ gap: "12px", width: "100%" }}
            >
                <div
                    style={{
                        width: "32px",
                        height: "32px",
                        "border-radius": "8px",
                        background: variant().iconBg,
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                        "flex-shrink": "0",
                    }}
                >
                    {variant().icon()}
                </div>

                <div
                    class="flex flex-col min-w-0"
                    style={{ gap: "2px", flex: "1" }}
                >
                    <span
                        style={{
                            "font-size": "14px",
                            "font-weight": "600",
                            color: "#1C1C1C",
                            "line-height": "1.2",
                            overflow: "hidden",
                            "text-overflow": "ellipsis",
                            "white-space": "nowrap",
                        }}
                    >
                        {title() || variant().description}
                    </span>
                    <span
                        style={{
                            "font-size": "12px",
                            "font-weight": "400",
                            color: "#8E8E8E",
                            "line-height": "1.2",
                        }}
                    >
                        {variant().description}
                    </span>
                </div>
            </div>

            {/* Status row */}
            <div class="flex items-center" style={{ gap: "8px" }}>
                <span
                    style={{
                        width: "8px",
                        height: "8px",
                        "border-radius": "4px",
                        background: statusDotColor(variant().statusKind),
                        "flex-shrink": "0",
                    }}
                />
                <span
                    style={{
                        "font-size": "11px",
                        "font-weight": statusFontWeight(
                            variant().statusKind
                        ),
                        color: statusTextColor(variant().statusKind),
                    }}
                >
                    {variant().statusText}
                </span>
            </div>

            {/* Query row */}
            <div class="flex items-center" style={{ gap: "8px" }}>
                <IconSearch />
                <span
                    style={{
                        "font-size": "10px",
                        "font-weight": "400",
                        color: "#8E8E8E",
                        overflow: "hidden",
                        "text-overflow": "ellipsis",
                        "white-space": "nowrap",
                    }}
                >
                    {variant().queryText}
                </span>
            </div>
        </div>
    );
};

export default SourceCard;
