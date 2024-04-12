import { Component, Phase, registerComponent, SystemContext } from "@glass/core"
import { Opal } from "@glass/opal"
import {
  StatusSetsBoundsSystem,
  SpatialIndexSystem,
  SpatialIndexPruneSystem,
} from "."

const TODO = Symbol("TODO")

export class Context extends SystemContext {
  static readonly componentId = registerComponent(this)

  readonly world = this.opal.world
  readonly agate = this.opal.agate

  constructor(
    readonly opal: Opal.Context,
    readonly config: { [TODO]?: string } = {},
  ) {
    super()

    this.world.addSystem(Phase.Reaction, StatusSetsBoundsSystem, this)
    this.world.addSystem(Phase.Reaction, SpatialIndexSystem, this)
    this.world.addSystem(Phase.Reaction, SpatialIndexPruneSystem, this)
  }

  create(...components: Component[]): number {
    return this.world.create(this.agate, this.opal, this, ...components)
  }
}
