import { Entity, registerComponent, System } from "@glass/core"
import { Context } from "./Context"
import { Opal } from "@glass/opal"

const CURRENT_DEGREES = Symbol("Orbit._currentDegrees")

export class Orbit {
  static readonly componentId = registerComponent(this);

  // How many frames since the initial degrees began
  [CURRENT_DEGREES]: number

  constructor(
    readonly config: {
      around: Entity
      offset?: { x: number; y: number }
      radius: number
      degreesPerFrame: number
      initialDegrees?: number
    },
  ) {
    this[CURRENT_DEGREES] = this.config.initialDegrees ?? 0
  }
}

export const OrbitSystem = (context: Context) =>
  System.for(context, [Orbit, Opal.Position], {
    shouldMatchAll: [Orbit],

    runEach(entity, orbit, position) {
      orbit[CURRENT_DEGREES] += orbit.config.degreesPerFrame

      const center = context.world.get(orbit.config.around, Opal.Position)
      if (!center) return

      const radians = (orbit[CURRENT_DEGREES] * Math.PI) / 180
      position.updateCoords((coords) => {
        coords.x =
          center.x +
          (orbit.config.offset?.x ?? 0) +
          orbit.config.radius * Math.cos(radians)
        coords.y =
          center.y +
          (orbit.config.offset?.y ?? 0) +
          orbit.config.radius * Math.sin(radians)
      })
    },
  })
