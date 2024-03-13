import { MutableVector2, registerComponent } from "@glass/core"
import { Texture } from "./Texture"

export class Renderable {
  static readonly componentId = registerComponent(this)

  texture?: Texture
  pivot = new MutableVector2(0, 0)
  alpha = 1
  depth = 0
  visible = true

  constructor(opts?: { visible?: boolean; depth?: number; alpha?: number }) {
    this.alpha = opts?.alpha ?? 1
    this.depth = opts?.depth ?? 0
    this.visible = opts?.visible ?? true
  }
}
