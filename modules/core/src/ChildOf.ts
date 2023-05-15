import { Entity } from "./Entity"
import { registerComponent } from "./Component"

export class ChildOf {
  static readonly componentId = registerComponent(this)

  constructor(readonly parent: Entity) {}
}
