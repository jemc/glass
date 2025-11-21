import { registerComponent, World, ReadVector2, System } from "@glass/core"
import { Status } from "@glass/agate"
import { Opal } from "@glass/opal"
import { Context } from "./Context"

type SpawnFn = (world: World, pyrope: Context, position: Opal.Position) => void

interface SpawnConfig {
  readonly fn: SpawnFn
  readonly positionOffset?: ReadVector2
}

export class SpawnOnStatus {
  static readonly componentId = registerComponent(this)

  constructor(readonly map: Record<string, SpawnConfig>) {}
}

export const SpawnOnStatusSystem = (pyrope: Context) =>
  System.for(pyrope, [SpawnOnStatus, Status, Opal.Position], {
    shouldMatchAll: [SpawnOnStatus],

    runEach(entity, spawn, status, position) {
      const { coords, scale: direction } = position

      for (const [statusName, config] of Object.entries(spawn.map)) {
        if (status.isStarting(statusName)) {
          config.fn(
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
      }
    },
  })
