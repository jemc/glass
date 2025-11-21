import {
  Entity,
  System,
  registerComponent,
  MutableVector2,
  ReadVector2,
} from "@glass/core"
import { Context } from "./Context"
import { BlockedBy } from "./BlockedBy"
import { Collisions } from "./Collisions"
import { Opal } from "@glass/opal"
import { Bounds } from "./Bounds"

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

function tryMoveRight(
  entityA: Entity,
  coral: Context,
  blockedBy: BlockedBy,
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, [b, posB]] of blockedBy.entitiesThatMayBlock()) {
    if (
      a.shape === Collisions.Shape.Box &&
      b.shape === Collisions.Shape.TileMap
    ) {
      const boundsA = coral.world.get(entityA, Bounds)
      if (!boundsA) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const x = posA.coords.x + boundsA.relativeX1 + 1
      const y0 = posA.coords.y + boundsA.relativeY0
      const y1 = posA.coords.y + boundsA.relativeY1 - 1
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
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, [b, posB]] of blockedBy.entitiesThatMayBlock()) {
    if (
      a.shape === Collisions.Shape.Box &&
      b.shape === Collisions.Shape.TileMap
    ) {
      const boundsA = coral.world.get(entityA, Bounds)
      if (!boundsA) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const x = posA.coords.x + boundsA.relativeX0 - 1
      const y0 = posA.coords.y + boundsA.relativeY0
      const y1 = posA.coords.y + boundsA.relativeY1 - 1
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
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, [b, posB]] of blockedBy.entitiesThatMayBlock()) {
    if (
      a.shape === Collisions.Shape.Box &&
      b.shape === Collisions.Shape.TileMap
    ) {
      const boundsA = coral.world.get(entityA, Bounds)
      if (!boundsA) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const x0 = posA.coords.x + boundsA.relativeX0
      const x1 = posA.coords.x + boundsA.relativeX1 - 1
      const y = posA.coords.y + boundsA.relativeY0 - 1
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
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, [b, posB]] of blockedBy.entitiesThatMayBlock()) {
    if (
      a.shape === Collisions.Shape.Box &&
      b.shape === Collisions.Shape.TileMap
    ) {
      const boundsA = coral.world.get(entityA, Bounds)
      if (!boundsA) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const x0 = posA.coords.x + boundsA.relativeX0
      const x1 = posA.coords.x + boundsA.relativeX1 - 1
      const y = posA.coords.y + boundsA.relativeY1 + 1
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
      totalSubsteps = Math.ceil(totalSubsteps)

      ///
      // Move each entity forward one pixel at a time during each substep.
      // Slower objects will skip some of the substeps.

      for (let i = 0; i < totalSubsteps; i++) {
        for (const [entity, [velocity, position]] of entities) {
          const blockedBy = world.get(entity, BlockedBy)
          const collisions = world.get(entity, Collisions)

          // Determine if this entity should move along the X axis this substep.
          // TODO: use modular arithmetic to get them interspersed better.
          if (velocity.vector.x > i) {
            if (
              !blockedBy ||
              !collisions ||
              tryMoveRight(entity, coral, blockedBy, collisions, position)
            ) {
              position.updateCoords((coords) => (coords.x += 1))
            } else {
              blockedBy?.markBlockedOnRight()
              velocity.setHorizontalConstantVelocity(0)
            }
          } else if (velocity.vector.x < -i) {
            if (
              !blockedBy ||
              !collisions ||
              tryMoveLeft(entity, coral, blockedBy, collisions, position)
            ) {
              position.updateCoords((coords) => (coords.x -= 1))
            } else {
              blockedBy?.markBlockedOnLeft()
              velocity.setHorizontalConstantVelocity(0)
            }
          }

          // Determine if this entity should move along the Y axis this substep.
          if (velocity.vector.y > i) {
            if (
              !blockedBy ||
              !collisions ||
              tryMoveDown(entity, coral, blockedBy, collisions, position)
            ) {
              position.updateCoords((coords) => (coords.y += 1))
            } else {
              blockedBy?.markBlockedOnBottom()
              velocity.setVerticalConstantVelocity(0.1) // TODO: zero
            }
          } else if (velocity.vector.y < -i) {
            if (
              !blockedBy ||
              !collisions ||
              tryMoveUp(entity, coral, blockedBy, collisions, position)
            ) {
              position.updateCoords((coords) => (coords.y -= 1))
            } else {
              blockedBy?.markBlockedOnTop()
              velocity.setVerticalConstantVelocity(0)
            }
          }
        }
      }
    },
  })
