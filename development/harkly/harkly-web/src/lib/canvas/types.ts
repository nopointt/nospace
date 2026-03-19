// Canvas types for Harkly Web
// Ported from harkly-shell, cleaned of kernel/tLOS-specific types

export interface FramePosition {
    x: number;
    y: number;
    width: number;
    height: number;
    isPinned: boolean;
}

export interface FrameData {
    id: string;
    type:
        | "window"
        | "text"
        | "panel"
        | "framing-studio"
        | "collection-plan"
        | "source-card"
        | "raw-data"
        | "insights"
        | "artifacts"
        | "notebook"
        | "error";
    title?: string;
    content?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    floor?: number;
    branch?: string;
    isPinned?: boolean;
    preSnapState?: FramePosition;
    attachedTo?: string;
    dockedTo?: string;
    color?: string;
}

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

export interface SnapPreview {
    x: number;
    y: number;
    w: number;
    h: number;
    needsPin?: boolean;
    attachedTo?: string;
    dockedTo?: string;
}

export interface GroupRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface GroupTransform {
    leaderId: string;
    sx: number;
    sy: number;
    lx: number;
    ly: number;
    leaderInitial: GroupRect;
}
