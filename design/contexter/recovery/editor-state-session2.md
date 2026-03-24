# Editor State -- Session 2

Source: `68c6f7c0-5748-48da-af6a-e1a84aecc6a2.jsonl` (March 22, 2026)

This file contains both editor state snapshots from session 2.
The LAST state (State #2) represents the final known state of `contexter-ui.pen`.

---

## State #1 (Beginning of Session)

- **JSONL Line:** 80
- **Tool ID:** `toolu_01CMLNoJrdhbgnBujsFN95dz`
- **Size:** 38590 chars

## Currently active editor
- `new`

## Document State:
- No nodes are selected.


### Top-Level Nodes (58):

- `Kmkwm` (frame): 4.1 · upload:format-error [user visible]
- `Rbyyr` (frame): 5.5 · dash:empty [user visible]
- `BiAIX` (frame): 01 · Color System [outside viewport]
- `U3ePH` (frame): 02 · Typography System [outside viewport]
- `wEM5D` (frame): 03 · Spacing System [outside viewport]
- `yWYpR` (frame): 04 · Logofolio [outside viewport]
- `tYjKC` (frame): 05 · Component Library [outside viewport]
- `EASNP` (frame): 06 · Elevation + Borders [outside viewport]
- `FFRVH` (frame): 07 · Motion System [outside viewport]
- `xHYLt` (frame): 08 · State Machine [outside viewport]
- ... +48 others

### Reusable Components (11):
- `JND89`: Button/Primary
- `wlUN3`: Button/Secondary
- `oqBCN`: Button/Ghost
- `EYKbU`: Button/Danger
- `JTQb6`: Input/Default
- `9K6ma`: Badge/Processing
- `JTHAo`: Badge/Ready
- `WIOmX`: Badge/Error
- `tbd8x`: Badge/Pending
- `lRo74`: PipelineIndicator
- `YPAeU`: DropZone

# .pen File Schema

```typescript
/** Each key must be an existing theme axis, and each value must be one of the possible values for that axis. E.g. { 'device': 'phone' } */
export interface Theme {
  [key: string]: string;
}

/** To bind a variable to a property, set the property to the dollar-prefixed name of the variable! */
export type Variable = string;

export type NumberOrVariable = number | Variable;

/** Colors can be 8-digit RGBA hex strings (e.g. #AABBCCDD), 6-digit RGB hex strings (e.g. #AABBCC) or 3-digit RGB hex strings (e.g. #ABC which means #AABBCC). */
export type Color = string;

export type ColorOrVariable = Color | Variable;

export type BooleanOrVariable = boolean | Variable;

export type StringOrVariable = string | Variable;

export interface Layout {
  /** Enable flex layout. None means all children are absolutely positioned and will not be affected by layout properties. Frames default to horizontal, groups default to none. */
  layout?: "none" | "vertical" | "horizontal";
  /** The gap between children in the main axis direction. Defaults to 0. */
  gap?: NumberOrVariable;
  layoutIncludeStroke?: boolean;
  /** The Inside padding along the edge of the container */
  padding?:
    | /** The inside padding to all sides */ NumberOrVariable
    | /** The inside horizontal and vertical padding */ [
        NumberOrVariable,
        NumberOrVariable,
      ]
    | /** Top, Right, Bottom, Left padding */ [
        NumberOrVariable,
        NumberOrVariable,
        NumberOrVariable,
        NumberOrVariable,
      ];
  /** Control the justify alignment of the children along the main axis. Defaults to 'start'. */
  justifyContent?:
    | "start"
    | "center"
    | "end"
    | "space_between"
    | "space_around";
  /** Control the alignment of children along the cross axis. Defaults to 'start'. */
  alignItems?: "start" | "center" | "end";
}

/** SizingBehavior controls the dynamic layout size.
- fit_content: Use the combined size of all children for the container size. Fallback is used when there are no children.
- fill_container: Use the parent size for the container size. Fallback is used when the parent has no layout.
Optional number in parentheses (e.g., 'fit_content(100)') specifies the fallback size. */
export type SizingBehavior = string;

/** Position is relative to the parent object's position. X increases rightwards, Y increases downwards.
IMPORTANT: x and y are IGNORED when parent uses flexbox layout. */
export interface Position {
  x?: number;
  y?: number;
}

export interface Size {
  width?: NumberOrVariable | SizingBehavior;
  height?: NumberOrVariable | SizingBehavior;
}

export interface CanHaveRotation {
  /** Rotation is represented in degrees, measured counter-clockwise. */
  rotation?: NumberOrVariable;
}

export type BlendMode =
  | "normal"
  | "darken"
  | "multiply"
  | "linearBurn"
  | "colorBurn"
  | "light"
  | "screen"
  | "linearDodge"
  | "colorDodge"
  | "overlay"
  | "softLight"
  | "hardLight"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export type Fill =
  | ColorOrVariable
  | {
      type: "color";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      color: ColorOrVariable;
    }
  | {
      type: "gradient";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      gradientType?: "linear" | "radial" | "angular";
      opacity?: NumberOrVariable;
      /** Normalized to bounding box (default: 0.5,0.5). */
      center?: Position;
      /** Normalized to bounding box (default: 1,1). Linear: height sets gradient length, width is ignored. Radial/Angular: sets ellipse diameters. */
      size?: { width?: NumberOrVariable; height?: NumberOrVariable };
      /** Rotation in degrees, counterclockwise (0° up, 90° left, 180° down). */
      rotation?: NumberOrVariable;
      colors?: { color: ColorOrVariable; position: NumberOrVariable }[];
    }
  /** Image fill. Url needs to be a relative from the pen file, for example `../../file.png` or `./image.jpg` */
  | {
      type: "image";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      opacity?: NumberOrVariable;
      url: string;
      mode?: "stretch" | "fill" | "fit";
    }
  /** Grid of colors with bezier-interpolated edges. Row-major order. Adjust the points and handles to create complex gradients. Keep the points on the edges at their default position. */
  | {
      type: "mesh_gradient";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      opacity?: NumberOrVariable;
      columns?: number;
      rows?: number;
      /** Color per vertex. */
      colors?: ColorOrVariable[];
      /** columns * rows points in [0,1] normalized coordinates. */
      points?: (
        | /** Position with auto-generated handles. */ [number, number]
        | /** Position with optional bezier handles (relative offsets). Omitted handles are auto-generated. */ {
            position: [number, number];
            leftHandle?: [number, number];
            rightHandle?: [number, number];
            topHandle?: [number, number];
            bottomHandle?: [number, number];
          }
      )[];
    };

export type Fills = Fill | Fill[];

export interface Stroke {
  align?: "inside" | "center" | "outside";
  thickness?:
    | NumberOrVariable
    | {
        top?: NumberOrVariable;
        right?: NumberOrVariable;
        bottom?: NumberOrVariable;
        left?: NumberOrVariable;
      };
  join?: "miter" | "bevel" | "round";
  miterAngle?: NumberOrVariable;
  cap?: "none" | "round" | "square";
  dashPattern?: number[];
  fill?: Fills;
}

export type Effect =
  /** 'blur' type blurs the entire layer content */
  | { enabled?: BooleanOrVariable; type: "blur"; radius?: NumberOrVariable }
  /** 'background_blur' type blurs the background content behind the layer */
  | {
      enabled?: BooleanOrVariable;
      type: "background_blur";
      radius?: NumberOrVariable;
    }
  /** The drop shadow effect can be an inner or outer shadow, with adjustable offset, spread, blur, color and blend mode. */
  | {
      type: "shadow";
      enabled?: BooleanOrVariable;
      shadowType?: "inner" | "outer";
      offset?: { x: NumberOrVariable; y: NumberOrVariable };
      spread?: NumberOrVariable;
      blur?: NumberOrVariable;
      color?: ColorOrVariable;
      blendMode?: BlendMode;
    };

export type Effects = Effect | Effect[];

export interface CanHaveGraphics {
  stroke?: Stroke;
  fill?: Fills;
  effect?: Effects;
}

export interface CanHaveEffects {
  effect?: Effects;
}

/** Entities have unique identifiers. */
export interface Entity extends Position, CanHaveRotation {
  /** A unique string that MUST NOT contain slash (/) characters. If omitted, a unique ID will be generated automatically. */
  id: string;
  /** Optional name for the entity, used for display and identification purposes */
  name?: string;
  /** Optional context information about this object. */
  context?: string;
  /** Objects are not reusable by default. If an object is made reusable by setting this property to `true`, the object can be duplicated using `ref` objects. */
  reusable?: boolean;
  theme?: Theme;
  enabled?: BooleanOrVariable;
  opacity?: NumberOrVariable;
  flipX?: BooleanOrVariable;
  flipY?: BooleanOrVariable;
  metadata?: { type: string; [key: string]: any };
}

export interface Rectangleish extends Entity, Size, CanHaveGraphics {
  cornerRadius?:
    | NumberOrVariable
    | [NumberOrVariable, NumberOrVariable, NumberOrVariable, NumberOrVariable];
}

/** A rectangle is defined by its position and size. The position corresponds to the top-left corner. */
export interface Rectangle extends Rectangleish {
  type: "rectangle";
}

/** An ellipse is defined by its bounding rectangle's position and size. */
export interface Ellipse extends Entity, Size, CanHaveGraphics {
  type: "ellipse";
  /** Inner-to-outer radius ratio for ring shapes. 0 = solid, 1 = fully hollow. Default: 0. */
  innerRadius?: NumberOrVariable;
  /** Arc start angle in degrees, counter-clockwise from the right. Default: 0. */
  startAngle?: NumberOrVariable;
  /** Arc length in degrees from startAngle. Positive = counter-clockwise, negative = clockwise. Range: -360 to 360. Default: 360 (full ellipse). */
  sweepAngle?: NumberOrVariable;
}

/** A line is defined by its bounding rectangle's position and size. */
export interface Line extends Entity, Size, CanHaveGraphics {
  type: "line";
}

/** A regular polygon is defined by its bounding rectangle's position and size. */
export interface Polygon extends Entity, Size, CanHaveGraphics {
  type: "polygon";
  polygonCount?: NumberOrVariable;
  cornerRadius?: NumberOrVariable;
}

export interface Path extends Entity, Size, CanHaveGraphics {
  /** fillRule is used to determine which parts of the path are considered inside the shape to be filled. Default is 'nonzero'. */
  fillRule?: "nonzero" | "evenodd";
  /** SVG Path */
  geometry?: string;
  type: "path";
}

export interface TextStyle {
  fontFamily?: StringOrVariable;
  fontSize?: NumberOrVariable;
  fontWeight?: StringOrVariable;
  letterSpacing?: NumberOrVariable;
  fontStyle?: StringOrVariable;
  underline?: BooleanOrVariable;
  /** A multiplier that gets applied to the font size to determine spacing between lines. If not specified, uses the font's built-in line height. */
  lineHeight?: NumberOrVariable;
  textAlign?: "left" | "center" | "right" | "justify";
  textAlignVertical?: "top" | "middle" | "bottom";
  strikethrough?: BooleanOrVariable;
  href?: string;
}

export type TextContent = StringOrVariable | TextStyle[];

export interface Text extends Entity, Size, CanHaveGraphics, TextStyle {
  type: "text";
  content?: TextContent;
  /** textGrowth controls how the text box dimensions behave. It must be set before width or height can be used — without textGrowth, the width and height properties are ignored.
'auto': The text box automatically grows to fit the text content. Text does not wrap. Width and height adjust dynamically.
'fixed-width': The width is fixed and text wraps within it. The height grows automatically to fit the wrapped content.
'fixed-width-height': Both width and height are fixed. Text wraps and may be overflow if it exceeds the bounds.
IMPORTANT: Never set width or height without also setting textGrowth. If you want to control the size of a text box, you must set textGrowth first. */
  textGrowth?: "auto" | "fixed-width" | "fixed-width-height";
}

export interface CanHaveChildren {
  children?: Child[];
}

/** A frame is a rectangle that can have children. */
export interface Frame extends Rectangleish, CanHaveChildren, Layout {
  type: "frame";
  /** Visually clip content that overflows the frame bounds. Default is false. */
  clip?: BooleanOrVariable;
  placeholder?: boolean;
  /** The presence of this property indicates that this frame is a "slot" - which means that it is intended be customized with children in instances of the parent component. Each element of the array is an ID of a "recommended" reusable component, one which fits semantically as a child here (e.g. inside a menu bar, the content slot would recommend IDs of various menu item components). */
  slot?: string[];
}

export interface Group extends Entity, CanHaveChildren, CanHaveEffects, Layout {
  type: "group";
  width?: SizingBehavior;
  height?: SizingBehavior;
}

export interface Note extends Entity, Size, TextStyle {
  type: "note";
  content?: TextContent;
}

export interface Prompt extends Entity, Size, TextStyle {
  type: "prompt";
  content?: TextContent;
  model?: StringOrVariable;
}

export interface Context extends Entity, Size, TextStyle {
  type: "context";
  content?: TextContent;
}

/** Icon from a font */
export interface IconFont extends Entity, Size, CanHaveEffects {
  type: "icon_font";
  /** Name of the icon in the icon font */
  iconFontName?: StringOrVariable;
  /** Icon font to use. Valid fonts are 'lucide', 'feather', 'Material Symbols Outlined', 'Material Symbols Rounded', 'Material Symbols Sharp', 'phosphor' */
  iconFontFamily?: StringOrVariable;
  /** Variable font weight, only valid for icon fonts with variable weight. Values from 100 to 700. */
  weight?: NumberOrVariable;
  fill?: Fills;
}

/** References allow reusing other objects in different places. */
export interface Ref extends Entity {
  type: "ref";
  /** The `ref` property must be another object's ID. */
  ref: string;
  /** This can be used to customize the properties of descendant objects except the `children` property. */
  descendants?: {
    [
      key: string /** Each key is an ID path pointing to a descendant object. */
    ]: {} /** Descendant objects can be customized in two manners:
- Property overrides: only the customized properties are present with their new values. In this case, the `id`, `type` and `children` properties must not be specified!
- Object replacement: in this case, this object must be a completely new node tree, that will replace the original descendant of the referenced component. This is useful for adding custom content to instances of container-type components (cards, windows, panels, etc). */;
  };
  [key: string]: any;
}

export type Child =
  | Frame
  | Group
  | Rectangle
  | Ellipse
  | Line
  | Path
  | Polygon
  | Text
  | Note
  | Prompt
  | Context
  | IconFont
  | Ref;

export type IdPath = string;

export interface Document {
  version: string;
  themes?: { [key: string /** RegEx: [^:]+ */]: string[] };
  imports?: {
    [
      key: string
    ]: string /** Each value is a path to an imported .pen file, from which variables and reusable components are made available in the current file. The key is a short alias for the imported file. */;
  };
  variables?: {
    [key: string /** RegEx: [^:]+ */]:
      | {
          type: "boolean";
          value:
            | BooleanOrVariable
            | { value: BooleanOrVariable; theme?: Theme }[];
        }
      | {
          type: "color";
          value: ColorOrVariable | { value: ColorOrVariable; theme?: Theme }[];
        }
      | {
          type: "number";
          value:
            | NumberOrVariable
            | { value: NumberOrVariable; theme?: Theme }[];
        }
      | {
          type: "string";
          value:
            | StringOrVariable
            | { value: StringOrVariable; theme?: Theme }[];
        };
  };
  children: (
    | Frame
    | Group
    | Rectangle
    | Ellipse
    | Line
    | Polygon
    | Path
    | Text
    | Note
    | Context
    | Prompt
    | IconFont
    | Ref
  )[];
}

```

# General instructions when editing .pen files

- After generating, validate it with the schema, and proceed or correct as needed.
- Use the `get_screenshot` tool periodically and at the end to verify generated design changes on the canvas.
- Be very thorough with your design changes and make sure all the task's needs are met. Verify your design after you are finished generating it.
- Make sure to follow `gap` and `padding` layout properties exactly on each component like on a button, table, card etc.
- If a property is not defined, consider it 0, for instance, if `cornerRadius` is not defined on a rectangle, it's 0, DO NOT hallucinate a random number.
- If possible, combine multiple changes into a single tool call.
- Keep each `batch_design` call to **maximum 25 operations** for optimal performance.
- For complex screens, use multiple `batch_design` calls by logical sections.
- Favor copying existing content and updating the copied content later, rather than generating new content.
- Always make sure created/copied screens or components are placed in an empty area. Never place screens over other screens.
- IMPORTANT: when using `textGrowth: fixed-width`, the `width` node property MUST be specified, `height` is calculated from the text content.
- IMPORTANT: Text has no color by default and will be invisible. You MUST set the `fill` property on text objects to make them visible.

## Using placeholders

- Any work on a new, existing, or copied frame MUST have `placeholder: true` flag. If the flag is missing you MUST set it.
- When you are working on a node with placeholder property set, don't work outside of that node until you are finished with working on that node and unset that placeholder.
- When asked to work on multiple screens start with pre-creating or setting the placeholders frames immediately, only then start the work on each screen.
- When asked to insert new frame, you MUST immediately begin with `batch_design` call to create placeholder frames with `placeholder: true`.
- After copying a frame to makes changes, you MUST set `placeholder: true` on the copied screen before any work.
- When asked to modify an existing screen put a placeholder flag on the screen as well.
- The placeholder flag MUST be present for the entire duration of the work on the screen.
- You can update the placeholder frame properties like position, size, layout, and others during design generation to fit it your needs.
- You MUST remove the placeholder flag when you are done with each screen. Don't wait until all screens are finished.
- There should never be a placeholder flag on an object that's finished.

## Planning and Validation

- If possible, first create reusable components that will be used as building blocks. Place these separately on the canvas.
- After assembling the design JSON, perform a schema validation review: ensure that all required properties, value constraints, and object relationships are correct.
- Use `batch_get` by listing reusable nodes in a design system frame, when working with a design system or design kit frame, to understand what components are available.

# General design information

- Exclude default property values unless they are overriding a non-default value inside an instance.
- Frames can be nested within other frames and serve as shape placeholders or as containers for child objects.
- When creating multiple screens, represent each one as a top-level frame.
- Avoid generating `"height": 0` and `"width": 0` as properties.

## Coordinates

- All object coordinates are defined relative to the parent’s top-left corner.
- Use a coordinate system where `x` increases to the right and `y` increases downward.
- Child object coordinates are always relative to their respective parent.

## Objects

- Avoid duplicating the same dimension value across multiple sibling elements. If several children need to match their parent's width or height, use `fill_container` on each rather than hardcoding the parent's size repeatedly.
- Explicitly specify `width` and `height` for shapes and other nodes whose size is not otherwise determined by layout or text behavior.
- For text, follow `textGrowth` rules: do not set `width` or `height` unless `textGrowth` requires them.
- For layout-driven nodes, prefer `fit_content` and `fill_container` when appropriate instead of hardcoded numeric sizes.
- Set children to `fill_container` to distribute them evenly within their parent. Use the `gap` property on the parent to add gaps between children.
- Use `"justifyContent": "center"` and `"alignItems": "center"` on the parent to center its children both vertically and horizontally.
- Use `textAlign` or `textAlignVertical` to align the text within the text bounding box. These have a visible effect only when `textGrowth` is set to `fixed-width` or `fixed-width-height`.
- Setting `textAlign` or `textAlignVertical` will not change the position of the text bounding box. Use flexbox layout to align the object.
- Use `textGrowth` to define text wrapping and bounding box sizing. When not specified, the default value is `"auto"`.
- Possible `textGrowth` values:
  - `auto`: `width` and `height` node property WILL always be calculated from the text content. Never does line wrapping, text will always be on a single line. `width` and `height` properties will not be used.
  - `fixed-width`: the `width` node property MUST be specified, `height` is calculated from the text content. Does line wrapping based on the object's bounding box width.
  - `fixed-width-height`: both `width` and `height` node property MUST be specified. Does line wrapping based on the object's bounding box width. Text content will vertically overflow.
- Only use `fixed-width-height` when you need to override the height of the text box. Prefer `fixed-width` with `fill_container` for text that needs to adapt to the parent container size.
- If you want to wrap lines, you HAVE TO set the `textGrowth` to either `fixed-width` or `fixed-width-height`.
- Never guess text dimensions, always rely on text wrapping and flexbox layout to size and position text. Any dimension guess for text will result in visual bugs.
- Use the `lineHeight` property on text as a ratio relative to the font size: `0.0` means 0%, and `1.0` means 100%. If not specified, the font’s default line height will be applied.
- You MUST specify `width` and `height` on `icon_font`.
- Some buttons have a large variation and normal and different states, use those states accordingly as you find hierarchical fit
- Always use `fill` property for text color and fill color. Text with emoji needs a `fill` color to be visible.
- Fill can be set on wrapping containers to add a background color, gradient, or an image.
- Never use invalid textColor and fillColor property name for fills
- To reference a variable, use a string value with a `$` prefix (`fill: "$primary-color"`, `gap: "$spacing-small"`)

## Flexbox Layout

- **Prefer dynamic sizing over hardcoded values.** Use `fill_container` or `fit_content`, rather than repeating the parent's or children's pixel value. This makes designs more maintainable.
- **IMPORTANT:** Always prefer using flexbox layout for arranging and sizing objects.
- Setting layout to `none` will make all children use absolute positioning. Avoid using absolute positioning unless absolutely necessary.
- IMPORTANT: When using flexbox layout, x and y properties on children are completely ignored. NEVER set x/y on a child unless the parent has layout: "none".
- Only use explicit numerical sizes in rare cases when it cannot be inferred from the layout.
- To align and distribute objects within a container with flexbox, wrap them in a parent object that has a `layout` property.
- Frames default to horizontal layout and fit_content sizing.
- For absolute positioning of objects, set the parent’s `layout` property to `none`.
- **IMPORTANT:** `fill_container` is only valid when the parent has a flexbox layout.
- **IMPORTANT:** `fit_content` is only valid when it's on a flexbox layout.
- Padding affects ALL children uniformly - it creates space between the container's edges and its children.
- To offset an individual child in flexbox, wrap it in a flexbox frame with padding. There is no margin or relative positioning in flexbox.
- Flexbox layout is single-axis only with no item wrapping. For grid-like layouts, manually create separate row frames.
- A parent cannot be sized by its children using `fit_content` if all direct children are sized by the parent using `fill_container`. This creates circular dependency.

## Components and Instances

- Object that has `reusable` property `true` can be also called a "component" or a "symbol"
- Components can be used to replicate the same object tree in multiple places, to avoid repetition. This is ideal for common widgets in a design, like buttons, form fields, toggles, cards, etc.
- To reuse a component, use the `ref` object type that points to a reusable component. `ref` objects are also called "instances".
- Instances have a `ref` property, which identifies the mother component.
- The `ref` property of the instance must be set to the reused component's `id`.
- Instances can be customized by overriding objects' properties in their subtree:
  - To override properties of the component's root object, just put the overridden properties in the `ref` object.
  - To override properties of an object inside the component's subtree, use the `descendants` property of the `ref`. Put the overridden properties under the customized object's `id` inside the `descendants` map. When accessing multi-level descendant nodes in the component, use paths in the `descendants` object keys to access it, DO NOT create multiple levels of `descendants` objects.
  - To override properties of an object inside a nested instance, the object's `id` must be prefixed by the instance's `id` followed by a slash (/). This works for arbitrarily nested component instances, e.g. consider an icon component; and a button component that contains an instance of this icon; and a menu component that contains multiple instances of the button component; and a sidebar component that contains an instance of the menu component!
  - Parts of an instance's object tree can also be replaced with completely new objects: if the `type` property is present for a particular descendant, it means that the whole subtree will be swapped out with the override. In this case, the override must be a complete object tree, not just properties! This mechanism is useful for reusable container-type objects, such as windows, tables, grids, cards, etc.
- An instance can emulate the deletion of a nested object from its subtree by overriding its `enabled` property with `false`.
- When creating a design, place reusable components on the side, next to the main design.
- You cannot reference components across files. If you want to use a component from a different file you must copy it over.
- Try to use existing components in the document instead of always making new ones.
- Instead of duplicating the same component multiple times with small tweaks. Try to find a way to make them more generic so the instances can use them in more places.
- Overrides will be only applied to the object it's overriding. The changes will not be inherited to all children.
- When parsing designs, treat "component" word broadly — some components are formally defined symbols that can be references, others are ad-hoc groupings that visually or functionally behave like components, sometimes their node name is prefixed "component/"

## Layout with Components and Instances

- Prefer using `fit_content` or `fill_container` size instance override to resize the component instance into the new location.
- When an instance is not inside an object using `layout`, it must be positioned by overriding its `x` and `y` properties. Do this even if the position is (0, 0). Never override just a single position axis. Always override both if you need to specify the position.
- An object must have a specified position, or be a child of an object using horizontal or vertical layout.


# Pencil Design → Design Workflow

## Overview

This guide focuses on the design → design workflow in .pen files using MCP tools.

## Core Principles

- Use visual verification - Screenshot changes to ensure correctness
- Follow the component hierarchy - Understand parent-child relationships
- Respect the design system - Use existing variables and patterns
- Keep each `batch_design` call to **maximum 25 operations** - split larger designs into multiple calls by logical sections
- When copying nodes and modifying descendants, use the "descendants" property in the Copy operation. Never use separate Update operations for descendants of copied nodes, as this will fail due to ID mismatches.
- When modifying component instance descendants:
  - Use `U(instance+"/childId", {...})` to change properties
  - Use `newNode=R(instance+"/childId", {...})` to replace with a new node
  - Use `newNode=I()` when the parent is a regular frame (use bindings from Insert/Replace results)
- IMPORTANT: DO NOT try to Update (U) a node's descendant that you just copied (C), since copying will recreate the descendant nodes and it will assign new IDs to those children nodes.

## Operation Guide for Component Instances

| Goal | Operation | Example |
|------|-----------|---------|
| Change text/properties | `U()` | `U(instance+"/label",{content:"Hello"})` |
| Swap with different node | `R()` | `newNode=R(instance+"/slot",{type:"text",...})` |
| Add children to frames | `I()` | `newNode=I(myFrame,{type:"ref",ref:"Button"})` |

### Pattern: Insert instance, then Update descendants

``` javascript
card=I("Casf3fX",{type:"ref",ref:"CardComp"})
U(card+"/title",{content:"Account Details"})
U(card+"/description",{content:"Manage your settings"})
```

### Pattern: Insert instance, then Replace a slot

``` javascript
card=I("Casf3fX",{type:"ref",ref:"CardComp"})
customContent=R(card+"/contentSlot",{type:"frame",layout:"vertical"})
item1=I(customContent,{type:"text",content:"Item 1"})
```

## Workflow

1. get_editor_state → Identify current .pen file, user selection and list reusable components (design system)

2. **DECISION POINT** - Does the task benefit from creative/visual direction?

   **A) Creative design tasks** (most design work falls here):
   - Designing screens, pages, dashboards, landing pages, web apps, slides, mobile apps
   - User asks for a specific style, aesthetic, or mood
   - Blank canvas or designing from scratch
   - Exploring variations or new directions
   → get_style_guide_tags() → get_style_guide([...]) for inspiration
   → get_guidelines("landing-page", "webapp", "mobile-app", "web-app", "slides", "design-system") as appropriate

   **B) Purely compositional tasks** (simple additions to existing designs):
   - "Add a button here", "Insert a card", "Move this element"
   - Task is about arranging existing components, not styling
   → get_guidelines("design-system") → Use existing component styles
   → Skip style guide

3. get_variables() → Read design tokens (always use these, never hardcode values)
4. batch_get(componentIds, readDepth: 3) → Inspect component structure before using (skip if no components)
5. snapshot_layout(parentId, maxDepth: [low-number]) → Check existing layout structure
6. batch_design() → Generate layout using components (keep to maximum 25 ops per call)
7. get_screenshot(nodeId) → Verify changes visually
8. Repeat steps 6-7 for additional sections as needed

# Examples

Task: "Design a registration form!"
----------------------------------

First, call `get_editor_state()` tool to decide which file to edit, plus receive top-level (document) frames as well as reusable components. The response is:

```
{"message":"# Currently active editor\n- `designs/forms.pen`\n\n# Document State:\n- No nodes are selected.\n\n ## Top-Level Nodes (1):\n-`d9023`: Dashboard [user visible]\n\n## Reusable Components:\n-`aa900`: Component/Button/Default"}
```
We're going to work in `designs/forms.pen` from now on.

Let's create a container frame and the layout of the registration form at this location using the `batch_design` tool with updated vertical layout for the registration form, with the following arguments.

Note: We insert our container as a top level frame into `document`

``` javascript
container=I(document,{type:"frame",layout:"vertical",width:400,height:"fit_content(600)",placeholder:true})
```
and then we add content into the frame (which now has been given an id: `s5d65`)

``` javascript
title=I("s5d65",{type:"ref",ref:"txtFl"})
U(title+"/FeqsE3",{content:"Create Account",fill:"$--font-primary",fontSize:28})
U(title+"/FeqsE3/Cd4S1a",{content:"Sign up to get started",fill:"$--font-primary",fontSize:14})
part1=I("s5d65",{type:"ref",ref:"NKYzH"})
U(part1+"/ZopUS/jEYMs",{content:"'A quote from someone'"})
part2=I("s5d65",{type:"frame",layout:"vertical",width:"fill_container",gap:16})
firstName=I(part2,{type:"ref",ref:"iNpC3"})
U(firstName+"/lBl34",{content:"First Name"})
lastName=I(part2,{type:"ref",ref:"iNpC3"})
U(lastName+"/lBl34",{content:"Last Name"})
U("Dca2fsz",{layout:"vertical",gap:20,padding:32})
```

The response is:

```
Successfully executed all operations.
```


### Tables

Tables use flex box layout.
Tables follow strict hierarchy: **Table (frame) → Table Row (frame) → Table Cell (frame) → Table Cell Content**
CRITICAL: Each cell is represented as a **frame** node and contains a cell content, which is usually text, label, button or instance of a component.

(in this case "kdl58" is the table frame)

``` javascript
tableRow=I("kdl58",{type:"frame",layout:"horizontal"})
tableCell1=I(tableRow,{type:"frame",width:"fill_container"})
tableCellContent1=I(tableCell1,{type:"text",content:"John Doe"})
tableCell2=I(tableRow,{type:"frame",width:"fill_container"})
tableCellContent2=I(tableCell2,{type:"text",content:"joe.doe@example.com"})
```

**Antipattern** – Do NOT put content directly in the row, skipping the cell frame:

``` javascript
// ❌ WRONG: text nodes directly inside row, missing cell frames
tableRow=I("kdl58",{type:"frame",layout:"horizontal"})
I(tableRow,{type:"text",content:"John Doe"})
I(tableRow,{type:"text",content:"joe.doe@example.com"})
```

Now we're going to use the "Labeled input" reusable component from earlier to add a first- and last name field. But first we'll have to understand the structure of the "Labeled input" component. We've seen that the ID of this component is "FD3sxg2", so we'll invoke the `batch_get` tool with these arguments:

```
{
  "filePath": "designs/forms.pen",
  "nodeIds": ["FD3sxg2", "fYd43s"],
  "readDepth": 3
}
```

We'll also add a terms & conditions checkbox after the password fields. We'll use the "Checkbox" component we've seen earlier. Let's call the `batch_design` tool with the following operations:

``` javascript
checkboxPart=I("sDF4df",{type:"frame",layout:"vertical",name:"Terms Checkbox",alignItems:"center"})
checkbox=I(checkboxPart,{type:"ref",ref:"vrGT3s"})
termsText=I(checkboxPart,{type:"text",content:"I agree to the Terms of Service and Privacy Policy",fontSize:12})
```

The response is:

```
Successfully executed all operations.
```

The registration form is done. To verify that it looks good, let's invoke the `snapshot_layout` tool with the following arguments:

```
{
  "filePath": "designs/forms.pen",
  "parentId": "s5d65",
  "maxDepth": 3
}
```

It seems that the last item of the form (the sign-in prompt link) ends at y=493 with height=15. However, the form's height is 600, so there is an unnecessarily large gap at the bottom of the form. Let's fix this by updating the form from a fixed height to fit its content vertically! To do this, we're going to call the `batch_design` tool with the following arguments:

``` javascript
U("BhJih4",{height:"fit_content"})
```

The response is:

```
Successfully executed all operations.
```

With this, the registration form is finished!

---

Task: "Add images to a hero section!"
-------------------------------------

**IMPORTANT**: There is NO "image" node type! Images are fills on frame/rectangle nodes. First insert a frame, then use `G` to apply the image.

``` javascript
hero=I(container,{type:"frame",layout:"vertical",width:600,height:400})
G(hero,"ai","team collaboration modern office")
icon1=C("CA3fxD",hero,{width:64,height:64})
icon2=C("Csa2Fx",hero,{width:64,height:64})
D("dfFAeg2")
D(hero+"/DraS2f")
G(icon1,"ai","isometric cloud server icon, soft gradients")
M("FVge3x",hero,1)
```

- **AI** (`"type": "ai"`): Preferred, generated images. Be specific: `"minimalist coffee logo, flat vector, warm browns"`
- **Stock** (`"type": "stock"`): Fallback: Unsplash photos. Use descriptive keywords: `"modern workspace laptop natural light"`
- Apply to existing frame: `G("frame-id","ai","minimalist coffee shop logo, flat design")`

---

### Text Sizing

Text sizing depends on whether the parent or the text content controls the size.

**Parent defines size** — parent must have flexbox layout. Use `textGrowth:"fixed-width"` + `fill_container` (headings, descriptions, paragraphs):
```
section=I(parent,{type:"frame",layout:"vertical",width:400,gap:12})
I(section,{type:"text",content:"Dashboard",textGrowth:"fixed-width",width:"fill_container",fontSize:24,fill:"$--font-primary"})
I(section,{type:"text",content:"Manage your account settings",textGrowth:"fixed-width",width:"fill_container",fontSize:14,fill:"$--font-secondary"})
```

**Text defines size** — default `auto`, no width/height (button labels, tags, badges):
```
btn=I(parent,{type:"frame",layout:"horizontal",width:"fit_content",height:"fit_content",padding:12,gap:8})
I(btn,{type:"text",content:"Submit",fontSize:14,fill:"$--font-primary"})
```

**Antipattern** — using pixel dimensions when layout can handle it:
```
// WRONG: parent has layout, use fill_container instead of pixel width
I(card,{type:"text",content:"Description",textGrowth:"fixed-width",width:320,fontSize:14})
// WRONG: guessing height on text, let textGrowth calculate it
I(card,{type:"text",content:"Description",width:"fill_container",height:48,fontSize:14})
```


---

## State #2 (LAST -- Final Known State)

- **JSONL Line:** 614
- **Tool ID:** `toolu_01AZEZtokuWLL5LVt6uWuS16`
- **Size:** 38573 chars

## Currently active editor
- `new`

## Document State:
- No nodes are selected.


### Top-Level Nodes (59):

- `F0vGT` (frame): 7.7 · query:error [user visible]
- `LcVQM` (frame): 7.8 · query:no-results [user visible]
- `a0Rbb` (frame): 6.2 · doc:chunks-tab [user visible]
- `aHPqN` (frame): 6.3 · doc:chunk-expanded [user visible]
- `cGeBp` (frame): 8.3 · api:copied [user visible]
- `VjBnm` (frame): 8.4 · api:token-created [user visible]
- `BiAIX` (frame): 01 · Color System [outside viewport]
- `U3ePH` (frame): 02 · Typography System [outside viewport]
- `wEM5D` (frame): 03 · Spacing System [outside viewport]
- `yWYpR` (frame): 04 · Logofolio [outside viewport]
- ... +49 others

### Reusable Components (11):
- `JND89`: Button/Primary
- `wlUN3`: Button/Secondary
- `oqBCN`: Button/Ghost
- `EYKbU`: Button/Danger
- `JTQb6`: Input/Default
- `9K6ma`: Badge/Processing
- `JTHAo`: Badge/Ready
- `WIOmX`: Badge/Error
- `tbd8x`: Badge/Pending
- `lRo74`: PipelineIndicator
- `YPAeU`: DropZone

# .pen File Schema

```typescript
/** Each key must be an existing theme axis, and each value must be one of the possible values for that axis. E.g. { 'device': 'phone' } */
export interface Theme {
  [key: string]: string;
}

/** To bind a variable to a property, set the property to the dollar-prefixed name of the variable! */
export type Variable = string;

export type NumberOrVariable = number | Variable;

/** Colors can be 8-digit RGBA hex strings (e.g. #AABBCCDD), 6-digit RGB hex strings (e.g. #AABBCC) or 3-digit RGB hex strings (e.g. #ABC which means #AABBCC). */
export type Color = string;

export type ColorOrVariable = Color | Variable;

export type BooleanOrVariable = boolean | Variable;

export type StringOrVariable = string | Variable;

export interface Layout {
  /** Enable flex layout. None means all children are absolutely positioned and will not be affected by layout properties. Frames default to horizontal, groups default to none. */
  layout?: "none" | "vertical" | "horizontal";
  /** The gap between children in the main axis direction. Defaults to 0. */
  gap?: NumberOrVariable;
  layoutIncludeStroke?: boolean;
  /** The Inside padding along the edge of the container */
  padding?:
    | /** The inside padding to all sides */ NumberOrVariable
    | /** The inside horizontal and vertical padding */ [
        NumberOrVariable,
        NumberOrVariable,
      ]
    | /** Top, Right, Bottom, Left padding */ [
        NumberOrVariable,
        NumberOrVariable,
        NumberOrVariable,
        NumberOrVariable,
      ];
  /** Control the justify alignment of the children along the main axis. Defaults to 'start'. */
  justifyContent?:
    | "start"
    | "center"
    | "end"
    | "space_between"
    | "space_around";
  /** Control the alignment of children along the cross axis. Defaults to 'start'. */
  alignItems?: "start" | "center" | "end";
}

/** SizingBehavior controls the dynamic layout size.
- fit_content: Use the combined size of all children for the container size. Fallback is used when there are no children.
- fill_container: Use the parent size for the container size. Fallback is used when the parent has no layout.
Optional number in parentheses (e.g., 'fit_content(100)') specifies the fallback size. */
export type SizingBehavior = string;

/** Position is relative to the parent object's position. X increases rightwards, Y increases downwards.
IMPORTANT: x and y are IGNORED when parent uses flexbox layout. */
export interface Position {
  x?: number;
  y?: number;
}

export interface Size {
  width?: NumberOrVariable | SizingBehavior;
  height?: NumberOrVariable | SizingBehavior;
}

export interface CanHaveRotation {
  /** Rotation is represented in degrees, measured counter-clockwise. */
  rotation?: NumberOrVariable;
}

export type BlendMode =
  | "normal"
  | "darken"
  | "multiply"
  | "linearBurn"
  | "colorBurn"
  | "light"
  | "screen"
  | "linearDodge"
  | "colorDodge"
  | "overlay"
  | "softLight"
  | "hardLight"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export type Fill =
  | ColorOrVariable
  | {
      type: "color";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      color: ColorOrVariable;
    }
  | {
      type: "gradient";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      gradientType?: "linear" | "radial" | "angular";
      opacity?: NumberOrVariable;
      /** Normalized to bounding box (default: 0.5,0.5). */
      center?: Position;
      /** Normalized to bounding box (default: 1,1). Linear: height sets gradient length, width is ignored. Radial/Angular: sets ellipse diameters. */
      size?: { width?: NumberOrVariable; height?: NumberOrVariable };
      /** Rotation in degrees, counterclockwise (0° up, 90° left, 180° down). */
      rotation?: NumberOrVariable;
      colors?: { color: ColorOrVariable; position: NumberOrVariable }[];
    }
  /** Image fill. Url needs to be a relative from the pen file, for example `../../file.png` or `./image.jpg` */
  | {
      type: "image";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      opacity?: NumberOrVariable;
      url: string;
      mode?: "stretch" | "fill" | "fit";
    }
  /** Grid of colors with bezier-interpolated edges. Row-major order. Adjust the points and handles to create complex gradients. Keep the points on the edges at their default position. */
  | {
      type: "mesh_gradient";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      opacity?: NumberOrVariable;
      columns?: number;
      rows?: number;
      /** Color per vertex. */
      colors?: ColorOrVariable[];
      /** columns * rows points in [0,1] normalized coordinates. */
      points?: (
        | /** Position with auto-generated handles. */ [number, number]
        | /** Position with optional bezier handles (relative offsets). Omitted handles are auto-generated. */ {
            position: [number, number];
            leftHandle?: [number, number];
            rightHandle?: [number, number];
            topHandle?: [number, number];
            bottomHandle?: [number, number];
          }
      )[];
    };

export type Fills = Fill | Fill[];

export interface Stroke {
  align?: "inside" | "center" | "outside";
  thickness?:
    | NumberOrVariable
    | {
        top?: NumberOrVariable;
        right?: NumberOrVariable;
        bottom?: NumberOrVariable;
        left?: NumberOrVariable;
      };
  join?: "miter" | "bevel" | "round";
  miterAngle?: NumberOrVariable;
  cap?: "none" | "round" | "square";
  dashPattern?: number[];
  fill?: Fills;
}

export type Effect =
  /** 'blur' type blurs the entire layer content */
  | { enabled?: BooleanOrVariable; type: "blur"; radius?: NumberOrVariable }
  /** 'background_blur' type blurs the background content behind the layer */
  | {
      enabled?: BooleanOrVariable;
      type: "background_blur";
      radius?: NumberOrVariable;
    }
  /** The drop shadow effect can be an inner or outer shadow, with adjustable offset, spread, blur, color and blend mode. */
  | {
      type: "shadow";
      enabled?: BooleanOrVariable;
      shadowType?: "inner" | "outer";
      offset?: { x: NumberOrVariable; y: NumberOrVariable };
      spread?: NumberOrVariable;
      blur?: NumberOrVariable;
      color?: ColorOrVariable;
      blendMode?: BlendMode;
    };

export type Effects = Effect | Effect[];

export interface CanHaveGraphics {
  stroke?: Stroke;
  fill?: Fills;
  effect?: Effects;
}

export interface CanHaveEffects {
  effect?: Effects;
}

/** Entities have unique identifiers. */
export interface Entity extends Position, CanHaveRotation {
  /** A unique string that MUST NOT contain slash (/) characters. If omitted, a unique ID will be generated automatically. */
  id: string;
  /** Optional name for the entity, used for display and identification purposes */
  name?: string;
  /** Optional context information about this object. */
  context?: string;
  /** Objects are not reusable by default. If an object is made reusable by setting this property to `true`, the object can be duplicated using `ref` objects. */
  reusable?: boolean;
  theme?: Theme;
  enabled?: BooleanOrVariable;
  opacity?: NumberOrVariable;
  flipX?: BooleanOrVariable;
  flipY?: BooleanOrVariable;
  metadata?: { type: string; [key: string]: any };
}

export interface Rectangleish extends Entity, Size, CanHaveGraphics {
  cornerRadius?:
    | NumberOrVariable
    | [NumberOrVariable, NumberOrVariable, NumberOrVariable, NumberOrVariable];
}

/** A rectangle is defined by its position and size. The position corresponds to the top-left corner. */
export interface Rectangle extends Rectangleish {
  type: "rectangle";
}

/** An ellipse is defined by its bounding rectangle's position and size. */
export interface Ellipse extends Entity, Size, CanHaveGraphics {
  type: "ellipse";
  /** Inner-to-outer radius ratio for ring shapes. 0 = solid, 1 = fully hollow. Default: 0. */
  innerRadius?: NumberOrVariable;
  /** Arc start angle in degrees, counter-clockwise from the right. Default: 0. */
  startAngle?: NumberOrVariable;
  /** Arc length in degrees from startAngle. Positive = counter-clockwise, negative = clockwise. Range: -360 to 360. Default: 360 (full ellipse). */
  sweepAngle?: NumberOrVariable;
}

/** A line is defined by its bounding rectangle's position and size. */
export interface Line extends Entity, Size, CanHaveGraphics {
  type: "line";
}

/** A regular polygon is defined by its bounding rectangle's position and size. */
export interface Polygon extends Entity, Size, CanHaveGraphics {
  type: "polygon";
  polygonCount?: NumberOrVariable;
  cornerRadius?: NumberOrVariable;
}

export interface Path extends Entity, Size, CanHaveGraphics {
  /** fillRule is used to determine which parts of the path are considered inside the shape to be filled. Default is 'nonzero'. */
  fillRule?: "nonzero" | "evenodd";
  /** SVG Path */
  geometry?: string;
  type: "path";
}

export interface TextStyle {
  fontFamily?: StringOrVariable;
  fontSize?: NumberOrVariable;
  fontWeight?: StringOrVariable;
  letterSpacing?: NumberOrVariable;
  fontStyle?: StringOrVariable;
  underline?: BooleanOrVariable;
  /** A multiplier that gets applied to the font size to determine spacing between lines. If not specified, uses the font's built-in line height. */
  lineHeight?: NumberOrVariable;
  textAlign?: "left" | "center" | "right" | "justify";
  textAlignVertical?: "top" | "middle" | "bottom";
  strikethrough?: BooleanOrVariable;
  href?: string;
}

export type TextContent = StringOrVariable | TextStyle[];

export interface Text extends Entity, Size, CanHaveGraphics, TextStyle {
  type: "text";
  content?: TextContent;
  /** textGrowth controls how the text box dimensions behave. It must be set before width or height can be used — without textGrowth, the width and height properties are ignored.
'auto': The text box automatically grows to fit the text content. Text does not wrap. Width and height adjust dynamically.
'fixed-width': The width is fixed and text wraps within it. The height grows automatically to fit the wrapped content.
'fixed-width-height': Both width and height are fixed. Text wraps and may be overflow if it exceeds the bounds.
IMPORTANT: Never set width or height without also setting textGrowth. If you want to control the size of a text box, you must set textGrowth first. */
  textGrowth?: "auto" | "fixed-width" | "fixed-width-height";
}

export interface CanHaveChildren {
  children?: Child[];
}

/** A frame is a rectangle that can have children. */
export interface Frame extends Rectangleish, CanHaveChildren, Layout {
  type: "frame";
  /** Visually clip content that overflows the frame bounds. Default is false. */
  clip?: BooleanOrVariable;
  placeholder?: boolean;
  /** The presence of this property indicates that this frame is a "slot" - which means that it is intended be customized with children in instances of the parent component. Each element of the array is an ID of a "recommended" reusable component, one which fits semantically as a child here (e.g. inside a menu bar, the content slot would recommend IDs of various menu item components). */
  slot?: string[];
}

export interface Group extends Entity, CanHaveChildren, CanHaveEffects, Layout {
  type: "group";
  width?: SizingBehavior;
  height?: SizingBehavior;
}

export interface Note extends Entity, Size, TextStyle {
  type: "note";
  content?: TextContent;
}

export interface Prompt extends Entity, Size, TextStyle {
  type: "prompt";
  content?: TextContent;
  model?: StringOrVariable;
}

export interface Context extends Entity, Size, TextStyle {
  type: "context";
  content?: TextContent;
}

/** Icon from a font */
export interface IconFont extends Entity, Size, CanHaveEffects {
  type: "icon_font";
  /** Name of the icon in the icon font */
  iconFontName?: StringOrVariable;
  /** Icon font to use. Valid fonts are 'lucide', 'feather', 'Material Symbols Outlined', 'Material Symbols Rounded', 'Material Symbols Sharp', 'phosphor' */
  iconFontFamily?: StringOrVariable;
  /** Variable font weight, only valid for icon fonts with variable weight. Values from 100 to 700. */
  weight?: NumberOrVariable;
  fill?: Fills;
}

/** References allow reusing other objects in different places. */
export interface Ref extends Entity {
  type: "ref";
  /** The `ref` property must be another object's ID. */
  ref: string;
  /** This can be used to customize the properties of descendant objects except the `children` property. */
  descendants?: {
    [
      key: string /** Each key is an ID path pointing to a descendant object. */
    ]: {} /** Descendant objects can be customized in two manners:
- Property overrides: only the customized properties are present with their new values. In this case, the `id`, `type` and `children` properties must not be specified!
- Object replacement: in this case, this object must be a completely new node tree, that will replace the original descendant of the referenced component. This is useful for adding custom content to instances of container-type components (cards, windows, panels, etc). */;
  };
  [key: string]: any;
}

export type Child =
  | Frame
  | Group
  | Rectangle
  | Ellipse
  | Line
  | Path
  | Polygon
  | Text
  | Note
  | Prompt
  | Context
  | IconFont
  | Ref;

export type IdPath = string;

export interface Document {
  version: string;
  themes?: { [key: string /** RegEx: [^:]+ */]: string[] };
  imports?: {
    [
      key: string
    ]: string /** Each value is a path to an imported .pen file, from which variables and reusable components are made available in the current file. The key is a short alias for the imported file. */;
  };
  variables?: {
    [key: string /** RegEx: [^:]+ */]:
      | {
          type: "boolean";
          value:
            | BooleanOrVariable
            | { value: BooleanOrVariable; theme?: Theme }[];
        }
      | {
          type: "color";
          value: ColorOrVariable | { value: ColorOrVariable; theme?: Theme }[];
        }
      | {
          type: "number";
          value:
            | NumberOrVariable
            | { value: NumberOrVariable; theme?: Theme }[];
        }
      | {
          type: "string";
          value:
            | StringOrVariable
            | { value: StringOrVariable; theme?: Theme }[];
        };
  };
  children: (
    | Frame
    | Group
    | Rectangle
    | Ellipse
    | Line
    | Polygon
    | Path
    | Text
    | Note
    | Context
    | Prompt
    | IconFont
    | Ref
  )[];
}

```

# General instructions when editing .pen files

- After generating, validate it with the schema, and proceed or correct as needed.
- Use the `get_screenshot` tool periodically and at the end to verify generated design changes on the canvas.
- Be very thorough with your design changes and make sure all the task's needs are met. Verify your design after you are finished generating it.
- Make sure to follow `gap` and `padding` layout properties exactly on each component like on a button, table, card etc.
- If a property is not defined, consider it 0, for instance, if `cornerRadius` is not defined on a rectangle, it's 0, DO NOT hallucinate a random number.
- If possible, combine multiple changes into a single tool call.
- Keep each `batch_design` call to **maximum 25 operations** for optimal performance.
- For complex screens, use multiple `batch_design` calls by logical sections.
- Favor copying existing content and updating the copied content later, rather than generating new content.
- Always make sure created/copied screens or components are placed in an empty area. Never place screens over other screens.
- IMPORTANT: when using `textGrowth: fixed-width`, the `width` node property MUST be specified, `height` is calculated from the text content.
- IMPORTANT: Text has no color by default and will be invisible. You MUST set the `fill` property on text objects to make them visible.

## Using placeholders

- Any work on a new, existing, or copied frame MUST have `placeholder: true` flag. If the flag is missing you MUST set it.
- When you are working on a node with placeholder property set, don't work outside of that node until you are finished with working on that node and unset that placeholder.
- When asked to work on multiple screens start with pre-creating or setting the placeholders frames immediately, only then start the work on each screen.
- When asked to insert new frame, you MUST immediately begin with `batch_design` call to create placeholder frames with `placeholder: true`.
- After copying a frame to makes changes, you MUST set `placeholder: true` on the copied screen before any work.
- When asked to modify an existing screen put a placeholder flag on the screen as well.
- The placeholder flag MUST be present for the entire duration of the work on the screen.
- You can update the placeholder frame properties like position, size, layout, and others during design generation to fit it your needs.
- You MUST remove the placeholder flag when you are done with each screen. Don't wait until all screens are finished.
- There should never be a placeholder flag on an object that's finished.

## Planning and Validation

- If possible, first create reusable components that will be used as building blocks. Place these separately on the canvas.
- After assembling the design JSON, perform a schema validation review: ensure that all required properties, value constraints, and object relationships are correct.
- Use `batch_get` by listing reusable nodes in a design system frame, when working with a design system or design kit frame, to understand what components are available.

# General design information

- Exclude default property values unless they are overriding a non-default value inside an instance.
- Frames can be nested within other frames and serve as shape placeholders or as containers for child objects.
- When creating multiple screens, represent each one as a top-level frame.
- Avoid generating `"height": 0` and `"width": 0` as properties.

## Coordinates

- All object coordinates are defined relative to the parent’s top-left corner.
- Use a coordinate system where `x` increases to the right and `y` increases downward.
- Child object coordinates are always relative to their respective parent.

## Objects

- Avoid duplicating the same dimension value across multiple sibling elements. If several children need to match their parent's width or height, use `fill_container` on each rather than hardcoding the parent's size repeatedly.
- Explicitly specify `width` and `height` for shapes and other nodes whose size is not otherwise determined by layout or text behavior.
- For text, follow `textGrowth` rules: do not set `width` or `height` unless `textGrowth` requires them.
- For layout-driven nodes, prefer `fit_content` and `fill_container` when appropriate instead of hardcoded numeric sizes.
- Set children to `fill_container` to distribute them evenly within their parent. Use the `gap` property on the parent to add gaps between children.
- Use `"justifyContent": "center"` and `"alignItems": "center"` on the parent to center its children both vertically and horizontally.
- Use `textAlign` or `textAlignVertical` to align the text within the text bounding box. These have a visible effect only when `textGrowth` is set to `fixed-width` or `fixed-width-height`.
- Setting `textAlign` or `textAlignVertical` will not change the position of the text bounding box. Use flexbox layout to align the object.
- Use `textGrowth` to define text wrapping and bounding box sizing. When not specified, the default value is `"auto"`.
- Possible `textGrowth` values:
  - `auto`: `width` and `height` node property WILL always be calculated from the text content. Never does line wrapping, text will always be on a single line. `width` and `height` properties will not be used.
  - `fixed-width`: the `width` node property MUST be specified, `height` is calculated from the text content. Does line wrapping based on the object's bounding box width.
  - `fixed-width-height`: both `width` and `height` node property MUST be specified. Does line wrapping based on the object's bounding box width. Text content will vertically overflow.
- Only use `fixed-width-height` when you need to override the height of the text box. Prefer `fixed-width` with `fill_container` for text that needs to adapt to the parent container size.
- If you want to wrap lines, you HAVE TO set the `textGrowth` to either `fixed-width` or `fixed-width-height`.
- Never guess text dimensions, always rely on text wrapping and flexbox layout to size and position text. Any dimension guess for text will result in visual bugs.
- Use the `lineHeight` property on text as a ratio relative to the font size: `0.0` means 0%, and `1.0` means 100%. If not specified, the font’s default line height will be applied.
- You MUST specify `width` and `height` on `icon_font`.
- Some buttons have a large variation and normal and different states, use those states accordingly as you find hierarchical fit
- Always use `fill` property for text color and fill color. Text with emoji needs a `fill` color to be visible.
- Fill can be set on wrapping containers to add a background color, gradient, or an image.
- Never use invalid textColor and fillColor property name for fills
- To reference a variable, use a string value with a `$` prefix (`fill: "$primary-color"`, `gap: "$spacing-small"`)

## Flexbox Layout

- **Prefer dynamic sizing over hardcoded values.** Use `fill_container` or `fit_content`, rather than repeating the parent's or children's pixel value. This makes designs more maintainable.
- **IMPORTANT:** Always prefer using flexbox layout for arranging and sizing objects.
- Setting layout to `none` will make all children use absolute positioning. Avoid using absolute positioning unless absolutely necessary.
- IMPORTANT: When using flexbox layout, x and y properties on children are completely ignored. NEVER set x/y on a child unless the parent has layout: "none".
- Only use explicit numerical sizes in rare cases when it cannot be inferred from the layout.
- To align and distribute objects within a container with flexbox, wrap them in a parent object that has a `layout` property.
- Frames default to horizontal layout and fit_content sizing.
- For absolute positioning of objects, set the parent’s `layout` property to `none`.
- **IMPORTANT:** `fill_container` is only valid when the parent has a flexbox layout.
- **IMPORTANT:** `fit_content` is only valid when it's on a flexbox layout.
- Padding affects ALL children uniformly - it creates space between the container's edges and its children.
- To offset an individual child in flexbox, wrap it in a flexbox frame with padding. There is no margin or relative positioning in flexbox.
- Flexbox layout is single-axis only with no item wrapping. For grid-like layouts, manually create separate row frames.
- A parent cannot be sized by its children using `fit_content` if all direct children are sized by the parent using `fill_container`. This creates circular dependency.

## Components and Instances

- Object that has `reusable` property `true` can be also called a "component" or a "symbol"
- Components can be used to replicate the same object tree in multiple places, to avoid repetition. This is ideal for common widgets in a design, like buttons, form fields, toggles, cards, etc.
- To reuse a component, use the `ref` object type that points to a reusable component. `ref` objects are also called "instances".
- Instances have a `ref` property, which identifies the mother component.
- The `ref` property of the instance must be set to the reused component's `id`.
- Instances can be customized by overriding objects' properties in their subtree:
  - To override properties of the component's root object, just put the overridden properties in the `ref` object.
  - To override properties of an object inside the component's subtree, use the `descendants` property of the `ref`. Put the overridden properties under the customized object's `id` inside the `descendants` map. When accessing multi-level descendant nodes in the component, use paths in the `descendants` object keys to access it, DO NOT create multiple levels of `descendants` objects.
  - To override properties of an object inside a nested instance, the object's `id` must be prefixed by the instance's `id` followed by a slash (/). This works for arbitrarily nested component instances, e.g. consider an icon component; and a button component that contains an instance of this icon; and a menu component that contains multiple instances of the button component; and a sidebar component that contains an instance of the menu component!
  - Parts of an instance's object tree can also be replaced with completely new objects: if the `type` property is present for a particular descendant, it means that the whole subtree will be swapped out with the override. In this case, the override must be a complete object tree, not just properties! This mechanism is useful for reusable container-type objects, such as windows, tables, grids, cards, etc.
- An instance can emulate the deletion of a nested object from its subtree by overriding its `enabled` property with `false`.
- When creating a design, place reusable components on the side, next to the main design.
- You cannot reference components across files. If you want to use a component from a different file you must copy it over.
- Try to use existing components in the document instead of always making new ones.
- Instead of duplicating the same component multiple times with small tweaks. Try to find a way to make them more generic so the instances can use them in more places.
- Overrides will be only applied to the object it's overriding. The changes will not be inherited to all children.
- When parsing designs, treat "component" word broadly — some components are formally defined symbols that can be references, others are ad-hoc groupings that visually or functionally behave like components, sometimes their node name is prefixed "component/"

## Layout with Components and Instances

- Prefer using `fit_content` or `fill_container` size instance override to resize the component instance into the new location.
- When an instance is not inside an object using `layout`, it must be positioned by overriding its `x` and `y` properties. Do this even if the position is (0, 0). Never override just a single position axis. Always override both if you need to specify the position.
- An object must have a specified position, or be a child of an object using horizontal or vertical layout.


# Pencil Design → Design Workflow

## Overview

This guide focuses on the design → design workflow in .pen files using MCP tools.

## Core Principles

- Use visual verification - Screenshot changes to ensure correctness
- Follow the component hierarchy - Understand parent-child relationships
- Respect the design system - Use existing variables and patterns
- Keep each `batch_design` call to **maximum 25 operations** - split larger designs into multiple calls by logical sections
- When copying nodes and modifying descendants, use the "descendants" property in the Copy operation. Never use separate Update operations for descendants of copied nodes, as this will fail due to ID mismatches.
- When modifying component instance descendants:
  - Use `U(instance+"/childId", {...})` to change properties
  - Use `newNode=R(instance+"/childId", {...})` to replace with a new node
  - Use `newNode=I()` when the parent is a regular frame (use bindings from Insert/Replace results)
- IMPORTANT: DO NOT try to Update (U) a node's descendant that you just copied (C), since copying will recreate the descendant nodes and it will assign new IDs to those children nodes.

## Operation Guide for Component Instances

| Goal | Operation | Example |
|------|-----------|---------|
| Change text/properties | `U()` | `U(instance+"/label",{content:"Hello"})` |
| Swap with different node | `R()` | `newNode=R(instance+"/slot",{type:"text",...})` |
| Add children to frames | `I()` | `newNode=I(myFrame,{type:"ref",ref:"Button"})` |

### Pattern: Insert instance, then Update descendants

``` javascript
card=I("Casf3fX",{type:"ref",ref:"CardComp"})
U(card+"/title",{content:"Account Details"})
U(card+"/description",{content:"Manage your settings"})
```

### Pattern: Insert instance, then Replace a slot

``` javascript
card=I("Casf3fX",{type:"ref",ref:"CardComp"})
customContent=R(card+"/contentSlot",{type:"frame",layout:"vertical"})
item1=I(customContent,{type:"text",content:"Item 1"})
```

## Workflow

1. get_editor_state → Identify current .pen file, user selection and list reusable components (design system)

2. **DECISION POINT** - Does the task benefit from creative/visual direction?

   **A) Creative design tasks** (most design work falls here):
   - Designing screens, pages, dashboards, landing pages, web apps, slides, mobile apps
   - User asks for a specific style, aesthetic, or mood
   - Blank canvas or designing from scratch
   - Exploring variations or new directions
   → get_style_guide_tags() → get_style_guide([...]) for inspiration
   → get_guidelines("landing-page", "webapp", "mobile-app", "web-app", "slides", "design-system") as appropriate

   **B) Purely compositional tasks** (simple additions to existing designs):
   - "Add a button here", "Insert a card", "Move this element"
   - Task is about arranging existing components, not styling
   → get_guidelines("design-system") → Use existing component styles
   → Skip style guide

3. get_variables() → Read design tokens (always use these, never hardcode values)
4. batch_get(componentIds, readDepth: 3) → Inspect component structure before using (skip if no components)
5. snapshot_layout(parentId, maxDepth: [low-number]) → Check existing layout structure
6. batch_design() → Generate layout using components (keep to maximum 25 ops per call)
7. get_screenshot(nodeId) → Verify changes visually
8. Repeat steps 6-7 for additional sections as needed

# Examples

Task: "Design a registration form!"
----------------------------------

First, call `get_editor_state()` tool to decide which file to edit, plus receive top-level (document) frames as well as reusable components. The response is:

```
{"message":"# Currently active editor\n- `designs/forms.pen`\n\n# Document State:\n- No nodes are selected.\n\n ## Top-Level Nodes (1):\n-`d9023`: Dashboard [user visible]\n\n## Reusable Components:\n-`aa900`: Component/Button/Default"}
```
We're going to work in `designs/forms.pen` from now on.

Let's create a container frame and the layout of the registration form at this location using the `batch_design` tool with updated vertical layout for the registration form, with the following arguments.

Note: We insert our container as a top level frame into `document`

``` javascript
container=I(document,{type:"frame",layout:"vertical",width:400,height:"fit_content(600)",placeholder:true})
```
and then we add content into the frame (which now has been given an id: `s5d65`)

``` javascript
title=I("s5d65",{type:"ref",ref:"txtFl"})
U(title+"/FeqsE3",{content:"Create Account",fill:"$--font-primary",fontSize:28})
U(title+"/FeqsE3/Cd4S1a",{content:"Sign up to get started",fill:"$--font-primary",fontSize:14})
part1=I("s5d65",{type:"ref",ref:"NKYzH"})
U(part1+"/ZopUS/jEYMs",{content:"'A quote from someone'"})
part2=I("s5d65",{type:"frame",layout:"vertical",width:"fill_container",gap:16})
firstName=I(part2,{type:"ref",ref:"iNpC3"})
U(firstName+"/lBl34",{content:"First Name"})
lastName=I(part2,{type:"ref",ref:"iNpC3"})
U(lastName+"/lBl34",{content:"Last Name"})
U("Dca2fsz",{layout:"vertical",gap:20,padding:32})
```

The response is:

```
Successfully executed all operations.
```


### Tables

Tables use flex box layout.
Tables follow strict hierarchy: **Table (frame) → Table Row (frame) → Table Cell (frame) → Table Cell Content**
CRITICAL: Each cell is represented as a **frame** node and contains a cell content, which is usually text, label, button or instance of a component.

(in this case "kdl58" is the table frame)

``` javascript
tableRow=I("kdl58",{type:"frame",layout:"horizontal"})
tableCell1=I(tableRow,{type:"frame",width:"fill_container"})
tableCellContent1=I(tableCell1,{type:"text",content:"John Doe"})
tableCell2=I(tableRow,{type:"frame",width:"fill_container"})
tableCellContent2=I(tableCell2,{type:"text",content:"joe.doe@example.com"})
```

**Antipattern** – Do NOT put content directly in the row, skipping the cell frame:

``` javascript
// ❌ WRONG: text nodes directly inside row, missing cell frames
tableRow=I("kdl58",{type:"frame",layout:"horizontal"})
I(tableRow,{type:"text",content:"John Doe"})
I(tableRow,{type:"text",content:"joe.doe@example.com"})
```

Now we're going to use the "Labeled input" reusable component from earlier to add a first- and last name field. But first we'll have to understand the structure of the "Labeled input" component. We've seen that the ID of this component is "FD3sxg2", so we'll invoke the `batch_get` tool with these arguments:

```
{
  "filePath": "designs/forms.pen",
  "nodeIds": ["FD3sxg2", "fYd43s"],
  "readDepth": 3
}
```

We'll also add a terms & conditions checkbox after the password fields. We'll use the "Checkbox" component we've seen earlier. Let's call the `batch_design` tool with the following operations:

``` javascript
checkboxPart=I("sDF4df",{type:"frame",layout:"vertical",name:"Terms Checkbox",alignItems:"center"})
checkbox=I(checkboxPart,{type:"ref",ref:"vrGT3s"})
termsText=I(checkboxPart,{type:"text",content:"I agree to the Terms of Service and Privacy Policy",fontSize:12})
```

The response is:

```
Successfully executed all operations.
```

The registration form is done. To verify that it looks good, let's invoke the `snapshot_layout` tool with the following arguments:

```
{
  "filePath": "designs/forms.pen",
  "parentId": "s5d65",
  "maxDepth": 3
}
```

It seems that the last item of the form (the sign-in prompt link) ends at y=493 with height=15. However, the form's height is 600, so there is an unnecessarily large gap at the bottom of the form. Let's fix this by updating the form from a fixed height to fit its content vertically! To do this, we're going to call the `batch_design` tool with the following arguments:

``` javascript
U("BhJih4",{height:"fit_content"})
```

The response is:

```
Successfully executed all operations.
```

With this, the registration form is finished!

---

Task: "Add images to a hero section!"
-------------------------------------

**IMPORTANT**: There is NO "image" node type! Images are fills on frame/rectangle nodes. First insert a frame, then use `G` to apply the image.

``` javascript
hero=I(container,{type:"frame",layout:"vertical",width:600,height:400})
G(hero,"ai","team collaboration modern office")
icon1=C("CA3fxD",hero,{width:64,height:64})
icon2=C("Csa2Fx",hero,{width:64,height:64})
D("dfFAeg2")
D(hero+"/DraS2f")
G(icon1,"ai","isometric cloud server icon, soft gradients")
M("FVge3x",hero,1)
```

- **AI** (`"type": "ai"`): Preferred, generated images. Be specific: `"minimalist coffee logo, flat vector, warm browns"`
- **Stock** (`"type": "stock"`): Fallback: Unsplash photos. Use descriptive keywords: `"modern workspace laptop natural light"`
- Apply to existing frame: `G("frame-id","ai","minimalist coffee shop logo, flat design")`

---

### Text Sizing

Text sizing depends on whether the parent or the text content controls the size.

**Parent defines size** — parent must have flexbox layout. Use `textGrowth:"fixed-width"` + `fill_container` (headings, descriptions, paragraphs):
```
section=I(parent,{type:"frame",layout:"vertical",width:400,gap:12})
I(section,{type:"text",content:"Dashboard",textGrowth:"fixed-width",width:"fill_container",fontSize:24,fill:"$--font-primary"})
I(section,{type:"text",content:"Manage your account settings",textGrowth:"fixed-width",width:"fill_container",fontSize:14,fill:"$--font-secondary"})
```

**Text defines size** — default `auto`, no width/height (button labels, tags, badges):
```
btn=I(parent,{type:"frame",layout:"horizontal",width:"fit_content",height:"fit_content",padding:12,gap:8})
I(btn,{type:"text",content:"Submit",fontSize:14,fill:"$--font-primary"})
```

**Antipattern** — using pixel dimensions when layout can handle it:
```
// WRONG: parent has layout, use fill_container instead of pixel width
I(card,{type:"text",content:"Description",textGrowth:"fixed-width",width:320,fontSize:14})
// WRONG: guessing height on text, let textGrowth calculate it
I(card,{type:"text",content:"Description",width:"fill_container",height:48,fontSize:14})
```

