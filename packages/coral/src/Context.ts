import { Component, Phase, registerComponent, SystemContext } from "@glass/core"
import { Opal } from "@glass/opal"
import {
  StatusOnContactSystem,
  ResetBlockedBySystem,
  RefreshBlockedBySystem,
  StatusSetsBoundsSystem,
  VelocitySystem,
  SensorSystem,
} from "."
import { _CanBlockRefreshSystem1, _CanBlockRefreshSystem2 } from "./_CanBlock"

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

    this.world.addSystem(Phase.Impetus, StatusOnContactSystem, this)
    this.world.addSystem(Phase.Reaction, ResetBlockedBySystem, this)
    this.world.addSystem(Phase.Reaction, _CanBlockRefreshSystem1, this)
    this.world.addSystem(Phase.Reaction, _CanBlockRefreshSystem2, this)
    this.world.addSystem(Phase.Reaction, StatusSetsBoundsSystem, this)
    this.world.addSystem(Phase.Reaction, VelocitySystem, this)
    this.world.addSystem(Phase.Reaction, RefreshBlockedBySystem, this)
    this.world.addSystem(Phase.Reaction, SensorSystem, this)
  }

  create(...components: Component[]): number {
    return this.world.create(this.agate, this.opal, this, ...components)
  }
}
