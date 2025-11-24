import {
  Entity,
  System,
  registerComponent,
  MutableVector2,
  ReadVector2,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"
import { BlockedBy } from "./BlockedBy"
import { Body } from "./Body"

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
    if (this[VELOCITY].y !== speed) this[RESIDUALS].y = 0
    this[VELOCITY].y = speed
  }

  setHorizontalConstantVelocity(speed: number) {
    if (this[VELOCITY].x !== speed) this[RESIDUALS].x = 0
    this[VELOCITY].x = speed
  }

  approachVerticalVelocity(target: number, maxChange?: number) {
    if (!maxChange) return this.setVerticalConstantVelocity(target)

    if (target > this[VELOCITY].y) {
      this[VELOCITY].y = Math.min(this[VELOCITY].y + maxChange, target)
    } else if (target < this[VELOCITY].y) {
      this[VELOCITY].y = Math.max(this[VELOCITY].y - maxChange, target)
    }
  }

  approachHorizontalVelocity(target: number, maxChange?: number) {
    if (!maxChange) return this.setHorizontalConstantVelocity(target)

    if (target > this[VELOCITY].x) {
      this[VELOCITY].x = Math.min(this[VELOCITY].x + maxChange, target)
    } else if (target < this[VELOCITY].x) {
      this[VELOCITY].x = Math.max(this[VELOCITY].x - maxChange, target)
    }
  }
}

function tryMoveRight(
  entityA: Entity,
  coral: Context,
  blockedBy: BlockedBy,
  a: Body,
  posA: Opal.Position,
) {
  for (const [entityB, [posB, b]] of blockedBy.entitiesThatMayBlock()) {
    if (a.shape === Body.Shape.Box && b.shape === Body.Shape.TileMap) {
      const a = coral.world.get(entityA, Body)
      if (!a) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const x = posA.coords.x + a.relativeX1 + 1
      const y0 = posA.coords.y + a.relativeY0
      const y1 = posA.coords.y + a.relativeY1 - 1
      if (b.tileMapIsSolidInXYRange(coral, x, x, y0, y1)) {
        return false
      }
    }
  }
  return true
}

function tryMoveLeft(
  entityA: Entity,
  coral: Context,
  blockedBy: BlockedBy,
  a: Body,
  posA: Opal.Position,
) {
  for (const [entityB, [posB, b]] of blockedBy.entitiesThatMayBlock()) {
    if (a.shape === Body.Shape.Box && b.shape === Body.Shape.TileMap) {
      const a = coral.world.get(entityA, Body)
      if (!a) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const x = posA.coords.x + a.relativeX0 - 1
      const y0 = posA.coords.y + a.relativeY0
      const y1 = posA.coords.y + a.relativeY1 - 1
      if (b.tileMapIsSolidInXYRange(coral, x, x, y0, y1)) {
        return false
      }
    }
  }
  return true
}

function tryMoveUp(
  entityA: Entity,
  coral: Context,
  blockedBy: BlockedBy,
  a: Body,
  posA: Opal.Position,
) {
  for (const [entityB, [posB, b]] of blockedBy.entitiesThatMayBlock()) {
    if (a.shape === Body.Shape.Box && b.shape === Body.Shape.TileMap) {
      const a = coral.world.get(entityA, Body)
      if (!a) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const x0 = posA.coords.x + a.relativeX0
      const x1 = posA.coords.x + a.relativeX1 - 1
      const y = posA.coords.y + a.relativeY0 - 1
      if (b.tileMapIsSolidInXYRange(coral, x0, x1, y, y)) {
        return false
      }
    }
  }
  return true
}

function tryMoveDown(
  entityA: Entity,
  coral: Context,
  blockedBy: BlockedBy,
  a: Body,
  posA: Opal.Position,
) {
  for (const [entityB, [posB, b]] of blockedBy.entitiesThatMayBlock()) {
    if (a.shape === Body.Shape.Box && b.shape === Body.Shape.TileMap) {
      const a = coral.world.get(entityA, Body)
      if (!a) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const x0 = posA.coords.x + a.relativeX0
      const x1 = posA.coords.x + a.relativeX1 - 1
      const y = posA.coords.y + a.relativeY1 + 1
      if (b.tileMapIsSolidInXYRange(coral, x0, x1, y, y)) {
        return false
      }
    }
  }
  return true
}

export const VelocitySystem = (coral: Context) =>
  System.for(coral, [Velocity, Opal.Position], {
    shouldMatchAll: [Velocity],

    run(entities) {
      const { world } = coral

      ///
      // Find the fastest axis-aligned speed among all dynamic entities,
      // and set that as the number of substeps to simulate.

      let totalSubsteps = 0
      for (const [entity, [velocity, position]] of entities) {
        const absDx = Math.abs(velocity.vector.x)
        const absDy = Math.abs(velocity.vector.y)
        const entityFastest = absDx > absDy ? absDx : absDy
        if (entityFastest > totalSubsteps) {
          totalSubsteps = entityFastest
        }
      }
      totalSubsteps = Math.max(Math.ceil(totalSubsteps), 1)

      ///
      // Move each entity forward one pixel at a time during each substep.
      // Slower objects will skip some of the substeps.

      for (let i = 0; i < totalSubsteps; i++) {
        for (const [entity, [velocity, position]] of entities) {
          const blockedBy = world.get(entity, BlockedBy)
          const body = world.get(entity, Body)
          if (blockedBy && body) {
            if (
              !blockedBy.wasBlockedOnRight &&
              !tryMoveRight(entity, coral, blockedBy, body, position)
            )
              blockedBy.markBlockedOnRight()
            if (
              !blockedBy.wasBlockedOnLeft &&
              !tryMoveLeft(entity, coral, blockedBy, body, position)
            )
              blockedBy.markBlockedOnLeft()
            if (
              !blockedBy.wasBlockedOnBottom &&
              !tryMoveDown(entity, coral, blockedBy, body, position)
            )
              blockedBy.markBlockedOnBottom()
            if (
              !blockedBy.wasBlockedOnTop &&
              !tryMoveUp(entity, coral, blockedBy, body, position)
            )
              blockedBy.markBlockedOnTop()
          }

          // Determine if this entity should move along the X axis this substep.
          // TODO: use modular arithmetic to get them interspersed better.
          if (velocity.vector.x > 0) {
            let willMove = false
            if (velocity.vector.x > i + 1) {
              willMove = true
            } else if (velocity.vector.x + velocity[RESIDUALS].x > i + 1) {
              willMove = true
              velocity[RESIDUALS].x = 0 // TODO: set to partial correct value
            } else {
              velocity[RESIDUALS].x +=
                velocity.vector.x - Math.floor(velocity.vector.x)
            }
            if (willMove) {
              if (blockedBy?.wasBlockedOnRight) {
                velocity.setHorizontalConstantVelocity(0)
              } else {
                position.updateCoords((coords) => (coords.x += 1))
              }
            }
          } else if (velocity.vector.x < 0) {
            let willMove = false
            if (velocity.vector.x < -i - 1) {
              willMove = true
            } else if (velocity.vector.x + velocity[RESIDUALS].x < -i - 1) {
              willMove = true
              velocity[RESIDUALS].x = 0
            } else {
              velocity[RESIDUALS].x +=
                velocity.vector.x - Math.ceil(velocity.vector.x)
            }
            if (willMove) {
              if (blockedBy?.wasBlockedOnLeft) {
                velocity.setHorizontalConstantVelocity(0)
              } else {
                position.updateCoords((coords) => (coords.x -= 1))
              }
            }
          }

          // Determine if this entity should move along the Y axis this substep.
          if (velocity.vector.y > 0) {
            let willMove = false
            if (velocity.vector.y > i + 1) {
              willMove = true
            } else if (velocity.vector.y + velocity[RESIDUALS].y > i + 1) {
              willMove = true
              velocity[RESIDUALS].y = 0
            } else {
              velocity[RESIDUALS].y +=
                velocity.vector.y - Math.floor(velocity.vector.y)
            }
            if (willMove) {
              if (blockedBy?.wasBlockedOnBottom) {
                velocity.setVerticalConstantVelocity(0)
              } else {
                position.updateCoords((coords) => (coords.y += 1))
              }
            }
          } else if (velocity.vector.y < 0) {
            let willMove = false
            if (velocity.vector.y < -i - 1) {
              willMove = true
            } else if (velocity.vector.y + velocity[RESIDUALS].y < -i - 1) {
              willMove = true
              velocity[RESIDUALS].y = 0 // TODO: set to partial correct value
            } else {
              velocity[RESIDUALS].y +=
                velocity.vector.y - Math.ceil(velocity.vector.y)
            }
            if (willMove) {
              if (blockedBy?.wasBlockedOnTop) {
                velocity.setVerticalConstantVelocity(0)
              } else {
                position.updateCoords((coords) => (coords.y -= 1))
              }
            }
          }
        }
      }
    },
  })
