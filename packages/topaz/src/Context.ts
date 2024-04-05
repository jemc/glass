import {
  ButtonState,
  Entity,
  Phase,
  registerComponent,
  SystemContext,
  World,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Camera } from "./Camera"
import {
  CameraFocusSystem,
  LoadTileMapSpawnsSystem,
  SetBodyDepthSystem,
  WalkSystem,
  WarpPlayerSystem,
} from "."

export class Context extends SystemContext {
  static readonly componentId = registerComponent(this)

  readonly buttons: ButtonState
  readonly playerPosition = new Opal.Position(0, 0)
  readonly camera = new Camera()
  readonly scene: Entity

  readonly world = this.opal.world
  readonly agate = this.opal.agate

  constructor(
    readonly opal: Opal.Context,
    readonly config: { readonly tileSize: number },
  ) {
    super()

    this.buttons = new ButtonState(this.world.clock)
    this.scene = this.world.create([
      this,
      this.opal,
      this.camera,
      new Opal.Position(0, 0),
      new Opal.Renderable(),
    ])

    this.world.addSystem(Phase.Load, LoadTileMapSpawnsSystem, this)

    this.world.addSystem(Phase.Action, WalkSystem, this)
    this.world.addSystem(Phase.Action, WarpPlayerSystem, this)

    this.world.addSystem(Phase.Reaction, CameraFocusSystem, this)

    this.world.addSystem(Phase.PreRender, SetBodyDepthSystem, this)
  }
}
