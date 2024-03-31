import { registerComponent } from "@glass/core"
import { Direction } from "./Direction"
import { Context } from "./Context"

// A Body component is attached to anything that takes up physical
// space in the tile map and thus participates in tile-based collisions.
export class Body {
  static readonly componentId = registerComponent(this)

  canMove(direction: Direction) {
    return true // TODO
  }
}
