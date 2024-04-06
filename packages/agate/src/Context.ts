import {
  registerComponent,
  World,
  SystemContext,
  Phase,
  Component,
} from "@glass/core"
import { StatusSystem } from "."

export class Context extends SystemContext {
  static readonly componentId = registerComponent(this)

  constructor(readonly world: World) {
    super()

    this.world.addSystem(Phase.Action, StatusSystem, this)
  }

  create(...components: Component[]): number {
    return this.world.create(this, ...components)
  }
}
