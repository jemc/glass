import { registerComponent, Status, World } from "@glass/core"
import { Opal } from "@glass/opal"
import { Body } from "./Body"

export class Mover {
  static readonly componentId = registerComponent(this)

  constructor(readonly config: MoverConfig) {}
}

export interface MoverConfig {
  readonly [mode: string]: MoverModeConfig
}

export interface MoverModeConfig {
  readonly maxFrames?: number

  readonly verticalInitialVelocity?: number
  readonly horizontalInitialVelocity?: number
  readonly horizontalInitialSpeed?: number

  readonly verticalTargetVelocity?: number
  readonly verticalTargetVelocityIncrement?: number
  readonly horizontalTargetVelocity?: number
  readonly horizontalTargetVelocityIncrement?: number
  readonly horizontalTargetSpeed?: number
  readonly horizontalTargetSpeedIncrement?: number
}

export const MoveSystem = (world: World) =>
  world.systemFor([Mover, Status, Opal.Position, Body], {
    runEach(entity, mover, status, position, body) {
      status.each((name, statusConfig, initialFrame) => {
        const { frame } = world.clock

        const config = mover.config[name]
        if (!config) return

        if (config.verticalTargetVelocity !== undefined) {
          body.approachVerticalVelocity(
            config.verticalTargetVelocity,
            config.verticalTargetVelocityIncrement,
          )
        }
        if (
          config.verticalInitialVelocity !== undefined &&
          frame === initialFrame
        ) {
          body.setVerticalConstantVelocity(config.verticalInitialVelocity)
        }

        if (config.horizontalTargetVelocity !== undefined) {
          body.approachHorizontalVelocity(
            config.horizontalTargetVelocity,
            config.horizontalTargetVelocityIncrement,
          )
        } else if (config.horizontalTargetSpeed !== undefined) {
          body.approachHorizontalVelocity(
            config.horizontalTargetSpeed * position.direction.x,
            config.horizontalTargetSpeedIncrement,
          )
        }

        // Handle initial velocity if it's the first frame of this status.
        if (frame === initialFrame) {
          if (config.verticalInitialVelocity !== undefined) {
            body.setVerticalConstantVelocity(config.verticalInitialVelocity)
          }

          if (config.horizontalInitialVelocity !== undefined) {
            body.setHorizontalConstantVelocity(config.horizontalInitialVelocity)
          } else if (config.horizontalInitialSpeed !== undefined) {
            body.setHorizontalConstantVelocity(
              config.horizontalInitialSpeed * position.direction.x,
            )
          }
        }
      })
    },
  })
