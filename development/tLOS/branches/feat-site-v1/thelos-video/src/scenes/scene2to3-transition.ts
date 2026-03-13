import Scene3Monolith from "./scene3-monolith"

interface CharObject {
  char: string
  x: number
  y: number
  width: number
  height: number
  phase: number
  startX: number
  startY: number
  targetX: number
  targetY: number
}

const PHASE1_DURATION = 1500
const PHASE2_DURATION = 2000
const PHASE3_DURATION = 400

export default class Scene2to3Transition {
  private scene3: Scene3Monolith
  private overlay: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private rafId: number | null = null
  private chars: CharObject[] = []
  private startTime: number = 0
  private onComplete?: () => void
  private webglCanvas: HTMLCanvasElement | null = null

  constructor(scene3: Scene3Monolith) {
    this.scene3 = scene3
    this.webglCanvas = document.getElementById("webgl") as HTMLCanvasElement | null
  }

  play(onComplete?: () => void) {
    this.stop()
    this.onComplete = onComplete

    // Collect character positions from scene2 rows (while scene2 is still visible)
    this.collectCharacters()

    // Hide scene2 DOM div
    const scene2Div = document.getElementById("scene2")
    if (scene2Div) {
      scene2Div.style.display = "none"
    }

    // Create overlay canvas
    this.overlay = document.createElement("canvas")
    this.overlay.style.position = "fixed"
    this.overlay.style.top = "0"
    this.overlay.style.left = "0"
    this.overlay.style.width = "100%"
    this.overlay.style.height = "100%"
    this.overlay.style.zIndex = "20"
    this.overlay.style.pointerEvents = "none"
    document.body.appendChild(this.overlay)

    const rect = this.overlay.getBoundingClientRect()
    this.overlay.width = rect.width
    this.overlay.height = rect.height

    this.ctx = this.overlay.getContext("2d")
    if (!this.ctx) return

    this.startTime = performance.now()
    this.animate()
  }

  private collectCharacters() {
    // Create offscreen canvas for text measurements
    const offscreenCanvas = document.createElement("canvas")
    const ctx = offscreenCanvas.getContext("2d")
    if (!ctx) return

    // Calculate font size: Math.min(Math.max(52, window.innerWidth * 0.08), 104)
    const fontSize = Math.min(Math.max(52, window.innerWidth * 0.08), 104)
    const lineHeight = fontSize * 0.9

    // Set font for measurements
    ctx.font = "600 " + fontSize + "px Inter, sans-serif"

    // Lines to render
    const rows = ["Хочу все", "На одном", "Экране"]

    // Calculate total height and starting Y to center vertically
    const totalHeight = rows.length * lineHeight
    const startY = (window.innerHeight - totalHeight) / 2 + fontSize * 0.1

    rows.forEach((rowText, rowIndex) => {
      // Measure the full row width
      const rowWidth = ctx.measureText(rowText).width

      // Center the row horizontally
      const rowStartX = (window.innerWidth - rowWidth) / 2

      // Calculate Y for this row
      const rowY = startY + rowIndex * lineHeight

      // Split row into characters and calculate cumulative positions
      let cumulativeWidth = 0
      for (let i = 0; i < rowText.length; i++) {
        const char = rowText[i]
        if (char === " ") {
          // Measure space width
          const spaceWidth = ctx.measureText(" ").width
          cumulativeWidth += spaceWidth
          continue
        }

        // Measure character width
        const charWidth = ctx.measureText(char).width

        // Calculate character center X
        const charX = rowStartX + cumulativeWidth + charWidth / 2
        const charY = rowY

        this.chars.push({
          char,
          x: charX,
          y: charY,
          width: charWidth,
          height: fontSize,
          phase: Math.random() * Math.PI * 2,
          startX: charX,
          startY: charY,
          targetX: 0,
          targetY: 0,
        })

        cumulativeWidth += charWidth
      }
    })

    // Calculate target positions for phase 2
    this.calculateTargetPositions()
  }

  private calculateTargetPositions() {
    const width = Math.min(window.innerWidth * 0.35, window.innerHeight * 0.55)
    const height = width * (5 / 4)
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const targetLeft = centerX - width / 2
    const targetTop = centerY - height / 2

    // Distribute characters in a grid within targetRect
    const cols = Math.ceil(Math.sqrt(this.chars.length * (width / height)))
    const rows = Math.ceil(this.chars.length / cols)
    const cellWidth = width / cols
    const cellHeight = height / rows

    this.chars.forEach((char, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      char.targetX = targetLeft + col * cellWidth + cellWidth / 2
      char.targetY = targetTop + row * cellHeight + cellHeight / 2
    })
  }

  private animate() {
    if (!this.ctx || !this.overlay) return

    const elapsed = performance.now() - this.startTime
    const totalDuration = PHASE1_DURATION + PHASE2_DURATION + PHASE3_DURATION

    if (elapsed < PHASE1_DURATION) {
      // Phase 1: Breathing
      this.renderPhase1(elapsed)
    } else if (elapsed < PHASE1_DURATION + PHASE2_DURATION) {
      // Phase 2: Convergence
      this.renderPhase2(elapsed - PHASE1_DURATION)
    } else if (elapsed < totalDuration) {
      // Phase 3: Merge
      this.renderPhase3(elapsed - PHASE1_DURATION - PHASE2_DURATION)
    } else {
      // Done
      this.cleanup()
      if (this.onComplete) {
        this.onComplete()
      }
      return
    }

    this.rafId = requestAnimationFrame(this.animate.bind(this))
  }

  private renderPhase1(elapsed: number) {
    if (!this.ctx) return

    const ctx = this.ctx
    const width = this.overlay!.width
    const height = this.overlay!.height

    // Ensure WebGL canvas is hidden during phase 1
    if (this.webglCanvas) {
      this.webglCanvas.style.opacity = "0"
    }

    // White background
    ctx.fillStyle = "rgba(255, 255, 255, 1)"
    ctx.fillRect(0, 0, width, height)

    // Draw each character with breathing effect
    ctx.fillStyle = "#000000"
    ctx.font = "600 72px 'Inter', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    const time = elapsed / 1000
    this.chars.forEach((char) => {
      const breathY = Math.sin(time * 1.2 + char.phase) * 3
      ctx.fillText(char.char, char.x, char.y + breathY)
    })
  }

  private renderPhase2(elapsed: number) {
    if (!this.ctx) return

    const ctx = this.ctx
    const width = this.overlay!.width
    const height = this.overlay!.height

    const progress = Math.min(elapsed / PHASE2_DURATION, 1)
    const easeProgress = this.easeInOut(progress)

    // Background: white to black using rgba
    ctx.fillStyle = `rgba(0, 0, 0, ${easeProgress})`
    ctx.fillRect(0, 0, width, height)

    // Draw each character converging to target with growing fontSize
    const fontSize = 72
    const currentFontSize = fontSize * (1 + progress * 1.5)
    ctx.font = `600 ${currentFontSize}px 'Inter', sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    this.chars.forEach((char) => {
      const currentX = this.lerp(char.startX, char.targetX, easeProgress)
      const currentY = this.lerp(char.startY, char.targetY, easeProgress)

      // Fill text only (no stroke)
      ctx.fillStyle = "#000000"
      ctx.fillText(char.char, currentX, currentY)
    })
  }

  private renderPhase3(elapsed: number) {
    if (!this.ctx) return

    const ctx = this.ctx
    const width = this.overlay!.width
    const height = this.overlay!.height

    const progress = Math.min(elapsed / PHASE3_DURATION, 1)
    const easeProgress = this.easeInOut(progress)

    // Calculate target rect
    const targetWidth = Math.min(window.innerWidth * 0.35, window.innerHeight * 0.55)
    const targetHeight = targetWidth * (5 / 4)
    const targetX = window.innerWidth / 2 - targetWidth / 2
    const targetY = window.innerHeight / 2 - targetHeight / 2

    // Draw black rectangle
    ctx.fillStyle = "#000000"
    ctx.fillRect(targetX, targetY, targetWidth, targetHeight)

    // Fade out overlay
    const overlayOpacity = 1 - easeProgress
    if (this.overlay) {
      this.overlay.style.opacity = overlayOpacity.toString()
    }

    // Fade in WebGL canvas
    if (this.webglCanvas) {
      this.webglCanvas.style.opacity = easeProgress.toString()
    }
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.cleanup()
  }

  private cleanup() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay)
    }
    this.overlay = null
    this.ctx = null
    this.chars = []

    // Ensure WebGL canvas is fully visible
    if (this.webglCanvas) {
      this.webglCanvas.style.opacity = "1"
    }
  }

  dispose() {
    this.stop()
  }
}
