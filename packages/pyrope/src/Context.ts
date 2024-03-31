import { ButtonState, Entity, registerComponent, World } from "@glass/core"
import { Opal } from "@glass/opal"
import { Camera } from "./Camera"

export class Context {
  static readonly componentId = registerComponent(this)

  readonly buttons: ButtonState
  readonly playerPosition = new Opal.Position(0, 0)
  readonly camera = new Camera()
  readonly scene: Entity

  constructor(
    world: World,
    readonly opal: Opal.Context,
    readonly config: { tileSize: number },
  ) {
    this.buttons = new ButtonState(world.clock)
    this.scene = world.create([
      this,
      opal,
      this.camera,
      new Opal.Position(0, 0),
      new Opal.Renderable(),
    ])
  }
}
