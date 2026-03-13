import * as THREE from "three"
import vertexShader from "../shaders/chaos.vert"
import fragmentShader from "../shaders/chaos.frag"

const SCREENSHOTS = [
  "telegram",
  "gmail",
  "zoom",
  "slack",
  "github",
  "google-drive",
  "discord",
  "teams",
  "notion",
  "figma",
  "trello",
  "miro",
  "jira",
  "confluence",
  "asana",
  "monday",
  "clickup",
  "airtable",
  "linear",
  "wrike",
  "bitrix24",
  "amocrm",
  "yandex-metrika",
  "yandex-tracker",
  "hubspot",
  "salesforce",
  "retailcrm",
  "basecamp",
  "planfix",
  "megaplan",
]

const TIMINGS = [
  // Screens 1-10: 250ms each (2500ms total)
  0.25, 0.25, 0.25, 0.25, 0.25,
  0.25, 0.25, 0.25, 0.25, 0.25,
  // Screens 11-20: 100ms each (1000ms total)
  0.1, 0.1, 0.1, 0.1, 0.1,
  0.1, 0.1, 0.1, 0.1, 0.1,
  // Screens 21-30: 50ms each (500ms total)
  0.05, 0.05, 0.05, 0.05, 0.05,
  0.05, 0.05, 0.05, 0.05, 0.05,
]

export default class Scene1Chaos {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  mesh: THREE.Mesh
  material: THREE.ShaderMaterial
  geometry: THREE.PlaneGeometry

  private textures: THREE.Texture[] = []
  private currentScreenIndex: number = 0
  private isPlaying: boolean = false
  private timelineTimeouts: ReturnType<typeof setTimeout>[] = []
  private jitterIntensity: number = 0
  private velocity: THREE.Vector2 = new THREE.Vector2(0, 0)
  private onComplete?: () => void

  constructor(canvas: HTMLCanvasElement, onComplete?: () => void) {
    this.onComplete = onComplete
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)

    // Orthographic camera for full-screen quad
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    this.camera.position.z = 1

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))

    this.geometry = new THREE.PlaneGeometry(2, 2)

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uJitterIntensity: { value: 0 },
        uTexture: { value: null },
        uBlurAmount: { value: 0 },
        uVelocity: { value: new THREE.Vector2(0, 0) },
      },
    })

    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)

    this.loadTextures()

    window.addEventListener("resize", this.onResize.bind(this))
  }

  private loadTextures() {
    const loader = new THREE.TextureLoader()
    this.textures = SCREENSHOTS.map((name) => {
      const texture = loader.load(`/screenshots/${name}.jpg`)
      texture.colorSpace = THREE.SRGBColorSpace
      return texture
    })
  }

  private onResize() {
    this.camera.left = -1
    this.camera.right = 1
    this.camera.top = 1
    this.camera.bottom = -1
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  }

  play() {
    this.stop()
    this.currentScreenIndex = 0
    this.isPlaying = true
    this.jitterIntensity = 0
    this.startTimeline()
  }

  stop() {
    this.isPlaying = false
    this.clearTimeline()
    this.jitterIntensity = 0
    this.material.uniforms.uJitterIntensity.value = 0
    this.material.uniforms.uBlurAmount.value = 0
    this.material.uniforms.uVelocity.value = new THREE.Vector2(0, 0)
  }

  private startTimeline() {
    let accumulatedTime = 0

    for (let i = 0; i < SCREENSHOTS.length; i++) {
      const delay = TIMINGS[i] * 1000
      const timeout = setTimeout(() => {
        if (!this.isPlaying) return
        this.showScreen(i)
      }, accumulatedTime)
      this.timelineTimeouts.push(timeout)
      accumulatedTime += delay
    }

    // Call onComplete after all screens shown
    const finalTimeout = setTimeout(() => {
      // Reset blur to 0 before onComplete
      this.material.uniforms.uBlurAmount.value = 0
      if (this.onComplete) {
        this.onComplete()
      }
    }, accumulatedTime)
    this.timelineTimeouts.push(finalTimeout)
  }

  private clearTimeline() {
    this.timelineTimeouts.forEach((t) => clearTimeout(t))
    this.timelineTimeouts = []
  }

  private showScreen(index: number) {
    if (index < 0 || index >= this.textures.length) return
    this.material.uniforms.uTexture.value = this.textures[index]

    // Calculate jitter intensity based on progress (increases with speed)
    const progress = index / SCREENSHOTS.length
    this.jitterIntensity = Math.min(1, progress * 1.5)

    // Motion blur: gradually increases from 0 to 0.3 based on index
    const blurAmount = (index / (SCREENSHOTS.length - 1)) * 0.3
    this.material.uniforms.uBlurAmount.value = blurAmount

    // Random velocity for motion blur direction
    this.velocity.set(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    )
    this.material.uniforms.uVelocity.value = this.velocity
  }

  render(delta: number) {
    // Update jitter in real-time for signal instability effect
    if (this.isPlaying) {
      const time = Date.now() * 0.001
      const jitterNoise =
        Math.sin(time * 30) * Math.cos(time * 45) * 0.5 + 0.5
      this.material.uniforms.uJitterIntensity.value =
        this.jitterIntensity * jitterNoise
    }

    this.material.uniforms.uTime.value += delta
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    window.removeEventListener("resize", this.onResize.bind(this))
    this.stop()
    this.geometry.dispose()
    this.material.dispose()
    this.textures.forEach((t) => t.dispose())
  }
}
