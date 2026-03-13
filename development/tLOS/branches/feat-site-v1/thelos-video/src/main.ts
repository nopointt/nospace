import * as THREE from "three"
import Scene1Chaos from "./scenes/scene1-chaos"
import Scene2Words from "./scenes/scene2-words"
import Scene3Monolith from "./scenes/scene3-monolith"
import Scene2to3Transition from "./scenes/scene2to3-transition"

class App {
  scene1: Scene1Chaos
  scene2: Scene2Words
  scene3: Scene3Monolith
  time: number = 0
  clock: THREE.Clock
  currentScene: "scene1" | "scene2" | "scene3" = "scene1"

  constructor() {
    const canvas = document.getElementById("webgl") as HTMLCanvasElement
    this.clock = new THREE.Clock()
    this.scene1 = new Scene1Chaos(canvas, () => {
      this.scene1.stop()
      canvas.style.opacity = "0"
      setTimeout(() => {
        this.scene2.play(() => {
          // Transition from scene2 to scene3
          const transition = new Scene2to3Transition(this.scene3)
          transition.play(() => {
            this.currentScene = "scene3"
            this.scene3.time = 0
          })
        })
      }, 500)
    })
    this.scene2 = new Scene2Words()
    this.scene3 = new Scene3Monolith(canvas)
    this.currentScene = "scene1"
    this.scene1.play()
    this.render()
  }

  playScene1() {
    this.currentScene = "scene1"
    this.scene1.play()
  }

  playScene3() {
    this.currentScene = "scene3"
    this.scene3.time = 0
  }

  render() {
    const delta = this.clock.getDelta()
    this.time += delta

    if (this.currentScene === "scene1") {
      this.scene1.render(delta)
    } else {
      this.scene3.render(delta)
    }

    requestAnimationFrame(this.render.bind(this))
  }
}

export default new App()
