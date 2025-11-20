import { registerComponent, MutableVector2, ReadVector2 } from "@glass/core"

const VELOCITY = Symbol("Velocity._velocity")
const RESIDUALS = Symbol("Velocity._residuals")

export class Velocity {
  static readonly componentId = registerComponent(this);

  readonly [VELOCITY] = new MutableVector2();
  readonly [RESIDUALS] = new MutableVector2()

  // TODO: Find a better name for this.
  get vector(): ReadVector2 {
    return this[VELOCITY]
  }

  setVerticalConstantVelocity(speed: number) {
    this[VELOCITY].y = speed
    this[RESIDUALS].y = 0
  }

  setHorizontalConstantVelocity(speed: number) {
    this[VELOCITY].x = speed
    this[RESIDUALS].x = 0
  }

  approachVerticalVelocity(target: number, maxChange?: number) {
    if (!maxChange) {
      this[VELOCITY].y = target
      return
    }

    if (target > this[VELOCITY].y) {
      this[VELOCITY].y = Math.min(this[VELOCITY].y + maxChange, target)
    } else if (target < this[VELOCITY].y) {
      this[VELOCITY].y = Math.max(this[VELOCITY].y - maxChange, target)
    }
  }

  approachHorizontalVelocity(target: number, maxChange?: number) {
    if (!maxChange) {
      this[VELOCITY].x = target
      return
    }

    if (target > this[VELOCITY].x) {
      this[VELOCITY].x = Math.min(this[VELOCITY].x + maxChange, target)
    } else if (target < this[VELOCITY].x) {
      this[VELOCITY].x = Math.max(this[VELOCITY].x - maxChange, target)
    }
  }
}
