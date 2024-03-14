import {
  prerequisiteComponents,
  registerComponent,
  MutableVector2,
} from "@glass/core"
import { Context } from "./Context"
import { Texture } from "./Texture"
import { Position } from "./Position"

export class Renderable {
  static readonly componentId = registerComponent(this)
  static readonly prerequisiteComponentIds = prerequisiteComponents(
    Context,
    Position,
  )

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
