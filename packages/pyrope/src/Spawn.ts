import { registerComponent, World, ReadVector2, System } from "@glass/core"
import { Status } from "@glass/agate"
import { Opal } from "@glass/opal"
import { Context } from "./Context"

type SpawnFn = (world: World, pyrope: Context, position: Opal.Position) => void

interface SpawnConfig {
  readonly positionOffset?: ReadVector2
}

export class SpawnOnStatus {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly statusName: string,
    readonly fn: SpawnFn,
    readonly config: SpawnConfig = {},
  ) {}
}

export const SpawnOnStatusSystem = (pyrope: Context) =>
  System.for(pyrope, [SpawnOnStatus, Status, Opal.Position], {
    shouldMatchAll: [SpawnOnStatus],

    runEach(entity, spawn, status, position) {
      const { statusName, fn, config } = spawn
      const { coords, scale: direction } = position

      if (status.isStarting(statusName)) {
        fn(
          pyrope.world,
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
