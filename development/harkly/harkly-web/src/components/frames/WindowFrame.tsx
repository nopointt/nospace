import { Component } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

const WindowFrame: Component<{ data: FrameData }> = (props) => (
    <div class="p-4 h-full overflow-auto text-sm font-mono text-h-text-2 leading-relaxed whitespace-pre-wrap bg-h-canvas">
        {props.data.content}
    </div>
);

export default WindowFrame;
