import {
  registerComponent,
  System,
  World,
  Entity,
  ReadVector2,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"
import { Bounds } from "./Bounds"
import {
  STATE,
  SpatialIndexState,
  InSpatialIndexCells,
  SpatialIndexCell,
} from "./SpatialIndex.private"

const tmpSet = new Set<number>() // used for temporary storage during calculations

// This component marks an entity as being the root of a spatial index, with
// all entities that have Position and PositionWithin pointing to that root.
export class SpatialIndex {
  static readonly componentId = registerComponent(this);

  readonly [STATE] = new SpatialIndexState()

  entitiesInCellForPoint(world: World, point: ReadVector2) {
    return this[STATE].entitiesInCellForPoint(world, point)
  }

  static *entitiesInCellsForEntity(world: World, entity: Entity) {
    const inCells = world.get(entity, InSpatialIndexCells)
    if (!inCells)
      throw new Error(
        `Entity ${entity} is not in a SpatialIndex. ` +
          "Be sure to add a PositionWithin component to it that points to " +
          'a "containing" entity with a SpatialIndex component.',
      )

    tmpSet.clear()

    for (const cellEntity of inCells.collectionEntities) {
      const entities = world.getCollected(cellEntity, InSpatialIndexCells)

      for (const e of entities) {
        if (e !== entity) tmpSet.add(e)
      }
    }

    yield* tmpSet
  }
}

export const SpatialIndexSystem = (coral: Context) =>
  System.for(coral, [SpatialIndex], {
    shouldMatchAll: [SpatialIndex],

    runEach(spatialIndexEntity, spatialIndex) {
      const { [STATE]: state } = spatialIndex

      // Scan across all the entities in the spatial index, updating where
      // each one is correctly located within the spatial index.
      const entities = coral.world.getCollected(
        spatialIndexEntity,
        Opal.PositionWithin,
      )
      for (const entity of entities) {
        // TODO: SKIP AN ENTITY IF IT DIDN'T CHANGE POSITION AND BOUNDS

        // Every entity in the spatial index should have a position.
        const position = coral.world.get(entity, Opal.Position)
        if (!position) continue

        // If it doesn't already have an InSpatialIndexCells component, add one.
        // We're going to collect the set of cells that this entity is in.
        let inCells = coral.world.get(entity, InSpatialIndexCells)
        if (!inCells)
          coral.world.set(entity, [(inCells = new InSpatialIndexCells())])
        const cellEntities = inCells.collectionEntities

        // If the entity has a bounding box then we need to consider
        // that it may be in multiple cells. If it has no bounds, we can treat
        // it as a single point, which will by definition be in just one cell.
        const bounds = coral.world.get(entity, Bounds)
        if (bounds) {
          const i0 = (position.x + bounds.relativeX0) >> state.cellWidthBits
          const j0 = (position.y + bounds.relativeY0) >> state.cellHeightBits
          const i1 = (position.x + bounds.relativeX1) >> state.cellWidthBits
          const j1 = (position.y + bounds.relativeY1) >> state.cellHeightBits
          if (
            i0 === inCells.lasti0 &&
            j0 === inCells.lastj0 &&
            i1 === inCells.lasti1 &&
            j1 === inCells.lastj1
          )
            continue
          inCells.lasti0 = i0
          inCells.lastj0 = j0
          inCells.lasti1 = i1
          inCells.lastj1 = j1
          if (i0 === i1 && j0 === j1) {
            cellEntities.setToExactlyOne(
              state.getOrCreateCellEntity(coral.world, i0, j0),
            )
          } else {
            tmpSet.clear()
            for (let j = j0; j <= j1; j++) {
              for (let i = i0; i <= i1; i++) {
                tmpSet.add(state.getOrCreateCellEntity(coral.world, i, j))
              }
            }
            cellEntities.setToExactly(tmpSet)
          }
        } else {
          const i = position.x >> state.cellWidthBits
          const j = position.y >> state.cellHeightBits
          cellEntities.setToExactlyOne(
            state.getOrCreateCellEntity(coral.world, i, j),
          )
        }
      }
    },
  })

export const SpatialIndexPruneSystem = (coral: Context) =>
  System.for(coral, [SpatialIndexCell], {
    shouldMatchAll: [SpatialIndexCell],

    runEach(entity, cell) {
      cell[STATE].maybePruneCellEntity(coral.world, entity, cell)
    },
  })
