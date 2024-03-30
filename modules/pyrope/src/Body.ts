import type { Writable } from "type-fest"
import {
  registerComponent,
  World,
  ReadVector2,
  MutableVector2,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"

export class Body {
  static readonly componentId = registerComponent(this)

  passThroughSolids: boolean = false

  readonly width: number = 0
  readonly height: number = 0
  readonly offsetX: number = 0
  readonly offsetY: number = 0
  readonly offsetLeft: number = 0
  readonly offsetRight: number = 0
  readonly offsetTop: number = 0
  readonly offsetBottom: number = 0

  tap(callback: (body: this) => void) {
    callback(this)
    return this
  }

  updateSize(
    width: number,
    height: number,
    offsetX: number = 0,
    offsetY: number = 0,
  ) {
    const self: Writable<Body> = this

    const halfWidth = width / 2
    const halfHeight = height / 2

    self.width = width
    self.height = height
    self.offsetX = offsetX
    self.offsetY = offsetY
    self.offsetLeft = (offsetX ?? 0) - halfWidth
    self.offsetRight = (offsetX ?? 0) + halfWidth
    self.offsetTop = (offsetY ?? 0) - halfHeight
    self.offsetBottom = (offsetY ?? 0) + halfHeight
  }

  constructor(...args: Parameters<typeof Body.prototype.updateSize>) {
    this.updateSize(...args)
  }

  private velocity = new MutableVector2(0, 0)
  private residuals = new MutableVector2(0, 0)
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

  get isMovingLeft() {
    return this.velocity.x < 0
  }

  get isMovingRight() {
    return this.velocity.x > 0
  }

  get horizontalSpeed() {
    return Math.abs(this.velocity.x)
  }

  setVerticalConstantVelocity(speed: number) {
    this.velocity.y = speed
    this.residuals.y = 0
  }

  setHorizontalConstantVelocity(speed: number) {
    this.velocity.x = speed
    this.residuals.x = 0
  }

  approachVerticalVelocity(target: number, maxChange?: number) {
    if (!maxChange) {
      this.velocity.y = target
      return
    }

    if (target > this.velocity.y) {
      this.velocity.y = Math.min(this.velocity.y + maxChange, target)
    } else if (target < this.velocity.y) {
      this.velocity.y = Math.max(this.velocity.y - maxChange, target)
    }
  }

  approachHorizontalVelocity(target: number, maxChange?: number) {
    if (!maxChange) {
      this.velocity.x = target
      return
    }

    if (target > this.velocity.x) {
      this.velocity.x = Math.min(this.velocity.x + maxChange, target)
    } else if (target < this.velocity.x) {
      this.velocity.x = Math.max(this.velocity.x - maxChange, target)
    }
  }

  updatePosition(
    position: Opal.Position,
    collisionsTruth: CollisionsTruth | undefined,
  ) {
    this.previousCoords.copyFrom(position.coords)

    position.updateCoords((coords) => {
      coords
        .plusEquals(this.residuals)
        .plusEquals(this.velocity)
        .toRoundedCapturingResiduals(this.residuals)

      if (!this.passThroughSolids && collisionsTruth) {
        this.latestSolidCollisionBits = collisionsTruth.stopAtSolids(
          coords,
          this.previousCoords,
          this,
        )

        if (
          (this.isTouchingLeftSolid && this.velocity.x < 0) ||
          (this.isTouchingRightSolid && this.velocity.x > 0)
        ) {
          this.velocity.x = 0
          this.residuals.x = 0
        }
        if (
          (this.isTouchingTopSolid && this.velocity.y < 0) ||
          (this.isTouchingBottomSolid && this.velocity.y > 0)
        ) {
          this.velocity.y = 0
          this.residuals.y = 0
        }
      }
    })
  }
}

export const BodyUpdateSystem = (world: World) =>
  world.systemFor([Context, Body, Opal.Position], {
    shouldMatchAll: [Body],

    runEach(entity, context, body, position) {
      // TODO: less hard-coded here
      const tileMap = context.opal.tileMaps.get(
        "data/mega/levels/TestLevel.aseprite",
      )
      const collisions = tileMap && new CollisionsTruth(tileMap.layer("Solids"))

      body.updatePosition(position, collisions)
    },
  })

enum CollisionBits {
  None = 0,
  Bottom = 0b1,
  Top = 0b10,
  Left = 0b100,
  Right = 0b1000,
}

class CollisionsTruth {
  constructor(private solidsLayer: Opal.TileMapLayer) {}

  // Given a body's new coordinates and its previous coordinates, check for
  // collisions with solid tiles and adjust the new coordinates to stop at
  // the edge of any solid tile it is colliding with.
  // Returns a bitmask of the collisions that were detected.
  stopAtSolids(
    coords: MutableVector2,
    prevCoords: ReadVector2,
    body: Body,
  ): CollisionBits {
    const { tileWidth, tileHeight } = this.solidsLayer.tileset

    // A small fudge factor is applied to "widen" the x0 and y0 values to allow
    // detection of collisions even when there is no movement in that direction.
    // "Widening" is not needed on the x1 and y1 values because they already
    // reach widely enough to reach the next tile even without movement.
    //
    // Because of the x1 and y1 values reach the next tile, the fudge factor
    // is also used to "narrow" the prevX1 and prevY1 values, to avoid
    // falsely detecting cross-axis collisions when touching a flat surface.
    //
    // Without this fudge factor applied to the prevX1 and prevY1, the body
    // will collide with the tile to its right and bottom "too soon".
    // For example, a player standing next to the right wall will always be
    // colliding with it, even when not applying horizontal velocity toward it,
    // and a player walking on flat ground will collide on the left or right,
    // even when there is no wall there.
    //
    // TODO: Is there a more elegant solution that acheives the same goal?
    const fudge = 0.001

    const x0 = coords.x + body.offsetLeft - fudge
    const x1 = coords.x + body.offsetRight
    const y0 = coords.y + body.offsetTop - fudge
    const y1 = coords.y + body.offsetBottom
    const prevX0 = prevCoords.x + body.offsetLeft
    const prevX1 = prevCoords.x + body.offsetRight - fudge
    const prevY0 = prevCoords.y + body.offsetTop
    const prevY1 = prevCoords.y + body.offsetBottom - fudge
    const iX0 = Math.floor(x0 / tileWidth)
    const iX1 = Math.floor(x1 / tileWidth)
    const iY0 = Math.floor(y0 / tileHeight)
    const iY1 = Math.floor(y1 / tileHeight)
    const iXV0 = Math.floor(prevX0 / tileWidth)
    const iXV1 = Math.floor(prevX1 / tileWidth)
    const iYV0 = Math.floor(prevY0 / tileHeight)
    const iYV1 = Math.floor(prevY1 / tileHeight)

    let collisions = CollisionBits.None

    for (let iX = iXV0; iX <= iXV1; iX++) {
      if (this.isSolidAtIndices(iX, iY1)) {
        collisions |= CollisionBits.Bottom
      }
    }
    for (let iX = iXV0; iX <= iXV1; iX++) {
      if (this.isSolidAtIndices(iX, iY0)) {
        collisions |= CollisionBits.Top
      }
    }

    if (collisions === CollisionBits.Top) {
      coords.y = (iY0 + 1) * tileHeight - body.offsetTop
    } else if (collisions === CollisionBits.Bottom) {
      coords.y = iY1 * tileHeight - body.offsetBottom
    }

    const collisionsY = collisions
    collisions = CollisionBits.None

    for (let iY = iYV0; iY <= iYV1; iY++) {
      if (this.isSolidAtIndices(iX1, iY)) {
        collisions |= CollisionBits.Right
      }
    }
    for (let iY = iYV0; iY <= iYV1; iY++) {
      if (this.isSolidAtIndices(iX0, iY)) {
        collisions |= CollisionBits.Left
      }
    }

    if (collisions === CollisionBits.Left) {
      coords.x = (iX0 + 1) * tileWidth - body.offsetLeft
    } else if (collisions === CollisionBits.Right) {
      coords.x = iX1 * tileWidth - body.offsetRight
    }

    collisions |= collisionsY

    return collisions
  }

  private isSolidAtIndices(x: number, y: number) {
    return this.solidsLayer.tileIds.get(x, y) !== 0
  }
}
