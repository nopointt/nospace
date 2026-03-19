import { Component } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

const ErrorFrame: Component<{ data: FrameData }> = (props) => (
    <div class="p-4 h-full flex flex-col items-center justify-center bg-h-canvas text-center">
        <div class="text-sm font-mono text-h-red mb-2">Error</div>
        <div class="text-xs font-mono text-h-text-3 max-w-[240px]">
            {props.data.content || "An unknown error occurred"}
        </div>
    </div>
);

export default ErrorFrame;
