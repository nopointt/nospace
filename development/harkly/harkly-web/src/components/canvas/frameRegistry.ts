import type { Component } from "solid-js";
import type { FrameData } from "~/lib/canvas/types";

// System frames
import WindowFrame from "~/components/frames/WindowFrame";
import TextFrame from "~/components/frames/TextFrame";
import PanelFrame from "~/components/frames/PanelFrame";
import ErrorFrame from "~/components/frames/ErrorFrame";

// Harkly frames
import SourceCard from "~/components/frames/SourceCard";
import Insights from "~/components/frames/Insights";
import Notebook from "~/components/frames/Notebook";
import RawData from "~/components/frames/RawData";
import Artifacts from "~/components/frames/Artifacts";
import CollectionPlan from "~/components/frames/CollectionPlan";
import FramingStudio from "~/components/frames/FramingStudio";

export const FRAME_REGISTRY: Record<string, Component<{ data: FrameData }>> = {
    // System
    window: WindowFrame,
    text: TextFrame,
    panel: PanelFrame,
    error: ErrorFrame,

    // Harkly research frames
    "source-card": SourceCard,
    insights: Insights,
    notebook: Notebook,
    "raw-data": RawData,
    artifacts: Artifacts,
    "collection-plan": CollectionPlan,
    "framing-studio": FramingStudio,
};
