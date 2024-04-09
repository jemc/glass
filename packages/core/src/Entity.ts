import { World } from "./World"

export type Entity = number

export class EntitySet {
  private all = new Set<Entity>()

  constructor(entities: Iterable<Entity> = []) {
    for (const entity of entities) {
      this.all.add(entity)
    }
  }

  *values() {
    yield* this.all
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
    this.all.add(entity)
    this.world?._addCollected(entity, this.componentId!, this.entity!)
  }

  remove(entity: Entity) {
    this.all.delete(entity)
    this.world?._removeCollected(entity, this.componentId!, this.entity!)
  }
}
