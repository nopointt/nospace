import { Component } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

const TextFrame: Component<{ data: FrameData }> = (props) => (
    <div class="p-4 h-full text-h-text-1 font-mono text-lg bg-h-canvas">
        {props.data.content}
    </div>
);

export default TextFrame;
