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
import { InSpatialIndexCells } from "./SpatialIndex.private"

const PREV_CELLS = Symbol("Collisions._prevCells")
const PREV_COORDS = Symbol("Collisions._prevCoords")
const RESULTS = Symbol("Collisions._results")

export class Collisions {
  static readonly componentId = registerComponent(this)

  constructor(readonly shape: Collisions.Shape = Collisions.Shape.Box) {}

  [PREV_CELLS] = new Set<Entity>();
  readonly [PREV_COORDS] = new MutableVector2();
  readonly [RESULTS] = new Map<Entity, Collisions.Info[]>()

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
    prevA: ReadVector2

    entityB: Entity
    posB: ReadVector2
    prevB: ReadVector2

    incursionA: Vector2
  }
}

const tmpSeenA = new Set<Entity>()
const tmpSeenB = new Set<Entity>()

export const CollisionsCheckSystem = (coral: Context) =>
  System.for(coral, [Collisions, Opal.Position], {
    shouldMatchAll: [Collisions],

    run(entities) {
      const { world } = coral
      tmpSeenA.clear()

      for (const [a] of entities.values()) {
        a[RESULTS].clear()
      }
      for (const [entityA, [a, fullPosA]] of entities) {
        tmpSeenA.add(entityA)
        tmpSeenB.clear()

        const prevCells = a[PREV_CELLS]
        const cells = world.get(
          entityA,
          InSpatialIndexCells,
        )?.collectionEntities
        if (!cells) continue

        const prevA = a[PREV_COORDS].clone() // TODO: remove clone and fix any resulting bugs
        const posA = fullPosA.coords.clone() // TODO: remove clone and fix any resulting bugs

        function handleCell(cell: Entity) {
          const bs = world.getCollected(cell, InSpatialIndexCells)

          for (const entityB of bs) {
            if (tmpSeenA.has(entityB)) continue
            if (tmpSeenB.has(entityB)) continue
            tmpSeenB.add(entityB)

            const b = world.get(entityB, Collisions)
            if (!b) continue

            const fullPosB = world.get(entityB, Opal.Position)
            if (!fullPosB) continue

            const prevB = b[PREV_COORDS]
            const posB = fullPosB.coords

            const infos = check(
              coral,
              entityA,
              a,
              posA,
              prevA,
              entityB,
              b,
              posB,
              prevB,
            )

            if (infos) {
              a[RESULTS].set(entityB, infos)
              b[RESULTS].set(entityA, infos)
            }
          }
        }

        for (const cell of cells) handleCell(cell)
        for (const cell of prevCells) if (!cells.has(cell)) handleCell(cell)

        a[PREV_CELLS] = new Set(cells)
      }
    },
  })

export const CollisionsFinalizeSystem = (coral: Context) =>
  System.for(coral, [Collisions, Opal.Position], {
    shouldMatchAll: [Collisions],

    runEach(entity, collisions, position) {
      collisions[PREV_COORDS].copyFrom(position.coords)
    },
  })

function check(
  coral: Context,
  // Entity A
  entityA: Entity,
  a: Collisions,
  posA: ReadVector2,
  prevA: ReadVector2,
  // Entity B
  entityB: Entity,
  b: Collisions,
  posB: ReadVector2,
  prevB: ReadVector2,
) {
  let fn: typeof checkBoxVsBox | undefined = undefined
  let fnReverse: typeof checkBoxVsBox | undefined = undefined

  if (a.shape === Collisions.Shape.Box) {
    if (b.shape === Collisions.Shape.Box) {
      fn = checkBoxVsBox
    } else if (b.shape === Collisions.Shape.TileMap) {
      fn = checkBoxVsTileMap
    }
  } else if (a.shape === Collisions.Shape.TileMap) {
    if (b.shape === Collisions.Shape.Box) {
      fnReverse = checkBoxVsTileMap
    }
  }

  if (fn) return fn(coral, entityA, posA, prevA, entityB, posB, prevB)
  else if (fnReverse)
    return fnReverse(coral, entityB, posB, prevB, entityA, posA, prevA)

  throw new Error(
    `TODO: Implement collision checking for shape ${a.shape} vs shape ${b.shape}`,
  )
}

function checkPointVsPoint(
  coral: Context,
  entityA: Entity,
  posA: ReadVector2,
  prevA: ReadVector2,
  entityB: Entity,
  posB: ReadVector2,
  prevB: ReadVector2,
): Collisions.Info[] | undefined {
  if (posA.x !== posB.x) return undefined
  if (posA.y !== posB.y) return undefined

  // TODO: The above code doesn't take into account the trajectory of travel
  // from the previous position to the current position. This is important
  // for resolving collisions when the body is moving quickly.

  // TODO: Calculate correct incursion.

  const incursionA = new Vector2()
  return [{ entityA, posA, prevA, entityB, posB, prevB, incursionA }]
}

function checkPointVsBox(
  coral: Context,
  entityA: Entity,
  posA: ReadVector2,
  prevA: ReadVector2,
  entityB: Entity,
  posB: ReadVector2,
  prevB: ReadVector2,
): Collisions.Info[] | undefined {
  const boundsB = coral.world.get(entityB, Bounds)
  if (!boundsB)
    return checkPointVsPoint(coral, entityA, posA, prevA, entityB, posB, prevB)

  const bX0 = posB.x + boundsB.relativeX0
  if (posA.x < bX0) return undefined

  const bX1 = posB.x + boundsB.relativeX1
  if (posA.x > bX1) return undefined

  const bY0 = posB.y + boundsB.relativeY0
  if (posA.y < bY0) return undefined

  const bY1 = posB.y + boundsB.relativeY1
  if (posA.y > bY1) return undefined

  // TODO: The above code doesn't take into account the trajectory of travel
  // from the previous position to the current position. This is important
  // for resolving collisions when the body is moving quickly.

  // TODO: Calculate correct incursion.

  const incursionA = new Vector2()
  return [{ entityA, posA, prevA, entityB, posB, prevB, incursionA }]
}

function checkBoxVsBox(
  coral: Context,
  entityA: Entity,
  posA: ReadVector2,
  prevA: ReadVector2,
  entityB: Entity,
  posB: ReadVector2,
  prevB: ReadVector2,
): Collisions.Info[] | undefined {
  const boundsA = coral.world.get(entityA, Bounds)
  if (!boundsA)
    return checkPointVsBox(coral, entityA, posA, prevA, entityB, posB, prevB)

  const boundsB = coral.world.get(entityB, Bounds)
  if (!boundsB)
    return checkPointVsBox(coral, entityB, posB, prevB, entityA, posA, prevA)

  const aX0 = posA.x + boundsA.relativeX0
  const bX1 = posB.x + boundsB.relativeX1
  if (aX0 > bX1) return undefined

  const aX1 = posA.x + boundsA.relativeX1
  const bX0 = posB.x + boundsB.relativeX0
  if (aX1 < bX0) return undefined

  const aY0 = posA.y + boundsA.relativeY0
  const bY1 = posB.y + boundsB.relativeY1
  if (aY0 > bY1) return undefined

  const aY1 = posA.y + boundsA.relativeY1
  const bY0 = posB.y + boundsB.relativeY0
  if (aY1 < bY0) return undefined

  // TODO: The above code doesn't take into account the trajectory of travel
  // from the previous position to the current position. This is important
  // for resolving collisions when the body is moving quickly.

  // TODO: Calculate correct incursion.

  const incursionA = new Vector2()
  return [{ entityA, posA, prevA, entityB, posB, prevB, incursionA }]
}

function checkPointVsTileMap(
  coral: Context,
  entityA: Entity,
  posA: ReadVector2,
  prevA: ReadVector2,
  entityB: Entity,
  posB: ReadVector2,
  prevB: ReadVector2,
): Collisions.Info[] | undefined {
  throw new Error("TODO: Implement point vs tile map collision checking")
}

function checkBoxVsTileMap(
  coral: Context,
  entityA: Entity,
  posA: ReadVector2,
  prevA: ReadVector2,
  entityB: Entity,
  posB: ReadVector2,
  prevB: ReadVector2,
): Collisions.Info[] | undefined {
  const boundsA = coral.world.get(entityA, Bounds)
  if (!boundsA)
    return checkPointVsTileMap(
      coral,
      entityA,
      posA,
      prevA,
      entityB,
      posB,
      prevB,
    )

  if (posB.x !== 0 || posB.y !== 0)
    throw new Error("TODO: Implement collisions for non-origin tile maps")
  if (prevB.x !== posB.x || prevB.y !== posB.y)
    throw new Error("TODO: Implement collisions for moving tile maps")
  const boundsB = coral.world.get(entityB, Bounds)
  if (boundsB && (boundsB.offsetX !== 0 || boundsB.offsetY !== 0))
    throw new Error("TODO: Implement collisions for non-origin tile maps")

  const layer = coral.opal.tileMaps
    .get("data/levels/TestLevel.aseprite")
    ?.layer("Solids") // TODO: not-hard-coded
  if (!layer) {
    console.warn("tile map layer not loaded")
    return
  }
  function isSolidAt(x: number, y: number) {
    return layer!.tileIds.get(x, y) !== 0
  }

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

  const x0 = posA.x + boundsA.relativeX0 - fudge
  const x1 = posA.x + boundsA.relativeX1
  const y0 = posA.y + boundsA.relativeY0 - fudge
  const y1 = posA.y + boundsA.relativeY1
  const prevX0 = prevA.x + boundsA.relativeX0
  const prevX1 = prevA.x + boundsA.relativeX1 - fudge
  const prevY0 = prevA.y + boundsA.relativeY0
  const prevY1 = prevA.y + boundsA.relativeY1 - fudge

  const iX0 = layer.xToIndex(x0)
  const iX1 = layer.xToIndex(x1)
  const iY0 = layer.yToIndex(y0)
  const iY1 = layer.yToIndex(y1)
  const iXV0 = layer.xToIndex(prevX0)
  const iXV1 = layer.xToIndex(prevX1)
  const iYV0 = layer.yToIndex(prevY0)
  const iYV1 = layer.yToIndex(prevY1)

  let collisionLeft = false
  let collisionRight = false
  let collisionTop = false
  let collisionBottom = false

  for (let iX = iXV0; iX <= iXV1; iX++) {
    if (isSolidAt(iX, iY1)) {
      collisionBottom = true
    }
  }
  for (let iX = iXV0; iX <= iXV1; iX++) {
    if (isSolidAt(iX, iY0)) {
      collisionTop = true
    }
  }
  for (let iY = iYV0; iY <= iYV1; iY++) {
    if (isSolidAt(iX1, iY)) {
      collisionRight = true
    }
  }
  for (let iY = iYV0; iY <= iYV1; iY++) {
    if (isSolidAt(iX0, iY)) {
      collisionLeft = true
    }
  }

  if (!collisionTop && !collisionBottom && !collisionLeft && !collisionRight)
    return undefined

  const results: Collisions.Info[] = []

  if (collisionTop) {
    const clearY = (iY0 + 1) * layer.tileset.tileHeight - boundsA.relativeY0
    const incursionA = new Vector2(0, posA.y - clearY)
    results.push({ entityA, posA, prevA, entityB, posB, prevB, incursionA })
  }
  if (collisionBottom) {
    const clearY = iY1 * layer.tileset.tileHeight - boundsA.relativeY1
    const incursionA = new Vector2(0, posA.y - clearY)
    results.push({ entityA, posA, prevA, entityB, posB, prevB, incursionA })
  }
  if (collisionLeft) {
    const clearX = (iX0 + 1) * layer.tileset.tileWidth - boundsA.relativeX0
    const incursionA = new Vector2(posA.x - clearX, 0)
    results.push({ entityA, posA, prevA, entityB, posB, prevB, incursionA })
  }
  if (collisionRight) {
    const clearX = iX1 * layer.tileset.tileWidth - boundsA.relativeX1
    const incursionA = new Vector2(posA.x - clearX, 0)
    results.push({ entityA, posA, prevA, entityB, posB, prevB, incursionA })
  }

  return results
}
