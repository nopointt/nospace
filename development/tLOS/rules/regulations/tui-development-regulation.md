# TUI DEVELOPMENT REGULATION
> Applies to: tLOS Shell (L3) — SolidJS spatial canvas and all UI components.
> Authority: Frontend Engineer + Senior Architect. Review cycle: per feature sprint.

---

## § 1 — Component Architecture
- MUST use **SolidJS 1.8** functional components and primitives only.
- MUST use `createSignal`, `createMemo`, `createEffect` for all reactive state.
- NEVER use `useState`, `useEffect`, or any React hooks — wrong framework.
- Each UI component MUST live in its own file. No multi-component files.
- Components MUST be pure: no direct DOM manipulation outside SolidJS primitives.

## § 2 — Spatial Canvas Rules
- All windows/actors on the canvas MUST use absolute positioning driven by the spatial state store.
- Spatial coordinates (x, y, z, width, height) MUST be typed with a shared `SpatialPosition` WIT interface.
- NEVER hardcode pixel positions. All layout values come from the kernel's spatial actor.
- Z-index management MUST be centralized in the spatial store — no inline z-index values.

## § 3 — Styling
- MUST use **Tailwind CSS** utility classes as the primary styling mechanism.
- Custom CSS is permitted ONLY for animations and canvas-level effects not achievable with Tailwind.
- NEVER use inline `style` objects for layout. Use Tailwind classes.
- Design tokens (colors, spacing, typography) MUST match `/design-system/MASTER.md`.

## § 4 — Shell ↔ Kernel Communication
- Shell MUST communicate with the Kernel via the **tlos-shell-bridge** actor only.
- NEVER call Kernel endpoints directly from UI components. All calls go through a service layer.
- All shell-side messages MUST be typed with a corresponding WIT-derived TypeScript type.
- NEVER use `fetch()` or `axios` to talk to the kernel — use the bridge actor's message bus.

## § 5 — Performance
- MUST lazy-load actors/windows not visible in the current viewport.
- MUST use `createMemo` for all derived/computed values to prevent re-computation.
- NEVER create anonymous functions inside JSX templates (causes unnecessary re-renders).
- Canvas renders MUST target 60fps. Profile before and after adding new spatial features.

## § 6 — Accessibility
- All interactive elements MUST have `aria-label` or `aria-labelledby`.
- Keyboard navigation MUST be supported for all window controls (move, resize, close).
- Color contrast MUST meet WCAG 2.1 AA minimum.
