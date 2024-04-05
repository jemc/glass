import { registerComponent, World, SystemContext, Phase } from "@glass/core"
import { StatusSystem } from "."

export class Context extends SystemContext {
  static readonly componentId = registerComponent(this)

  constructor(readonly world: World) {
    super()

    this.world.addSystem(Phase.Action, StatusSystem, this)
  }
}
