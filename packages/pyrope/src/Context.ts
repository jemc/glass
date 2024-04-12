import {
  ButtonState,
  Component,
  Entity,
  Phase,
  registerComponent,
  SystemContext,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Coral } from "@glass/coral"
import { Camera, CameraFocusSystem } from "./Camera"
import {
  BodyUpdateSystem,
  JumpSystem,
  MoveSystem,
  SpawnOnStatusSystem,
} from "."

export class Context extends SystemContext {
  static readonly componentId = registerComponent(this)

  readonly buttons: ButtonState
  readonly playerPosition = new Opal.Position(0, 0)
  readonly camera = new Camera()
  readonly scene: Entity

  readonly world = this.coral.world
  readonly agate = this.coral.agate
  readonly opal = this.coral.opal

  constructor(
    readonly coral: Coral.Context,
    readonly config: { tileSize: number },
  ) {
    super()

    this.buttons = new ButtonState(this.world.clock)
    this.scene = this.create(
      this.camera,
      new Opal.Position(0, 0),
      new Opal.Renderable(),
    )

    this.world.addSystem(Phase.Action, SpawnOnStatusSystem, this)
    this.world.addSystem(Phase.Action, MoveSystem, this)
    this.world.addSystem(Phase.Action, JumpSystem, this)
    this.world.addSystem(Phase.Action, BodyUpdateSystem, this)

    this.world.addSystem(Phase.Reaction, CameraFocusSystem, this)
  }

  create(...components: Component[]): number {
    return this.world.create(
      this.agate,
      this.opal,
      this.coral,
      this,
      ...components,
    )
  }
}
