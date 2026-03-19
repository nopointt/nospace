// Canvas constants for Harkly Web
// Ported from harkly-shell

// -- Window defaults --
/** Default X position for a newly created frame (world coordinates). */
export const WINDOW_DEFAULT_X = 100;
/** Default Y position for a newly created frame (world coordinates). */
export const WINDOW_DEFAULT_Y = 100;
/** Default width for a newly created frame (world coordinates). */
export const WINDOW_DEFAULT_WIDTH = 400;
/** Default height for a newly created frame (world coordinates). */
export const WINDOW_DEFAULT_HEIGHT = 300;
/** Minimum size (width or height) a frame can be resized to. */
export const WINDOW_MIN_SIZE = 150;

// -- Snap: frame-to-frame --
/** World-space proximity threshold for frame-edge snapping. */
export const SNAP_THRESHOLD = 100;
/** Pixel gap inserted between two snapped frames. */
export const SNAP_GAP = 8;

// -- Snap: omnibar --
/** Width of the omnibar in screen pixels. */
export const OMNIBAR_WIDTH = 600;
/** Screen-space horizontal radius within which a dragged frame snaps to the omnibar centre. */
export const SNAP_MAGNETISM = 120;
/** Screen-space vertical distance from the bottom edge that triggers omnibar snap. */
export const SNAP_OMNIBAR_RANGE = 180;
/** Screen-space radius used to detect whether the omnibar slot is already occupied. */
export const SNAP_OMNIBAR_OCCUPIED_RADIUS = 100;
/** Screen-space tolerance for confirming a drag landed on the omnibar (drag-end check). */
export const SNAP_OMNIBAR_CENTER_TOLERANCE = 50;
/** Pixel offset from the top of the viewport for the omnibar snap preview. */
export const SNAP_PREVIEW_TOP_OFFSET = 20;
/** Pixel height reserved for the omnibar bar itself (bottom of viewport). */
export const OMNIBAR_BAR_HEIGHT = 100;
/** Pixel height of the omnibar header chrome (subtracted from snap preview height). */
export const OMNIBAR_HEADER_HEIGHT = 80;
/** Screen-space radius used to detect pinned frames centred on the omnibar during drag-end. */
export const SNAP_PINNED_CENTER_RADIUS = 100;

// -- Grid --
/** Grid cell size in world-space pixels. */
export const GRID_SIZE = 64;
/** Background color for the canvas (Cosmic Latte). */
export const CANVAS_BG = "#FFF8E7";
/** Grid line color (warm gray). */
export const GRID_LINE_COLOR = "#EBEBEB";
/** Grid line width. */
export const GRID_LINE_WIDTH = 0.5;
