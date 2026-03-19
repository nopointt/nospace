import { Component } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

const PanelFrame: Component<{ data: FrameData }> = (props) => (
    <div class="p-4 h-full overflow-auto bg-h-canvas">
        <div class="text-sm text-h-text-2">
            {props.data.content || "Empty panel"}
        </div>
    </div>
);

export default PanelFrame;
