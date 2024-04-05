import { registerComponent, World, Clock, System } from "@glass/core"
import { Opal } from "@glass/opal"
import { Body } from "./Body"
import { Context } from "./Context"

export class Jumper {
  static readonly componentId = registerComponent(this)

  constructor(readonly config: JumperConfig) {}

  private startedJumpAt = -1
  get isJumping() {
    return this.startedJumpAt > -1
  }
  startJump(clock: Clock) {
    this.startedJumpAt = clock.frame
  }
  stopJump() {
    this.startedJumpAt = -1
  }
  maybeExpire(clock: Clock) {
    if (
      this.isJumping &&
      clock.frame - this.startedJumpAt > this.config.maxJumpFrames
    ) {
      this.stopJump()
    }
  }
}

export interface JumperConfig {
  // Maximum number of frames that the jumper can get upward movement
  // before the jump "expires" and ends.
  maxJumpFrames: number

  // Upward speed of the jumper when actively jumping.
  jumpSpeed: number

  // Downward speed of the jumper when in freefall.
  terminalSpeed: number
}

export const JumpSystem = (pyrope: Context) =>
  System.for(pyrope, [Jumper, Opal.Position, Body], {
    shouldMatchAll: [Jumper],

    runEach(entity, jumper, position, body) {
      jumper.maybeExpire(pyrope.world.clock)

      if (jumper.isJumping) {
        body.setVerticalConstantVelocity(-jumper.config.jumpSpeed)
      } else {
        body.setVerticalConstantVelocity(jumper.config.terminalSpeed)
      }
    },
  })
