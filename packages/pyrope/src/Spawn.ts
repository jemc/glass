import {
  registerComponent,
  ReadVector2,
  System,
  SystemContext,
} from "@glass/core"
import { Status } from "@glass/agate"
import { Opal } from "@glass/opal"

type SpawnFn<C extends SystemContext> = (
  context: C,
  position: Opal.Position,
) => void

interface SpawnConfig<C extends SystemContext> {
  readonly fn: SpawnFn<C>
  readonly positionOffset?: ReadVector2
}

export class SpawnOnStatus<C extends SystemContext> {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly context: C,
    readonly map: Record<string, SpawnConfig<C>>,
  ) {}
}

export const SpawnOnStatusSystem = <C extends SystemContext>(pyrope: C) =>
  System.for(pyrope, [SpawnOnStatus, Status, Opal.Position], {
    shouldMatchAll: [SpawnOnStatus],

    runEach(entity, spawn, status, position) {
      const { coords, scale: direction } = position

      for (const [statusName, config] of Object.entries(spawn.map)) {
        if (status.isStarting(statusName)) {
          config.fn(
            spawn.context,
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
