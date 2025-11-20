import {
  registerComponent,
  ReadVector2,
  MutableVector2,
  System,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"
import { Coral } from "@glass/coral"

export class Body {
  static readonly componentId = registerComponent(this)

  passThroughSolids: boolean = false

  tap(callback: (body: this) => void) {
    callback(this)
    return this
  }

  private previousCoords = new MutableVector2(0, 0)
  private latestSolidCollisionBits = CollisionBits.None

  get isTouchingBottomSolid() {
    return (this.latestSolidCollisionBits & CollisionBits.Bottom) !== 0
  }

  get isTouchingTopSolid() {
    return (this.latestSolidCollisionBits & CollisionBits.Top) !== 0
  }

  get isTouchingLeftSolid() {
    return (this.latestSolidCollisionBits & CollisionBits.Left) !== 0
  }

  get isTouchingRightSolid() {
    return (this.latestSolidCollisionBits & CollisionBits.Right) !== 0
  }

  updatePosition(
    position: Opal.Position,
    bounds: Coral.Bounds,
    collisions: Coral.Collisions,
  ) {
    this.previousCoords.copyFrom(position.coords)

    if (!this.passThroughSolids) {
      this.latestSolidCollisionBits = 0

      for (const [i, collision] of collisions.results()) {
        if (collision.normalA.y < 0)
          this.latestSolidCollisionBits |= CollisionBits.Top
        if (collision.normalA.y > 0)
          this.latestSolidCollisionBits |= CollisionBits.Bottom
        if (collision.normalA.x < 0)
          this.latestSolidCollisionBits |= CollisionBits.Left
        if (collision.normalA.x > 0)
          this.latestSolidCollisionBits |= CollisionBits.Right
      }
    }
  }
}

export const BodyUpdateSystem = (pyrope: Context) =>
  System.for(pyrope, [Body, Opal.Position, Coral.Bounds, Coral.Collisions], {
    shouldMatchAll: [Body],

    runEach(entity, body, position, bounds, collisions) {
      body.updatePosition(position, bounds, collisions)
    },
  })

enum CollisionBits {
  None = 0,
  Bottom = 0b1,
  Top = 0b10,
  Left = 0b100,
  Right = 0b1000,
}
