export interface UUPComponent {
    id: string;
    type: "panel" | "label" | "button" | "spatial_map";
    style?: Record<string, any>;
    text?: string;
    label?: string;
    layout?: "vertical" | "horizontal" | "grid";
    children?: UUPComponent[];
    action?: { intent: string; params: any };
}

export interface ChatMessage {
    role: "user" | "ai";
    content: string;
    timestamp: number;
}

export interface LatticeStatus {
    nats: boolean;
    spatial: boolean;
    assembly: boolean;
    shaper: boolean;
    lattice: boolean;
}

export interface FramePosition {
    x: number; y: number; width: number; height: number; isPinned: boolean;
}

export interface AgentConfig {
    agentBin: string;
    agentId: string;
    label: string;
    color: string;
}

export const AVAILABLE_AGENTS: AgentConfig[] = [
    { agentBin: "claude", agentId: "claude", label: "Claude", color: "text-h-blue" },
];

export interface FrameData {
    id: string;
    type: "window" | "text" | "button" | "chat" | "panel"
        | "math-worker" | "echo-worker"
        | "text-editor" | "terminal" | "file-browser" | "notes"
        | "image-viewer" | "diff-viewer"
        | "omnibar" | "agent-console" | "identity"
        | "mcb-strategy" | "mcb-seo" | "mcb-gap-detail"
        | "mcb-task-card" | "mcb-experiment" | "mcb-signal-brief"
        | "agent-status" | "memory-viewer" | "g3-session"
        | "kernel-status"
        | "help" | "system-status" | "dirizhyor-session"
        | "memory-admin" | "regulator-log"
        | "framing-studio" | "collection-plan" | "source-card"
        | "raw-data" | "insights" | "artifacts" | "notebook";
    title?: string;
    content?: string;
    filePath?: string;
    messages?: ChatMessage[];
    x?: number; y?: number;
    width?: number; height?: number;
    floor?: number;
    branch?: string;
    isPinned?: boolean;
    preSnapState?: FramePosition;
    attachedTo?: string;
    dockedTo?: string;
    color?: string;
    uup?: UUPComponent;
    actorId?: string;
    actorType?: string;
    agentBin?: string;
    pubkey?: string;
    npub?: string;
    did?: string;
}

export interface Viewport {
    x: number; y: number; zoom: number;
}

export interface SnapPreview {
    x: number; y: number; w: number; h: number;
    needsPin?: boolean;
    attachedTo?: string;
    dockedTo?: string;
}

export interface GroupRect {
    x: number; y: number; w: number; h: number;
}

export interface GroupTransform {
    leaderId: string;
    sx: number; sy: number;
    lx: number; ly: number;
    leaderInitial: GroupRect;
}

export type KernelMessageType =
    | 'status'
    | 'chat'
    | 'thought'
    | 'error'
    | 'panel'
    | 'clear'
    | 'remove'
    | 'actor:spawned'
    | 'actor:output'
    | 'actor:destroyed'
    | 'thinking'
    | 'agent:thinking'
    | 'agent:output'
    | 'fs:response'
    | 'fs:error'
    | 'shell:line'
    | 'shell:done'
    | 'shell:error'
    | 'identity';

export interface FsEntry {
    name: string;
    is_dir: boolean;
    size: number;
}

export interface FsResponseMessage {
    type: 'fs:response';
    requestId: string;
    action: 'list' | 'read' | 'write';
    path?: string;
    entries?: FsEntry[];
    content?: string;
    ok?: boolean;
    error?: string;
}

export interface ShellLineMessage {
    type: 'shell:line';
    frameId: string;
    line: string;
    stderr?: boolean;
}

export interface ShellDoneMessage {
    type: 'shell:done';
    frameId: string;
    exitCode: number;
}

export interface IdentityMessage {
    type: 'identity';
    pubkey: string;
    npub: string;
    did: string;
}

export interface KernelMessage {
    type: KernelMessageType;
    id?: string;
    content?: string;
    actorId?: string;
    payload?: unknown;
}
