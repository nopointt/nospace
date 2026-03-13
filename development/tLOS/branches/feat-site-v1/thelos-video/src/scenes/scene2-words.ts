const ROWS = [
  { text: "Хочу все", duration: 700 },
  { text: "На одном", duration: 700 },
  { text: "Экране", duration: 900 },
]

const HOLD_TIME_AFTER = 600

export default class Scene2Words {
  private container: HTMLDivElement | null = null
  private rowElements: HTMLDivElement[] = []
  private onComplete?: () => void
  private timeouts: ReturnType<typeof setTimeout>[] = []

  constructor() {
    this.initDOM()
  }

  private initDOM() {
    // Create container if not exists
    let container = document.getElementById("scene2") as HTMLDivElement
    if (!container) {
      container = document.createElement("div") as HTMLDivElement
      container.id = "scene2"
      document.body.appendChild(container)
    }
    this.container = container

    // Apply all container styles explicitly
    container.style.position = "fixed"
    container.style.top = "0"
    container.style.left = "0"
    container.style.width = "100%"
    container.style.height = "100%"
    container.style.backgroundColor = "#ffffff"
    container.style.zIndex = "10"
    container.style.display = "none"
    container.style.flexDirection = "column"
    container.style.justifyContent = "center"
    container.style.alignItems = "center"
    container.style.margin = "0"
    container.style.padding = "0"

    // Clear existing children
    container.innerHTML = ""

    // Create wrapper for rows
    const wrapper = document.createElement("div")
    wrapper.style.display = "flex"
    wrapper.style.flexDirection = "column"
    wrapper.style.alignItems = "center"
    wrapper.style.letterSpacing = "-0.05em"
    wrapper.style.lineHeight = "0.9"
    wrapper.style.textTransform = "none"
    wrapper.style.textAlign = "center"

    // Create row elements
    this.rowElements = ROWS.map((row) => {
      const div = document.createElement("div")
      div.textContent = row.text
      div.style.visibility = "hidden"
      div.style.fontFamily = "'Inter', sans-serif"
      div.style.fontWeight = "600"
      div.style.fontSize = "clamp(52px, 8vw, 104px)"
      div.style.color = "#000"
      div.style.textAlign = "center"
      div.style.letterSpacing = "-0.05em"
      div.style.lineHeight = "0.9"
      div.style.display = "block"
      div.style.width = "100%"
      wrapper.appendChild(div)
      return div
    })

    container.appendChild(wrapper)
  }

  play(onComplete?: () => void) {
    this.stop()
    this.onComplete = onComplete

    if (!this.container) return

    // Show container
    this.container.style.display = "flex"

    // Reset all rows to hidden
    this.rowElements.forEach((row) => {
      row.style.visibility = "hidden"
    })

    // Sequence the rows
    let accumulatedTime = 0

    ROWS.forEach((row, index) => {
      const timeout = setTimeout(() => {
        this.rowElements[index].style.visibility = "visible"
      }, accumulatedTime)
      this.timeouts.push(timeout)
      accumulatedTime += row.duration
    })

    // Hold time after all rows shown
    const holdTimeout = setTimeout(() => {
      if (this.onComplete) {
        this.onComplete()
      }
    }, accumulatedTime + HOLD_TIME_AFTER)
    this.timeouts.push(holdTimeout)
  }

  stop() {
    this.timeouts.forEach((t) => clearTimeout(t))
    this.timeouts = []

    if (this.container) {
      this.container.style.display = "none"
    }

    this.rowElements.forEach((row) => {
      row.style.visibility = "hidden"
    })
  }

  dispose() {
    this.stop()
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    this.container = null
    this.rowElements = []
  }
}
