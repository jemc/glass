import { World } from "./World"

export type Entity = number

export class EntitySet {
  private all = new Set<Entity>()

  constructor(entities: Iterable<Entity> = []) {
    for (const entity of entities) {
      this.all.add(entity)
    }
  }

  [Symbol.iterator]() {
    return this.all[Symbol.iterator]()
  }

  *values() {
    yield* this
  }

  has(entity: Entity) {
    return this.all.has(entity)
  }

  private world?: World
  private componentId?: Entity
  private entity?: Entity
  // TODO: use a truly private symbol for this method name
  _setTracking(world: World, componentId: Entity, entity: Entity) {
    if (
      this.world &&
      (this.world !== world ||
        this.componentId !== componentId ||
        this.entity !== entity)
    )
      throw new Error(
        "This EntitySet is already being tracked in a different component",
      )

    this.world = world
    this.componentId = componentId
    this.entity = entity
  }

  add(entity: Entity) {
    if (this.all.has(entity)) return
    this.all.add(entity)
    this.world?._addCollected(entity, this.componentId!, this.entity!)
  }

  remove(entity: Entity) {
    if (!this.all.has(entity)) return
    this.all.delete(entity)
    this.world?._removeCollected(entity, this.componentId!, this.entity!)
  }

  setToExactlyOne(entity: Entity) {
    let sawIt = false
    for (const other of this.all) {
      if (other === entity) {
        sawIt = true
      } else {
        this.remove(other)
      }
    }
    if (!sawIt) this.add(entity)
  }

  setToExactly(entities: Pick<Set<Entity>, "has"> & Iterable<Entity>) {
    for (const other of this.all) {
      if (!entities.has(other)) {
        this.remove(other)
      }
    }
    for (const entity of entities) {
      this.add(entity)
    }
  }
}
