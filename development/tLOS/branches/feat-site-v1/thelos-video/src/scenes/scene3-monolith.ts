import * as THREE from "three"
import vertexShader from "../shaders/monolith.vert"
import fragmentShader from "../shaders/monolith.frag"

export default class Scene3Monolith {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  mesh: THREE.Mesh
  material: THREE.ShaderMaterial
  time: number = 0

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xFFFFFF)

    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    this.camera.position.z = 5

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))

    this.createMonolith()

    window.addEventListener("resize", this.onResize.bind(this))
  }

  createMonolith() {
    // 4:5 aspect ratio plane
    const width = 2
    const height = 2.5
    const geometry = new THREE.PlaneGeometry(width, height, 64, 64)

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
    })

    this.mesh = new THREE.Mesh(geometry, this.material)
    this.scene.add(this.mesh)
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  }

  render(delta: number) {
    this.time += delta
    this.material.uniforms.uTime.value = this.time
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    window.removeEventListener("resize", this.onResize.bind(this))
    this.geometry.dispose()
    this.material.dispose()
  }

  private get geometry() {
    return this.mesh.geometry as THREE.PlaneGeometry
  }
}
