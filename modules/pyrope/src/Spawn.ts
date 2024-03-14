import {
  registerComponent,
  prerequisiteComponents,
  World,
  Status,
  ReadVector2,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"

type SpawnFn = (world: World, pyrope: Context, position: Opal.Position) => void

interface SpawnConfig {
  readonly positionOffset?: ReadVector2
}

export class SpawnOnStatus {
  static readonly componentId = registerComponent(this)
  static readonly prerequisiteComponentIds = prerequisiteComponents(
    Context,
    Status,
    Opal.Position,
  )

  constructor(
    readonly statusName: string,
    readonly fn: SpawnFn,
    readonly config: SpawnConfig = {},
  ) {}
}

export const SpawnOnStatusSystem = (world: World) =>
  world.systemFor([SpawnOnStatus, Context, Status, Opal.Position], {
    runEach(entity, spawn, pyrope, status, position) {
      const { statusName, fn, config } = spawn
      const { coords, scale: direction } = position

      if (status.isStarting(statusName)) {
        fn(
          world,
          pyrope,
          new Opal.Position(
            coords.x + (config.positionOffset?.x ?? 0) * direction.x,
            coords.y + (config.positionOffset?.y ?? 0) * direction.y,
            direction.x,
            direction.y,
          ),
        )
      }
    },
  })
