import {
  registerComponent,
  World,
  SystemContext,
  Phase,
  Component,
} from "@glass/core"
import {
  StatusBringsComponentsSystem,
  StatusRemovesComponentsSystem,
  StatusAffectsGaugesSystem,
  GaugesSetStatusSystem,
  DestroyOnStatusSystem,
  StatusAdvanceSystem,
} from "."

export class Context extends SystemContext {
  static readonly componentId = registerComponent(this)

  constructor(readonly world: World) {
    super()

    this.world.addSystem(Phase.Action, StatusBringsComponentsSystem, this) // TODO: Should this be in Phase.Reaction instead?
    this.world.addSystem(Phase.Action, StatusRemovesComponentsSystem, this) // TODO: Should this be in Phase.Reaction instead?
    this.world.addSystem(Phase.Action, StatusAffectsGaugesSystem, this) // TODO: Should this be in Phase.Reaction instead?
    this.world.addSystem(Phase.Action, GaugesSetStatusSystem, this) // TODO: Should this be in Phase.Reaction instead?
    this.world.addSystem(Phase.Action, DestroyOnStatusSystem, this) // TODO: Should this be in Phase.Reaction instead?
    this.world.addSystem(Phase.Advance, StatusAdvanceSystem, this)
  }

  create(...components: Component[]): number {
    return this.world.create(this, ...components)
  }
}
