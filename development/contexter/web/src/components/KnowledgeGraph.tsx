import { onMount, onCleanup, type Component } from "solid-js"

// ── Types ──────────────────────────────────────────────────────────────────

interface BlobDef {
  id: string
  label: string
  clientId: "chatgpt" | "claude-web" | "perplexity" | "cursor"
  homeX: number
  homeY: number
  r: number
}

// ── Logo SVG paths — real simple-icons data ───────────────────────────────
// All paths use viewBox 0 0 24 24 (except ChatGPT which is handled separately).
// Centered at origin via translate(-12,-12) inside the logo <g>.

// Claude — Anthropic logomark (simple-icons, viewBox 0 0 24 24)
const LOGO_CLAUDE_PATH = `m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z`

// Perplexity — simple-icons logomark (viewBox 0 0 24 24)
const LOGO_PERPLEXITY_PATH = `M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z`

// Cursor — simple-icons logomark (viewBox 0 0 24 24)
const LOGO_CURSOR_PATH = `M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23`

// ChatGPT — single petal path (simple-icons, viewBox 0 0 2406 2406, center 1203 1203)
// Rendered 6× with rotations 0/60/120/180/240/300° around center (1203,1203).
// Normalization: translate(-1203,-1203) scale(0.01663) → ±~20 unit box.
// Additional scale(0.7) to bring it to ±14 units, matching 24-unit logos visually.
const LOGO_CHATGPT_PETAL = `M1107.3 299.1c-197.999 0-373.9 127.3-435.2 315.3L650 743.5v427.9c0 21.4 11 40.4 29.4 51.4l344.5 198.515V833.3h.1v-27.9L1372.7 604c33.715-19.52 70.44-32.857 108.47-39.828L1447.6 450.3C1361 353.5 1237.1 298.5 1107.3 299.1zm0 117.5-.6.6c79.699 0 156.3 27.5 217.6 78.4-2.5 1.2-7.4 4.3-11 6.1L952.8 709.3c-18.4 10.4-29.4 30-29.4 51.4V1248l-155.1-89.4V755.8c-.1-187.099 151.601-338.9 339-339.2z`

// Map clientId → logo path string (used for Claude/Perplexity/Cursor)
// ChatGPT is rendered separately via <use> elements.
const LOGO_PATHS: Record<string, string> = {
  "claude-web": LOGO_CLAUDE_PATH,
  "perplexity": LOGO_PERPLEXITY_PATH,
  "cursor":     LOGO_CURSOR_PATH,
}

// Logo scale factor: for viewBox 0 0 24 24 logos centered at origin (±12 units).
// target: ±12 * (r * LOGO_SCALE_FACTOR) ≈ 0.46 * r  →  LOGO_SCALE_FACTOR ≈ 0.038
const LOGO_SCALE_FACTOR = 0.038  // ×r → for r=60: scale=2.28, ±12→±27.4px ≈ 46% of r

interface BlobState {
  x: number
  y: number
  vx: number
  vy: number
}

interface Props {
  onNodeClick: (clientId: "chatgpt" | "claude-web" | "claude-desktop" | "perplexity" | "cursor") => void
  connectedClients?: string[]
}

// ── Layout constants ───────────────────────────────────────────────────────

const VW = 480
const VH = 360

const BLOBS: BlobDef[] = [
  // A — ChatGPT (largest)
  { id: "chatgpt",    label: "chatgpt",    clientId: "chatgpt",    homeX: 130, homeY: 120, r: 60 },
  // B — Claude
  { id: "claude-web", label: "claude",     clientId: "claude-web", homeX: 350, homeY: 100, r: 60 },
  // C — Perplexity
  { id: "perplexity", label: "perplexity", clientId: "perplexity", homeX: 240, homeY: 220, r: 48 },
  // D — Cursor
  { id: "cursor",     label: "cursor",     clientId: "cursor",     homeX: 360, homeY: 280, r: 40 },
]

// ── Spring physics (Bauhaus spec) ─────────────────────────────────────────
// stiffness=120, damping=14, mass=1 → critically damped, mercury feel
// Per-frame integration at 60fps: dt = 1/60
const DT         = 1 / 60
const MASS       = 1
const STIFFNESS  = 120
const DAMP_COEFF = 14

// Cursor attraction parameters
const ATTRACT_FORCE = 0.18  // gentle pull (fraction of distance per frame, normalized)
const INFLUENCE     = 250   // px radius of cursor influence
const MAX_DISPLACE  = 0.35  // 35% of blob radius — enough for visible repulsion

// Color interpolation — gray → blue based on distance
const COLOR_NEAR = { r: 0x1E, g: 0x3E, b: 0xA0 }  // #1E3EA0
const COLOR_FAR  = { r: 0xD9, g: 0xD9, b: 0xD9 }  // #D9D9D9 — bg-elevated, clearly visible on #FAFAFA

// Idle blob fill color (matches COLOR_FAR)
const IDLE_FILL = "#D9D9D9"

// ── Idle floating (levitation) — Der Kreisel ─────────────────────────────
// Stability through motion (Klee b03 P-03). Blobs are spinning-top forms:
// their equilibrium is ruhigbewegt (calmly-moving), never static.
//
// Bauhaus Simultanitat rule (rhythm-tempo.md): simultaneous rhythms must
// use harmonically related frequencies — 2:3, 3:4, or 3:2 ratios.
// Base period = 4800ms. All others derive from this.
//
// Amplitude 6-12px — clearly visible floating. Each blob has unique character.
// Each blob has independent phase so no two ever peak simultaneously.
const _T = 4800  // base period ms
const FLOAT_PARAMS = [
  // Blob 0 — ChatGPT (largest): slow, wide orbit — confident, dominant
  { ax: 8,   fx: (2 * Math.PI) / (_T * 1.2), px: 0.0,    ay: 6,   fy: (2 * Math.PI) / (_T * 1.8), py: 1.05 },
  // Blob 1 — Claude: medium orbit, slightly faster — responsive, attentive
  { ax: 6,   fx: (2 * Math.PI) / (_T * 0.9), px: 2.09,   ay: 9,   fy: (2 * Math.PI) / (_T * 1.3), py: 4.19 },
  // Blob 2 — Perplexity: tight fast horizontal, slow vertical — curious, scanning
  { ax: 10,  fx: (2 * Math.PI) / (_T * 0.7), px: 3.14,   ay: 5,   fy: (2 * Math.PI) / (_T * 1.5), py: 1.57 },
  // Blob 3 — Cursor (smallest): quick, playful, bigger amplitude relative to size
  { ax: 12,  fx: (2 * Math.PI) / (_T * 0.6), px: 4.19,   ay: 7,   fy: (2 * Math.PI) / (_T * 0.85), py: 0.52 },
]

// ── Parallax ──────────────────────────────────────────────────────────────
const PARALLAX_MAX = 10  // px max parallax shift
const PARALLAX_FAR = 500 // px — distance at which parallax effect fades to 0

// ── Organic edge wobble (filter turbulence) ───────────────────────────────
const WOBBLE_BASE_FREQ = 0.015   // spatial frequency (higher = more detail)
const WOBBLE_SPEED     = 0.00006 // how fast the noise drifts (faster = more alive)
const WOBBLE_SCALE     = 6       // feDisplacementMap scale (px displacement)
const WOBBLE_NEAR_SCALE = 10     // intensified when cursor near

// ── Component ──────────────────────────────────────────────────────────────

const KnowledgeGraph: Component<Props> = (props) => {
  let svgRef: SVGSVGElement | undefined
  let rafId: number | undefined

  // Detect prefers-reduced-motion once on mount
  let reducedMotion = false

  // Live physics state — parallel array to BLOBS
  const state: BlobState[] = BLOBS.map((b) => ({ x: b.homeX, y: b.homeY, vx: 0, vy: 0 }))

  // Ghost blob (cursor follower)
  let ghostX = -9999
  let ghostY = -9999

  // Mouse position in SVG coords (SVG-local; -9999 = off-canvas)
  let mouseX = -9999
  let mouseY = -9999

  // Page-level mouse position in SVG coords for parallax
  // (uses getBoundingClientRect projection; updated via window mousemove)
  let pageMX = VW / 2
  let pageMY = VH / 2

  // Animation start time
  let startTime = 0

  // SVG element refs for blobs, labels, gradients, logos
  const circleEls: SVGCircleElement[] = []
  const labelEls: SVGTextElement[]    = []
  const gradEls: SVGRadialGradientElement[] = []
  const gradStop0: SVGStopElement[] = []  // inner stop (blue)
  const gradStop1: SVGStopElement[] = []  // outer stop (gray)
  const logoEls: SVGGElement[]        = []  // logo <g> elements (transform + fill)
  let ghostEl: SVGCircleElement | undefined

  // Logo color constants
  const LOGO_COLOR_FAR  = "#AAAAAA"  // idle: subtle gray on D9D9D9 blob
  const LOGO_COLOR_NEAR = "#FFFFFF"  // active: white when blob is blue

  // Filter element refs for wobble
  let turbEl: SVGFETurbulenceElement | undefined
  let displacementEl: SVGFEDisplacementMapElement | undefined

  // ── Color helpers ────────────────────────────────────────────────────────

  function lerpColor(t: number): string {
    // t = 0 → far (gray), t = 1 → near (blue)
    const r = Math.round(COLOR_FAR.r + (COLOR_NEAR.r - COLOR_FAR.r) * t)
    const g = Math.round(COLOR_FAR.g + (COLOR_NEAR.g - COLOR_FAR.g) * t)
    const b = Math.round(COLOR_FAR.b + (COLOR_NEAR.b - COLOR_FAR.b) * t)
    return `rgb(${r},${g},${b})`
  }

  function proximityFactor(distToMouse: number, blobRadius: number): number {
    // t=0 at INFLUENCE distance, t=1 at the blob's own edge (distToMouse = blobRadius)
    // Inside blob (distToMouse < blobRadius): clamp to 1
    if (distToMouse >= INFLUENCE) return 0
    if (distToMouse <= blobRadius) return 1
    // Linear ramp from INFLUENCE down to blobRadius
    return (INFLUENCE - distToMouse) / (INFLUENCE - blobRadius)
  }

  // ── Physics tick ────────────────────────────────────────────────────────

  function tick(timestamp: number) {
    if (startTime === 0) startTime = timestamp
    const elapsed = timestamp - startTime  // ms since mount

    if (reducedMotion) {
      // Snap to home, no animation
      for (let i = 0; i < BLOBS.length; i++) {
        state[i].x = BLOBS[i].homeX
        state[i].y = BLOBS[i].homeY
        state[i].vx = 0
        state[i].vy = 0
      }
      applyPositions(elapsed)
      return
    }

    // Update ghost blob toward cursor with a small lag (mercury weight)
    ghostX += (mouseX - ghostX) * 0.14
    ghostY += (mouseY - ghostY) * 0.14

    // Physics per blob — spring + cursor attraction
    // Spring anchor = homeX + floatOffset (not pure homeX), so spring
    // gently follows the levitation anchor rather than fighting it.
    for (let i = 0; i < BLOBS.length; i++) {
      const b = BLOBS[i]
      const s = state[i]
      const fp = FLOAT_PARAMS[i]

      // ── Idle float offsets (levitation) ──
      const floatDX = fp.ax * Math.sin(fp.fx * elapsed + fp.px)
      const floatDY = fp.ay * Math.sin(fp.fy * elapsed + fp.py)
      const floatAnchorX = b.homeX + floatDX
      const floatAnchorY = b.homeY + floatDY

      // ── Cursor ATTRACTION ──
      // Pull blob gently toward cursor when within influence radius
      const dxCursor = mouseX - s.x
      const dyCursor = mouseY - s.y
      const distCursor = Math.hypot(dxCursor, dyCursor)

      if (distCursor < INFLUENCE && distCursor > 1 && mouseX > -999) {
        const influenceFraction = (INFLUENCE - distCursor) / INFLUENCE
        // Slight REPULSION (40% of force) — blobs shy away from cursor
        const repulseScale = ATTRACT_FORCE * 0.3 * influenceFraction
        s.vx -= (dxCursor / distCursor) * repulseScale * distCursor * DT
        s.vy -= (dyCursor / distCursor) * repulseScale * distCursor * DT
      }

      // ── Spring back to float anchor (Bauhaus: stiffness=120, damping=14, mass=1) ──
      // F = -k * displacement - c * velocity
      // Anchor tracks the levitation position smoothly
      const dispX = s.x - floatAnchorX
      const dispY = s.y - floatAnchorY
      const springFx = -STIFFNESS * dispX - DAMP_COEFF * s.vx
      const springFy = -STIFFNESS * dispY - DAMP_COEFF * s.vy
      s.vx += (springFx / MASS) * DT
      s.vy += (springFy / MASS) * DT

      s.x += s.vx * DT
      s.y += s.vy * DT

      // ── Cap max displacement at 12% of radius (Bauhaus rule) ──
      // Displacement measured from the FLOAT anchor (not hard home)
      // so the cap only limits cursor-driven overshoot, not float range.
      const maxD = b.r * MAX_DISPLACE
      const clampDispX = s.x - floatAnchorX
      const clampDispY = s.y - floatAnchorY
      const clampDist = Math.hypot(clampDispX, clampDispY)
      if (clampDist > maxD) {
        const nx = clampDispX / clampDist
        const ny = clampDispY / clampDist
        // Clamp position
        s.x = floatAnchorX + nx * maxD
        s.y = floatAnchorY + ny * maxD
        // Zero out outward velocity component to prevent oscillation
        const outwardV = s.vx * nx + s.vy * ny
        if (outwardV > 0) {
          s.vx -= outwardV * nx
          s.vy -= outwardV * ny
        }
      }
    }

    applyPositions(elapsed)

    rafId = requestAnimationFrame(tick)
  }

  function applyPositions(elapsed: number) {
    const cursorInside = mouseX > 0 && mouseX < VW && mouseY > 0 && mouseY < VH

    // ── Organic wobble: animate turbulence seed ──
    // We shift the baseFrequency slightly over time — this makes the noise
    // pattern drift slowly without needing SMIL animation.
    // Alternative: shift seed attribute (integer jumps) — too choppy.
    // Better: oscillate a small offset on baseFrequency for smooth drift.
    if (turbEl && displacementEl) {
      const t = elapsed * WOBBLE_SPEED
      const freqX = WOBBLE_BASE_FREQ + 0.002 * Math.sin(t)
      const freqY = WOBBLE_BASE_FREQ + 0.002 * Math.cos(t * 1.3)
      turbEl.setAttribute("baseFrequency", `${freqX.toFixed(5)} ${freqY.toFixed(5)}`)

      // Wobble scale: intensify slightly when cursor is near any blob
      let maxProx = 0
      if (cursorInside) {
        for (let i = 0; i < BLOBS.length; i++) {
          const d = Math.hypot(mouseX - state[i].x, mouseY - state[i].y)
          const p = proximityFactor(d, BLOBS[i].r)
          if (p > maxProx) maxProx = p
        }
      }
      const wobbleScale = WOBBLE_SCALE + (WOBBLE_NEAR_SCALE - WOBBLE_SCALE) * maxProx
      displacementEl.setAttribute("scale", wobbleScale.toFixed(2))
    }

    for (let i = 0; i < BLOBS.length; i++) {
      const el = circleEls[i]
      const lblEl = labelEls[i]
      const b = BLOBS[i]
      const s = state[i]
      if (!el || !lblEl) continue

      // ── Parallax offset ──
      // Applied to final render position only — does NOT feed into physics.
      // Uses page-level mouse position (even when cursor is outside SVG).
      // Blobs closer to the page cursor shift more (inverse distance weighting).
      let parallaxX = 0
      let parallaxY = 0
      const dxPage = pageMX - s.x
      const dyPage = pageMY - s.y
      const distPage = Math.hypot(dxPage, dyPage)
      // Shift direction: toward cursor (blobs "lean in" slightly)
      // Scale: strongest at center (dist=0), fades at PARALLAX_FAR
      const parallaxT = Math.max(0, 1 - distPage / PARALLAX_FAR)
      // Also include a global sway: whole cluster shifts slightly
      // based on cursor position relative to SVG center
      const globalDX = (pageMX - VW / 2) / VW  // -0.5 to 0.5
      const globalDY = (pageMY - VH / 2) / VH
      parallaxX = globalDX * PARALLAX_MAX * (0.5 + parallaxT * 0.5)
      parallaxY = globalDY * PARALLAX_MAX * (0.5 + parallaxT * 0.5)

      const renderX = s.x + parallaxX
      const renderY = s.y + parallaxY

      el.setAttribute("cx", String(renderX))
      el.setAttribute("cy", String(renderY))

      // ── Proximity-based RADIAL GRADIENT ──
      // Blue radiates from the side of the blob closest to cursor
      const dxM = mouseX - s.x
      const dyM = mouseY - s.y
      const distToMouse = Math.hypot(dxM, dyM)
      const t = cursorInside ? proximityFactor(distToMouse, b.r) : 0

      const grad = gradEls[i]
      const stop0 = gradStop0[i]
      const stop1 = gradStop1[i]

      if (t > 0.01 && grad && stop0 && stop1) {
        // Direction from blob center toward cursor
        const dirLen = distToMouse > 1 ? distToMouse : 1
        const nx = dxM / dirLen
        const ny = dyM / dirLen

        // Focal point: ALWAYS at the cursor-facing edge (0.7*r).
        // This ensures the blue starts as a directional point, never a ring.
        // t only controls opacity/color intensity, NOT focal position.
        const focalShift = b.r * 0.7
        const fx = renderX + nx * focalShift
        const fy = renderY + ny * focalShift

        grad.setAttribute("cx", String(renderX))
        grad.setAttribute("cy", String(renderY))
        grad.setAttribute("fx", String(fx))
        grad.setAttribute("fy", String(fy))
        grad.setAttribute("r", String(b.r))

        // Stop 0 (focal / cursor-side): always full blue, opacity = t
        // At t=1 this is solid #1E3EA0 at the center
        stop0.setAttribute("stop-color", "#1E3EA0")
        stop0.setAttribute("stop-opacity", String(t))

        // Stop 1 (outer edge): lerp gray→blue directly by t
        // At t=1 both stops = solid blue → entire circle is flat #1E3EA0
        // At t=0 outer stop = gray → all gray (no gradient shown)
        stop1.setAttribute("stop-color", lerpColor(t))
        stop1.setAttribute("stop-opacity", "1")

        el.setAttribute("fill", `url(#blob-grad-${i})`)
        el.setAttribute("stroke", "none")
        el.setAttribute("stroke-width", "0")
      } else {
        el.setAttribute("fill", IDLE_FILL)
        el.setAttribute("stroke", "none")
        el.setAttribute("stroke-width", "0")
      }

      // Label: 8px below blob bottom edge (tracks rendered position)
      const labelY = renderY + b.r + 20
      lblEl.setAttribute("x", String(renderX))
      lblEl.setAttribute("y", String(labelY))
      // Label color: follow blob proximity
      const labelBlue = Math.round(0x33 + (0x1E - 0x33) * t)
      lblEl.setAttribute("fill", `rgb(${labelBlue},${Math.round(0x33 + (0x3E - 0x33) * t)},${Math.round(0x33 + (0xA0 - 0x33) * t)})`)

      // ── Logo: track blob position + interpolate fill gray→white ──
      const logoEl = logoEls[i]
      if (logoEl) {
        const logoScale = b.r * LOGO_SCALE_FACTOR
        logoEl.setAttribute("transform", `translate(${renderX},${renderY}) scale(${logoScale})`)
        // Interpolate fill: #AAAAAA (t=0) → #FFFFFF (t=1)
        // Set fill on the group — propagates to both <path> and <use> children
        const lc = Math.round(0xAA + (0xFF - 0xAA) * t)
        logoEl.setAttribute("fill", `rgb(${lc},${lc},${lc})`)
      }
    }

    // Ghost blob disabled — gradient handles cursor feedback now

    // Cursor pointer when near a blob
    if (svgRef) {
      let nearAny = false
      for (let i = 0; i < BLOBS.length; i++) {
        const d = Math.hypot(mouseX - state[i].x, mouseY - state[i].y)
        if (d < BLOBS[i].r + 24) { nearAny = true; break }
      }
      svgRef.style.cursor = nearAny ? "pointer" : "default"
    }
  }

  // ── Mouse handlers ───────────────────────────────────────────────────────

  function toSVGCoords(e: MouseEvent): { x: number; y: number } {
    if (!svgRef) return { x: 0, y: 0 }
    const rect = svgRef.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * VW,
      y: ((e.clientY - rect.top) / rect.height) * VH,
    }
  }

  // Page-level mouse → SVG coords for parallax (even outside SVG)
  function handlePageMouseMove(e: MouseEvent) {
    if (!svgRef) return
    const rect = svgRef.getBoundingClientRect()
    pageMX = ((e.clientX - rect.left) / rect.width) * VW
    pageMY = ((e.clientY - rect.top) / rect.height) * VH
  }

  function handleMouseMove(e: MouseEvent) {
    const { x, y } = toSVGCoords(e)
    // Teleport ghost to cursor on first entry (prevents fly-in from -9999)
    if (mouseX < -999) {
      ghostX = x
      ghostY = y
    }
    mouseX = x
    mouseY = y
    // Also update page position
    pageMX = x
    pageMY = y
  }

  function handleMouseLeave() {
    mouseX = -9999
    mouseY = -9999
    // Ghost drifts off-canvas naturally via lerp, then gets hidden by cursorInside check
  }

  function handleClick(e: MouseEvent) {
    const { x, y } = toSVGCoords(e)
    // Expanded hitbox: radius + 24px to cover label area below blob
    let bestIdx = -1
    let bestDist = Infinity
    for (let i = 0; i < BLOBS.length; i++) {
      const dist = Math.hypot(x - state[i].x, y - state[i].y)
      if (dist <= BLOBS[i].r + 24 && dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }
    if (bestIdx >= 0) {
      props.onNodeClick(BLOBS[bestIdx].clientId as any)
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  onMount(() => {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    svgRef!.addEventListener("mousemove", handleMouseMove)
    svgRef!.addEventListener("mouseleave", handleMouseLeave)
    svgRef!.addEventListener("click", handleClick)

    // Page-level listener for parallax (cursor anywhere on page)
    window.addEventListener("mousemove", handlePageMouseMove, { passive: true })

    rafId = requestAnimationFrame(tick)
  })

  onCleanup(() => {
    if (rafId !== undefined) cancelAnimationFrame(rafId)
    svgRef?.removeEventListener("mousemove", handleMouseMove)
    svgRef?.removeEventListener("mouseleave", handleMouseLeave)
    svgRef?.removeEventListener("click", handleClick)
    window.removeEventListener("mousemove", handlePageMouseMove)
  })

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        width={VW}
        height={VH}
        style={{ display: "block", overflow: "visible" }}
        aria-label="AI клиенты: ChatGPT, Claude, Perplexity, Cursor"
      >
        <defs>
          {/* ChatGPT petal path — referenced 6× via <use> with rotation */}
          <path
            id="gpt-petal"
            d={LOGO_CHATGPT_PETAL}
          />

          {/* Radial gradients for proximity-based blue glow per blob */}
          {BLOBS.map((b, i) => (
            <radialGradient
              id={`blob-grad-${i}`}
              ref={(el) => { gradEls[i] = el }}
              cx={String(b.homeX)} cy={String(b.homeY)} r={String(b.r)}
              fx={String(b.homeX)} fy={String(b.homeY)}
              gradientUnits="userSpaceOnUse"
            >
              <stop
                ref={(el) => { gradStop0[i] = el }}
                offset="0%"
                stop-color={IDLE_FILL}
                stop-opacity="1"
              />
              <stop
                ref={(el) => { gradStop1[i] = el }}
                offset="100%"
                stop-color={IDLE_FILL}
                stop-opacity="1"
              />
            </radialGradient>
          ))}

          {/*
            Goo filter with organic edge wobble:
            1. feTurbulence — slow noise field, evolves via setAttribute in RAF
            2. feDisplacementMap — deforms SourceGraphic edges using noise
            3. feGaussianBlur — original goo blur
            4. feColorMatrix — goo threshold (alpha sharpen)
            5. feComposite — restore original colors

            The turbulence + displacement must come BEFORE the blur so the
            deformed edges get blurred + goo'd together, not just shifted.
          */}
          <filter
            id="gooify"
            width="400%"
            x="-150%"
            height="400%"
            y="-150%"
            color-interpolation-filters="sRGB"
          >
            {/* Step 1 — organic edge deformation */}
            <feTurbulence
              ref={(el) => { turbEl = el as SVGFETurbulenceElement }}
              type="fractalNoise"
              baseFrequency={`${WOBBLE_BASE_FREQ} ${WOBBLE_BASE_FREQ}`}
              numOctaves="2"
              seed="42"
              result="noise"
            />
            <feDisplacementMap
              ref={(el) => { displacementEl = el as SVGFEDisplacementMapElement }}
              in="SourceGraphic"
              in2="noise"
              scale={String(WOBBLE_SCALE)}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            {/* Step 2 — goo merge (blur + threshold) */}
            <feGaussianBlur in="displaced" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>

        {/* ── Goo group: blobs + logos ── */}
        <g filter="url(#gooify)">
          {BLOBS.map((b, i) => (
            <>
              <circle
                ref={(el) => { circleEls[i] = el }}
                cx={b.homeX}
                cy={b.homeY}
                r={b.r}
                fill={IDLE_FILL}
                stroke="none"
                stroke-width="0"
                style={{ "pointer-events": "none" }}
              />
              <g
                ref={(el) => { logoEls[i] = el as SVGGElement }}
                transform={`translate(${b.homeX},${b.homeY}) scale(${b.r * LOGO_SCALE_FACTOR})`}
                fill={LOGO_COLOR_FAR}
                style={{ "pointer-events": "none" }}
              >
                {b.clientId === "chatgpt" ? (
                  /* ChatGPT: 6 petals, inline paths with rotation */
                  <g transform="scale(0.01163) translate(-1203,-1203)">
                    {[0, 60, 120, 180, 240, 300].map(deg => (
                      <path d={LOGO_CHATGPT_PETAL} transform={`rotate(${deg} 1203 1203)`} />
                    ))}
                  </g>
                ) : (
                  /* Claude / Perplexity / Cursor: viewBox 0 0 24 24, centered */
                  <g transform="translate(-12,-12)">
                    <path d={LOGO_PATHS[b.clientId] ?? ""} />
                  </g>
                )}
              </g>
            </>
          ))}
        </g>

        {/* ── Labels: OUTSIDE filter, never blurred ── */}
        {BLOBS.map((b, i) => (
          <text
            ref={(el) => { labelEls[i] = el }}
            x={b.homeX}
            y={b.homeY + b.r + 20}
            text-anchor="middle"
            fill="#333333"
            style={{
              "font-family": "'JetBrains Mono', monospace",
              "font-size": "12px",
              "font-weight": "500",
              "pointer-events": "none",
              "user-select": "none",
            }}
          >
            {b.label}
          </text>
        ))}
    </svg>
  )
}

export default KnowledgeGraph
