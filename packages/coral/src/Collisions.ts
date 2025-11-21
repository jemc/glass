import {
  Entity,
  ReadVector2,
  System,
  Vector2,
  registerComponent,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Bounds } from "./Bounds"
import { Context } from "./Context"
import { Velocity } from "./Velocity"
import { BlockedBy } from "./BlockedBy"

const RESULTS = Symbol("Collisions._results")

const NORMAL_UP = new Vector2(0, -1)
const NORMAL_DOWN = new Vector2(0, 1)
const NORMAL_LEFT = new Vector2(-1, 0)
const NORMAL_RIGHT = new Vector2(1, 0)

export class Collisions {
  static readonly componentId = registerComponent(this)

  readonly shape: Collisions.Shape
  readonly tileMapName?: string
  readonly tileMapLayerName?: string

  constructor(
    ...args:
      | []
      | [Collisions.Shape.Box]
      | [Collisions.Shape.TileMap, string, string]
  ) {
    this.shape = args[0] ?? Collisions.Shape.Box
    if (this.shape === Collisions.Shape.TileMap) {
      this.tileMapName = args[1]
      this.tileMapLayerName = args[2]
    }
  }

  readonly [RESULTS]: Collisions.Info[] = []

  results() {
    return this[RESULTS].entries()
  }
}

export namespace Collisions {
  export enum Shape {
    Box = 0,
    // TODO: Circle,
    // TODO: Bitmap,
    TileMap,
  }

  export interface Info {
    entityA: Entity
    posA: ReadVector2

    entityB: Entity
    posB: ReadVector2

    normalA: Vector2
    normalB: Vector2
  }
}

export function findPossibleCollisions(
  coral: Context,
  entityA: Entity,
): Map<Entity, [Collisions, Opal.Position]> {
  const { world } = coral
  const found = new Map<Entity, [Collisions, Opal.Position]>()

  const blockedBy = world.get(entityA, BlockedBy)
  if (blockedBy === undefined) return found

  for (const query of blockedBy.queries) {
    for (const [entityB, [b, posB]] of query.entities) {
      if (entityA === entityB) continue
      found.set(entityB, [b, posB])
    }
  }

  return found
}

function tileMapIsSolidAtRange(
  coral: Context,
  c: Collisions,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): boolean {
  const layer = coral.opal.tileMaps
    .get(c.tileMapName!)
    ?.layer(c.tileMapLayerName!)
  if (!layer) return false

  let iX0 = layer.xToIndex(x0)
  let iX1 = layer.xToIndex(x1)
  let iY0 = layer.yToIndex(y0)
  let iY1 = layer.yToIndex(y1)

  for (let iX = iX0; iX <= iX1; iX++) {
    for (let iY = iY0; iY <= iY1; iY++) {
      if (layer.tileIds.get(iX, iY) !== 0) return true
    }
  }
  return false
}

function tryMoveRight(
  entityA: Entity,
  coral: Context,
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, [b, posB]] of findPossibleCollisions(
    coral,
    entityA,
  ).entries()) {
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
      if (tileMapIsSolidAtRange(coral, b, x, x, y0, y1)) {
        a[RESULTS].push({
          entityA,
          entityB,
          posA: posA.coords,
          posB: posB.coords,
          normalA: NORMAL_RIGHT,
          normalB: NORMAL_LEFT,
        })
        return false
      }
    }
  }
  return true
}

function tryMoveLeft(
  entityA: Entity,
  coral: Context,
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, [b, posB]] of findPossibleCollisions(
    coral,
    entityA,
  ).entries()) {
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
      if (tileMapIsSolidAtRange(coral, b, x, x, y0, y1)) {
        a[RESULTS].push({
          entityA,
          entityB,
          posA: posA.coords,
          posB: posB.coords,
          normalA: NORMAL_LEFT,
          normalB: NORMAL_RIGHT,
        })
        return false
      }
    }
  }
  return true
}

function tryMoveUp(
  entityA: Entity,
  coral: Context,
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, [b, posB]] of findPossibleCollisions(
    coral,
    entityA,
  ).entries()) {
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
      if (tileMapIsSolidAtRange(coral, b, x0, x1, y, y)) {
        a[RESULTS].push({
          entityA,
          entityB,
          posA: posA.coords,
          posB: posB.coords,
          normalA: NORMAL_UP,
          normalB: NORMAL_DOWN,
        })
        return false
      }
    }
  }
  return true
}

function tryMoveDown(
  entityA: Entity,
  coral: Context,
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, [b, posB]] of findPossibleCollisions(
    coral,
    entityA,
  ).entries()) {
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
      if (tileMapIsSolidAtRange(coral, b, x0, x1, y, y)) {
        a[RESULTS].push({
          entityA,
          entityB,
          posA: posA.coords,
          posB: posB.coords,
          normalA: NORMAL_DOWN,
          normalB: NORMAL_UP,
        })
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
      // Clear previous collision results.
      for (const [entity, [velocity, _position]] of entities) {
        const collisions = world.get(entity, Collisions)
        if (collisions) collisions[RESULTS].length = 0
      }

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
          const collisions = world.get(entity, Collisions)

          // Determine if this entity should move along the X axis this substep.
          // TODO: use modular arithmetic to get them interspersed better.
          if (velocity.vector.x > i) {
            if (
              !collisions ||
              tryMoveRight(entity, coral, collisions, position)
            ) {
              position.updateCoords((coords) => (coords.x += 1))
            } else {
              velocity.setHorizontalConstantVelocity(0)
            }
          } else if (velocity.vector.x < -i) {
            if (
              !collisions ||
              tryMoveLeft(entity, coral, collisions, position)
            ) {
              position.updateCoords((coords) => (coords.x -= 1))
            } else {
              velocity.setHorizontalConstantVelocity(0)
            }
          }

          // Determine if this entity should move along the Y axis this substep.
          if (velocity.vector.y > i) {
            if (
              !collisions ||
              tryMoveDown(entity, coral, collisions, position)
            ) {
              position.updateCoords((coords) => (coords.y += 1))
            } else {
              velocity.setVerticalConstantVelocity(0.1) // TODO: zero
            }
          } else if (velocity.vector.y < -i) {
            if (!collisions || tryMoveUp(entity, coral, collisions, position)) {
              position.updateCoords((coords) => (coords.y -= 1))
            } else {
              velocity.setVerticalConstantVelocity(0)
            }
          }
        }
      }
    },
  })
