import {
  Entity,
  MutableVector2,
  ReadVector2,
  System,
  Vector2,
  registerComponent,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Bounds } from "./Bounds"
import { Context } from "./Context"
import { Velocity } from "./Velocity"

const PREV_CELLS = Symbol("Collisions._prevCells")
const PREV_COORDS = Symbol("Collisions._prevCoords")
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

  [PREV_CELLS] = new Set<Entity>();
  readonly [PREV_COORDS] = new MutableVector2();
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
  entities: ReadonlyMap<number, [Collisions, Opal.Position]>,
): Map<Entity, Collisions> {
  const { world } = coral
  const found = new Map<Entity, Collisions>()

  for (const [entityB, [b, _]] of entities) {
    if (entityA === entityB) continue
    found.set(entityB, b)
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
  entities: ReadonlyMap<number, [Collisions, Opal.Position]>,
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, b] of findPossibleCollisions(
    coral,
    entityA,
    entities,
  ).entries()) {
    if (
      a.shape === Collisions.Shape.Box &&
      b.shape === Collisions.Shape.TileMap
    ) {
      const boundsA = coral.world.get(entityA, Bounds)
      if (!boundsA) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const posB = coral.world.get(entityB, Opal.Position)
      if (!posB) continue

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
  entities: ReadonlyMap<number, [Collisions, Opal.Position]>,
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, b] of findPossibleCollisions(
    coral,
    entityA,
    entities,
  ).entries()) {
    if (
      a.shape === Collisions.Shape.Box &&
      b.shape === Collisions.Shape.TileMap
    ) {
      const boundsA = coral.world.get(entityA, Bounds)
      if (!boundsA) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const posB = coral.world.get(entityB, Opal.Position)
      if (!posB) continue

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
  entities: ReadonlyMap<number, [Collisions, Opal.Position]>,
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, b] of findPossibleCollisions(
    coral,
    entityA,
    entities,
  ).entries()) {
    if (
      a.shape === Collisions.Shape.Box &&
      b.shape === Collisions.Shape.TileMap
    ) {
      const boundsA = coral.world.get(entityA, Bounds)
      if (!boundsA) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const posB = coral.world.get(entityB, Opal.Position)
      if (!posB) continue

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
  entities: ReadonlyMap<number, [Collisions, Opal.Position]>,
  a: Collisions,
  posA: Opal.Position,
) {
  for (const [entityB, b] of findPossibleCollisions(
    coral,
    entityA,
    entities,
  ).entries()) {
    if (
      a.shape === Collisions.Shape.Box &&
      b.shape === Collisions.Shape.TileMap
    ) {
      const boundsA = coral.world.get(entityA, Bounds)
      if (!boundsA) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const posB = coral.world.get(entityB, Opal.Position)
      if (!posB) continue

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

export const CollisionsCheckSystem = (coral: Context) =>
  System.for(coral, [Collisions, Opal.Position], {
    shouldMatchAll: [Collisions],

    run(entities) {
      const { world } = coral

      ///
      // Clear previous collision results.
      for (const [_, [collisions, _position]] of entities) {
        collisions[RESULTS].length = 0
      }

      ///
      // Find the fastest axis-aligned speed among all dynamic entities,
      // and set that as the number of substeps to simulate.

      let totalSubsteps = 0
      for (const [entity, [collisions, position]] of entities) {
        const velocity = world.get(entity, Velocity)
        if (!velocity) continue

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
        for (const [entity, [collisions, position]] of entities) {
          const velocity = world.get(entity, Velocity)
          if (!velocity) continue

          // Determine if this entity should move along the X axis this substep.
          // TODO: use modular arithmetic to get them interspersed better.
          if (velocity.vector.x > i) {
            if (tryMoveRight(entity, coral, entities, collisions, position)) {
              position.updateCoords((coords) => (coords.x += 1))
            } else {
              velocity.setHorizontalConstantVelocity(0)
            }
          } else if (velocity.vector.x < -i) {
            if (tryMoveLeft(entity, coral, entities, collisions, position)) {
              position.updateCoords((coords) => (coords.x -= 1))
            } else {
              velocity.setHorizontalConstantVelocity(0)
            }
          }

          // Determine if this entity should move along the Y axis this substep.
          if (velocity.vector.y > i) {
            if (tryMoveDown(entity, coral, entities, collisions, position)) {
              position.updateCoords((coords) => (coords.y += 1))
            } else {
              velocity.setVerticalConstantVelocity(0.1) // TODO: zero
            }
          } else if (velocity.vector.y < -i) {
            if (tryMoveUp(entity, coral, entities, collisions, position)) {
              position.updateCoords((coords) => (coords.y -= 1))
            } else {
              velocity.setVerticalConstantVelocity(0)
            }
          }
        }
      }
    },
  })

// TODO: Remove this system if it's covered properly by the full dynamics
export const CollisionsFinalizeSystem = (coral: Context) =>
  System.for(coral, [Collisions, Opal.Position], {
    shouldMatchAll: [Collisions],

    runEach(entity, collisions, position) {
      // collisions[PREV_COORDS].copyFrom(position.coords)
    },
  })
