import {
  registerComponent,
  World,
  Entity,
  EntitySet,
  ReadVector2,
} from "@glass/core"

export const STATE = Symbol("SpatialIndexState") // used for state sharing

// This is a private component that is automatically created and managed by the
// systems in this file. It represents a single cell in the spatial index grid.
export class SpatialIndexCell {
  static readonly componentId = registerComponent(this);

  readonly [STATE]: SpatialIndexState

  constructor(
    state: SpatialIndexState,
    readonly tableIndex: number,
    readonly i: number,
    readonly j: number,
  ) {
    this[STATE] = state
  }
}

// This is a private component that is automatically created and managed by the
// systems in this file. It is used to collect the set of spatial index grid
// cells that an entity is spatially within.
export class InSpatialIndexCells {
  static readonly componentId = registerComponent(this)

  lasti0 = 1
  lasti1 = 0
  lastj0 = 1
  lastj1 = 0

  readonly collectionEntities = new EntitySet()
}

export class SpatialIndexState {
  readonly cellWidthBits: number = 6 // i.e. 64 pixels // TODO: configurable?
  readonly cellHeightBits: number = 6 // i.e. 64 pixels // TODO: configurable?

  private cellEntitiesPosPos: Entity[][] = []
  private cellEntitiesPosNeg: Entity[][] = []
  private cellEntitiesNegPos: Entity[][] = []
  private cellEntitiesNegNeg: Entity[][] = []

  private cellEntityTables = [
    this.cellEntitiesPosPos,
    this.cellEntitiesPosNeg,
    this.cellEntitiesNegPos,
    this.cellEntitiesNegNeg,
  ]

  getCellEntityIfExists(i: number, j: number) {
    let table = this.cellEntitiesPosPos
    if (i < 0) {
      if (j < 0) {
        table = this.cellEntitiesNegNeg
        i = -i - 1
        j = -j - 1
      } else {
        table = this.cellEntitiesNegPos
        i = -i - 1
      }
    } else if (j < 0) {
      table = this.cellEntitiesPosNeg
      j = -j - 1
    }

    return table[i]?.[j]
  }

  getOrCreateCellEntity(world: World, i: number, j: number) {
    let table = this.cellEntitiesPosPos
    let tableIndex = 0
    if (i < 0) {
      if (j < 0) {
        table = this.cellEntitiesNegNeg
        tableIndex = 3
        i = -i - 1
        j = -j - 1
      } else {
        table = this.cellEntitiesNegPos
        tableIndex = 2
        i = -i - 1
      }
    } else if (j < 0) {
      table = this.cellEntitiesPosNeg
      tableIndex = 1
      j = -j - 1
    }

    const row = (table[i] ??= [])
    const entity = (row[j] ??= world.create(
      new SpatialIndexCell(this, tableIndex, i, j),
    ))
    return entity
  }

  maybePruneCellEntity(world: World, entity: Entity, cell: SpatialIndexCell) {
    if (world.getCollected(entity, InSpatialIndexCells).size === 0)
      world.destroy(entity)

    delete this.cellEntityTables[cell.tableIndex]![cell.i]![cell.j]
  }

  *entitiesInCell(world: World, i: number, j: number) {
    const cellEntity = this.getCellEntityIfExists(i, j)
    if (!cellEntity) return

    const entities = world.getCollected(cellEntity, InSpatialIndexCells)
    if (!entities) return

    yield* entities
  }

  *entitiesInCellForPoint(world: World, point: Pick<ReadVector2, "x" | "y">) {
    const i = point.x >> this.cellWidthBits
    const j = point.y >> this.cellHeightBits
    yield* this.entitiesInCell(world, i, j)
  }
}
