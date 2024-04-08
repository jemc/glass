import {
  registerComponent,
  World,
  SystemContext,
  Phase,
  Component,
} from "@glass/core"
import { StatusAdvanceSystem, StatusAffectsGaugesSystem } from "."

export class Context extends SystemContext {
  static readonly componentId = registerComponent(this)

  constructor(readonly world: World) {
    super()

    this.world.addSystem(Phase.Action, StatusAffectsGaugesSystem, this) // TODO: Should this be in Phase.Reaction instead?
    this.world.addSystem(Phase.Advance, StatusAdvanceSystem, this)
  }

  create(...components: Component[]): number {
    return this.world.create(this, ...components)
  }
}
