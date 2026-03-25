# 2D Metaball / Liquid Blob Effects — No WebGL Research
> Lead/TechResearch | Date: 2025-03-25
> Scope: Canvas 2D, SVG filters, CSS filters. No Three.js, no WebGL.
> Goal: interactive liquid blobs, merging on proximity, cursor reaction, text labels, 60fps.

---

## 1. Technique Overview — Three Distinct Approaches

### 1.1 Canvas 2D — Radial Gradient + Pixel Threshold

**How it works:**
- Draw a radial gradient per blob onto an offscreen canvas (opaque center, transparent edge)
- Multiple gradients overlap, their alpha values ADD in the pixel buffer
- Read ImageData pixel-by-pixel: if alpha < threshold → set alpha=0, else → colorize
- putImageData onto visible canvas

**Key formula (field function):**
```
f(x, y) = sum_i [ r_i^2 / ((x - xi)^2 + (y - yi)^2) ]
threshold: f(x,y) >= 1 → inside blob
```

**The gradient trick:** each blob gradient is `rgba(0,0,0,1.0)` center → `rgba(0,0,0,0)` edge. When two gradients overlap, alpha accumulates above threshold — that IS the merge.

**Pixel loop (core):**
```javascript
const imageData = ctx.getImageData(0, 0, W, H);
const data = imageData.data;
const THRESHOLD = 160; // tune: lower = more sticky/merged
for (let i = 3; i < data.length; i += 4) { // only alpha channel
  if (data[i] < THRESHOLD) {
    data[i] = 0;         // transparent — outside blob
  } else {
    data[i - 3] = R;     // set color inside blob
    data[i - 2] = G;
    data[i - 1] = B;
    data[i]     = 255;   // fully opaque
  }
}
ctx.putImageData(imageData, 0, 0);
```

**Performance analysis (Jamie Wong):**
- Naive per-pixel on 700×500 with 40 blobs = 14M ops/frame × 60fps = 840M ops/sec — too slow
- Optimization 1: Marching Squares — only sample cell corners (16 states), not every pixel → 50-100x speedup
- Optimization 2: OffscreenCanvas + Web Worker → main thread free
- Optimization 3: Typed Arrays (Uint8ClampedArray) — already what ImageData uses
- Practical budget: ~10–20 blobs at 800×600 is fine at 60fps in vanilla JS without marching squares

**Text labels:**
- Draw text AFTER putImageData on the main canvas pass
- OR use a separate overlay `<div>` / `<canvas>` stacked above
- Cannot embed text inside the pixel threshold pass without it being thresholded too

---

### 1.2 CSS blur + contrast — The "Gooey" Trick

**How it works:**
- Container: `filter: contrast(20)` (or higher)
- Each blob element (div/circle): `filter: blur(15px)`
- White/solid background on container REQUIRED
- When blurred blobs overlap, their blurred edges add contrast above threshold → they visually fuse

**Exact CSS:**
```css
.stage {
  filter: contrast(20);
  background: white; /* CRITICAL — transparent bg breaks it */
}
.blob {
  border-radius: 50%;
  filter: blur(15px);
  background: black; /* or any color */
}
```

**Advanced (SVG filter via CSS — no background color constraint):**
```css
.stage {
  filter: url('#goo');
}
```
```html
<svg style="position:absolute;width:0;height:0">
  <defs>
    <filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0   0 1 0 0 0   0 0 1 0 0   0 0 0 18 -7"
        result="goo"/>
      <feBlend in="SourceGraphic" in2="goo"/>
    </filter>
  </defs>
</svg>
```

The `feBlend in="SourceGraphic"` at the end layers the ORIGINAL (unblurred) graphics on top — this is how text labels can survive: put labels as DOM elements OUTSIDE the filter container, position:absolute over the blobs.

**Text label strategy with CSS approach:**
```html
<div class="stage">          <!-- filter: contrast -->
  <div class="blobs-layer">  <!-- filter: blur (blobs only) -->
    <div class="blob"></div>
    <div class="blob"></div>
  </div>
</div>
<div class="labels-overlay"> <!-- NO filter, position:absolute, same coords -->
  <span class="label">Home</span>
</div>
```

**Performance:**
- GPU-accelerated (CSS filters run on compositor thread in modern browsers)
- Best for 5–30 blobs, degrades with very large filter areas
- `will-change: transform` on blobs helps
- Large `stdDeviation` or large container = more GPU load

**Limitations:**
- Solid background required (CSS pure variant) — can't have transparency through
- SVG filter variant breaks this restriction but adds SVG overhead
- Colors of merged area = blended average of blob colors (desirable for liquid look)

---

### 1.3 SVG Filter — feGaussianBlur + feColorMatrix (Primary Recommendation)

**Full implementation from antogarand/SVG Metaballs:**
```html
<svg height="100%" width="100%">
  <defs>
    <filter id="gooify" width="400%" x="-150%" height="400%" y="-150%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur"/>
      <feColorMatrix in="blur" mode="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 25 -15"/>
    </filter>
  </defs>
  <g filter="url(#gooify)">
    <circle cx="200" cy="200" r="90" fill="#6366f1"/>
    <circle cx="400" cy="200" r="90" fill="#6366f1"/>
  </g>
</svg>
```

**Filter breakdown:**
- `feGaussianBlur stdDeviation="20"` — blur amount (higher = more sticky merge radius)
- `feColorMatrix` alpha row: `0 0 0 25 -15` → alpha × 25 - 15×255 = sharp threshold
  - Increase multiplier (25 → 40) = sharper edges, less merge
  - Decrease (25 → 15) = softer edges, more merge at distance
- `width="400%" x="-150%"` — filter region must be larger than shape or blur gets clipped

**Mouse drag interaction:**
```javascript
let dragging = null, offset = {x:0, y:0};

circles.forEach(circle => {
  circle.addEventListener('mousedown', e => {
    dragging = circle;
    offset.x = e.clientX - +circle.getAttribute('cx');
    offset.y = e.clientY - +circle.getAttribute('cy');
  });
});
svg.addEventListener('mousemove', e => {
  if (!dragging) return;
  dragging.setAttribute('cx', e.clientX - offset.x);
  dragging.setAttribute('cy', e.clientY - offset.y);
});
svg.addEventListener('mouseup', () => dragging = null);
```

**Cursor proximity physics (spring-based, works with any approach):**
```javascript
function updateBlob(blob, mouseX, mouseY, dt) {
  const dx = mouseX - blob.x;
  const dy = mouseY - blob.y;
  const dist = Math.sqrt(dx*dx + dy*dy);

  if (dist < blob.influenceRadius) {
    // repulsion or attraction depending on design
    const force = (blob.influenceRadius - dist) / blob.influenceRadius;
    blob.vx -= dx/dist * force * blob.repulsion;
    blob.vy -= dy/dist * force * blob.repulsion;
  }

  // spring back to home position
  blob.vx += (blob.homeX - blob.x) * blob.spring;
  blob.vy += (blob.homeY - blob.y) * blob.spring;

  // damping
  blob.vx *= blob.damping;
  blob.vy *= blob.damping;

  blob.x += blob.vx;
  blob.y += blob.vy;
}
```

**Organic wobble via feTurbulence:**
```html
<filter id="organic">
  <feTurbulence type="fractalNoise" baseFrequency="0.015 0.015"
                numOctaves="3" seed="2" result="noise"/>
  <feDisplacementMap in="SourceGraphic" in2="noise"
                     scale="12" xChannelSelector="R" yChannelSelector="G"/>
  <feGaussianBlur stdDeviation="8" result="blur"/>
  <feColorMatrix in="blur" type="matrix"
    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"/>
</filter>
```

Animate the turbulence for organic morph:
```javascript
const turbulence = document.querySelector('feTurbulence');
let t = 0;
function animate() {
  t += 0.003;
  turbulence.setAttribute('baseFrequency', `${0.015 + Math.sin(t)*0.005} ${0.015 + Math.cos(t*0.7)*0.005}`);
  requestAnimationFrame(animate);
}
```

**Performance:** O(n) per filter pass — one Gaussian blur per shape, one color matrix for all. Scales well to 30+ blobs.

---

## 2. Comparison Matrix

| Criterion | Canvas 2D Pixel | CSS blur/contrast | SVG feGaussianBlur |
|---|---|---|---|
| Visual quality | High (precise) | High (natural) | High (natural) |
| Mercury/liquid look | Excellent | Excellent | Excellent |
| Performance (10 blobs) | 60fps OK | 60fps GPU | 60fps GPU |
| Performance (30+ blobs) | CPU strain | OK | OK |
| Text labels on blobs | Complex (2nd canvas) | DOM overlay | DOM overlay or SVG text |
| Mouse interaction | Full physics possible | DOM events + CSS | SVG events or JS |
| Colored blobs (multi-color) | Full control | Blends on merge | Blends on merge |
| Transparent background | YES | NO (CSS) / YES (SVG filter) | YES |
| Organic wobble | Needs manual noise | Via feTurbulence | Via feTurbulence |
| Dependencies | None | None | None |
| Code complexity | High | Low | Medium |
| Browser support | Excellent | Chrome/FF (Safari limited) | Good (Safari issues) |

---

## 3. Recommendation

### Primary: SVG filter approach (feGaussianBlur + feColorMatrix)

**Rationale:**
- Zero dependencies, pure browser APIs
- GPU-accelerated, 60fps for typical blob counts (5–30)
- Supports transparent backgrounds
- Best visual quality — looks exactly like liquid mercury
- Organic wobble built-in via feTurbulence
- Text labels trivial: SVG `<text>` elements OUTSIDE the `<g filter>` group, or DOM overlay
- Mouse cursor interaction: update SVG circle cx/cy via JS each frame
- Works on Canvas 2D container too (draw SVG to canvas via `drawImage`)

### Secondary: CSS blur + contrast (for simpler cases)
When you need quick DOM-based blobs, solid background acceptable, and don't need per-pixel control.

### Avoid for this use case: Canvas 2D pixel threshold
Performance risk at scale, complexity of text overlay, CPU-bound. Use only if you need exact pixel control or transparent background with coloring not achievable by SVG.

---

## 4. Complete Reference Implementation

### Architecture for "liquid blobs with labels, cursor physics, 60fps"

```html
<!-- Layer 1: SVG metaball canvas -->
<svg id="metaball-svg" style="position:absolute;inset:0;width:100%;height:100%">
  <defs>
    <filter id="metaball-filter" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0   0 1 0 0 0   0 0 1 0 0   0 0 0 22 -9"
        result="threshold"/>
      <!-- optional: feTurbulence for organic wobble -->
    </filter>
  </defs>

  <!-- Blobs: INSIDE the filter group -->
  <g filter="url(#metaball-filter)">
    <circle class="blob" cx="300" cy="300" r="80" fill="#6366f1"/>
    <circle class="blob" cx="500" cy="280" r="60" fill="#6366f1"/>
    <!-- cursor ghost blob — follows mouse, merges with others -->
    <circle id="cursor-blob" cx="-200" cy="-200" r="40" fill="#6366f1"/>
  </g>
</svg>

<!-- Layer 2: Labels — outside filter, positioned via JS -->
<div id="labels-layer" style="position:absolute;inset:0;pointer-events:none">
  <span class="blob-label" data-blob="0">Home</span>
  <span class="blob-label" data-blob="1">Work</span>
</div>
```

```javascript
const blobs = [
  { x: 300, y: 300, vx: 0, vy: 0, homeX: 300, homeY: 300, r: 80, el: null },
  { x: 500, y: 280, vx: 0, vy: 0, homeX: 500, homeY: 280, r: 60, el: null },
];
const SPRING = 0.04;
const DAMPING = 0.82;
const REPULSION = 8;
const INFLUENCE = 200;

let mouseX = -999, mouseY = -999;
const cursorBlob = document.getElementById('cursor-blob');

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorBlob.setAttribute('cx', mouseX);
  cursorBlob.setAttribute('cy', mouseY);
});

function tick() {
  blobs.forEach((b, i) => {
    const dx = mouseX - b.x;
    const dy = mouseY - b.y;
    const dist = Math.hypot(dx, dy);

    if (dist < INFLUENCE && dist > 1) {
      const force = (INFLUENCE - dist) / INFLUENCE;
      b.vx -= (dx / dist) * force * REPULSION;
      b.vy -= (dy / dist) * force * REPULSION;
    }

    b.vx += (b.homeX - b.x) * SPRING;
    b.vy += (b.homeY - b.y) * SPRING;
    b.vx *= DAMPING;
    b.vy *= DAMPING;
    b.x += b.vx;
    b.y += b.vy;

    b.el.setAttribute('cx', b.x);
    b.el.setAttribute('cy', b.y);

    // sync label position
    const label = document.querySelector(`[data-blob="${i}"]`);
    if (label) {
      label.style.left = (b.x - 30) + 'px';
      label.style.top  = (b.y - 8) + 'px';
    }
  });

  requestAnimationFrame(tick);
}
tick();
```

---

## 5. Key Gotchas and Tuning Guide

### feColorMatrix alpha row tuning
```
values="... 0 0 0 [MULT] [SHIFT]"

MULT × alpha - SHIFT × 255 > 0 → visible pixel

Examples:
  "0 0 0 18 -7"  → moderate merge, soft edges   (CSS-Tricks gooey)
  "0 0 0 22 -9"  → balanced — recommended start
  "0 0 0 25 -15" → sharper edges, less merge radius
  "0 0 0 40 -30" → very sharp, minimal merge
```

### feGaussianBlur stdDeviation → merge distance
- `stdDeviation="8"` — blobs must nearly touch to merge
- `stdDeviation="20"` — blobs merge from ~40px away (recommended for liquid)
- `stdDeviation="30"` — very sticky, merge from far

### CSS approach background constraint
- Pure CSS `filter: blur+contrast` REQUIRES solid background — transparency impossible
- SVG filter via `filter: url(#goo)` works on transparent → use this for overlaying on other content

### Text label anti-blur strategy (2 patterns)
1. DOM overlay: position labels absolutely, update coordinates each frame matching blob positions
2. SVG text outside filter `<g>`: `<text x="300" y="300">label</text>` after the `<g filter>` block — not blurred

### Safari compatibility
- `filter: url(#id)` on HTML elements — limited support in Safari (use SVG `<circle>` not HTML `<div>`)
- Inside SVG elements, filter works fine across all browsers
- Test on Safari before shipping

### Performance ceiling
- 30 blobs at 600×400 SVG filter: 60fps on modern mobile
- If performance degrades: reduce stdDeviation (smaller blur region), reduce SVG size, use `will-change: filter` on the `<g>` element

---

## 6. Design System Alignment (Bauhaus RAG)

Source files read: `design/contexter/guidelines/motion.md`, `design/design_system/guidelines/motion.md`, `design/design_system/time/movement.md`.

### Physics parameters mapped to tLOS motion tokens

The blob cursor-proximity physics (spring attraction/repulsion) is a continuous-gesture interaction — Rule 9 applies: **use spring physics, not fixed duration + easing**.

```
Spring parameters → settling time should approximate duration.medium (300ms)
Recommended starting values:
  stiffness: 120    (not too rigid — blobs are liquid, not mechanical)
  damping:   14     (underdamped slightly — one small overshoot, then settle)
  mass:      1
  → settling time ≈ 280–320ms ✓ (within duration.medium)
```

The blob return-to-home (spring back) = **Terrestrial path** in Klee's taxonomy: ease-out, deceleration, gravity-influenced. The blob rises from cursor push and falls back. This maps to `easing.enter` (ease-out) for the return stroke.

The cursor-approach push = **aktiv** energy mode (user-initiated). The return-to-rest = **passiv** (consequence of cursor leaving). Aktiv gets strongest visual response (larger repulsion radius), passiv gets gentlest (slow spring settle).

### Blob merge animation — Pendulum symbol

The merging and separating of blobs as they approach and retreat maps directly to **Das Pendel (Pendulum)** — Bewegungsausgleich. The merge is one extreme, the separation the other. The compositional arc between them IS the interaction. This validates that the metaball effect (gradual merge, gradual split) is formally correct per Bauhaus motion doctrine: it is a pendulum with visible arc, not a binary snap.

Do NOT use `transition: all 300ms` snap when blobs enter merge range — the continuous organic visual merge via filter is the correct Bewegungsausgleich form.

### Organic wobble — Spinning Top symbol

The feTurbulence organic wobble maps to **Der Kreisel (Spinning Top)** — stability through motion. Blobs should wobble slightly even at rest (very low baseFrequency animation, ~3-4px displacement). This communicates "alive, liquid" state — the system is in ruhigbewegt (calmly-moving) equilibrium.

Wobble parameters aligned to tLOS scale:
```
baseFrequency oscillation period: ~3000ms (Adagio — ambient, below threshold of attention)
Displacement scale: 4–8px (subtle — Sparsamkeit: minimum means)
feTurbulence type: "fractalNoise" (smoother than "turbulence" — calmer register)
```

### Text label transitions — duration.small

When blobs reposition in response to cursor, labels follow via JS coordinate sync. Label position transition:
```css
.blob-label {
  transition: left 200ms ease-out, top 200ms ease-out; /* duration.small, easing.enter */
}
```
200ms = duration.small, ease-out = easing.enter (label is arriving at new position). This is medial energy — label moves because the blob moved it.

### prefers-reduced-motion gate (mandatory)

```javascript
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function tick() {
  if (prefersReduced) {
    // skip spring physics — blobs stay at homeX/homeY
    // skip turbulence animation — keep baseFrequency static
    return;
  }
  // ... normal physics loop
  requestAnimationFrame(tick);
}
```

Turbulence animation must also respect this:
```javascript
if (!prefersReduced) {
  turbulence.setAttribute('baseFrequency', `${freq}`);
}
```

### Stagger rule for initial blob entrance

On first load, blobs should enter with stagger:
```
delay per blob: 50ms (within stagger.interval 30–50ms range)
duration: duration.small (200ms) with easing.enter (ease-out)
max total: blobs × 50ms ≤ stagger.max-total (300ms) → max 6 blobs in sequence; 7+ cap at 300ms total
```

### Energy mode summary for metaball interaction

| Moment | Klee energy | Visual treatment |
|---|---|---|
| Cursor approaches blob | Aktiv | Blob moves away visibly, immediate response |
| Blob springs back to rest | Passiv | Gentler spring, slower settle |
| Two blobs merge (filter) | Medial | Organic, no extra effect — the filter IS the response |
| Blob at rest (ambient wobble) | Medial/passive | Very subtle, Adagio register |
| Initial blob entrance | Aktiv | Staggered, ease-out, 200ms per blob |

---

## 8. Sources

- [The Gooey Effect — CSS-Tricks](https://css-tricks.com/gooey-effect/) — SVG filter technique, feColorMatrix breakdown
- [Shape Blobbing in CSS — CSS-Tricks](https://css-tricks.com/shape-blobbing-css/) — pure CSS blur+contrast
- [SVG Metaballs — DEV Community (antogarand)](https://dev.to/antogarand/svg-metaballs-35pj) — full SVG implementation with mouse drag
- [Metaballs and Marching Squares — Jamie Wong](https://jamie-wong.com/2014/08/19/metaballs-and-marching-squares/) — Canvas 2D pixel approach, performance math
- [Metaballs — Varun Vachhar](https://varun.ca/metaballs/) — SVG path generation technique (math-based, no filter)
- [2D Metaballs with Canvas — Somethinghitme](https://somethinghitme.com/2012/06/06/2d-metaballs-with-canvas/) — original canvas radial gradient approach
- [SVG Filter Effects: feTurbulence — Codrops](https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/) — organic wobble animation
- [Colored Metaballs with CSS filters — CodePen (wiledal)](https://codepen.io/wiledal/pen/mddxrMv) — colored multi-blob CSS approach
- [Metaballs — Marching Squares demo](https://jurasic.dev/marching_squares/) — interactive JS implementation
- [2D Metaballs Demo — Henry Schmale](https://www.henryschmale.org/2022/04/04/metaballs.html) — marching squares + canvas
