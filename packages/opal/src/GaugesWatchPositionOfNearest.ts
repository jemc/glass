import { QueryLike, registerComponent, System } from "@glass/core"
import { Context } from "./Opal"
import { Position } from "./Position"
import { Gauges } from "@glass/agate"

export class GaugesWatchPositionOfNearest {
  static readonly componentId = registerComponent(this)

  constructor(readonly config: Record<string, QueryLike<[typeof Position]>>) {}
}

export const GaugesWatchPositionOfNearestSystem = (context: Context) =>
  System.for(context, [GaugesWatchPositionOfNearest, Gauges, Position], {
    shouldMatchAll: [GaugesWatchPositionOfNearest],

    runEach(entity, watch, gauges, position) {
      for (const [name, query] of Object.entries(watch.config)) {
        let nearestDeltaX = Infinity
        let nearestDeltaY = Infinity
        for (const [other, [otherPosition]] of query.entities) {
          const dx = otherPosition.x - position.x
          const dy = otherPosition.y - position.y
          if (
            (nearestDeltaX === Infinity && nearestDeltaY === Infinity) ||
            dx * dx + dy * dy <
              nearestDeltaX * nearestDeltaX + nearestDeltaY * nearestDeltaY
          ) {
            nearestDeltaX = dx
            nearestDeltaY = dy
          }
        }
        gauges.set(`${name}DeltaX`, nearestDeltaX)
        gauges.set(`${name}DeltaY`, nearestDeltaY)
      }
    },
  })
