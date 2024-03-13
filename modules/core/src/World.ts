import {
  Component,
  ComponentClass,
  ComponentClasses,
  getComponentClassById,
  newEntityPoolWithStaticComponentsReserved,
} from "./Component"
import { Entity } from "./Entity"
import { System } from "./System"
import { Clock } from "./Clock"
import { BitMask } from "./BitMask"
import { AutoMap } from "./AutoMap"

const ComponentStorage = Array
type ComponentStorage = Component[]
const CollectedEntityStorage = AutoMap
type CollectedEntityStorage = AutoMap<Entity, Set<Entity>>

export class World {
  // The storage for direct lookup of components of entities.
  //
  // Used by `get` to retrieve a given component for a given entity.
  private storage: ComponentStorage[] = []

  // The storage for lookup of the set of entities in a given collection
  // (via a one-to-many relationship component).
  //
  // Used by `getCollected` to retrieve the set of entities that are related
  // to a given entity via a given component.
  private collectedStorage: CollectedEntityStorage[] = []

  // The bit masks that track which components are attached to each entity.
  //
  // Used to quickly determine which systems need to be updated when a
  // component is added or removed from an entity.
  private entityBitMasks: BitMask[] = []

  // The pool of entity numbers that are available for use.
  //
  // Used by `create` to allocate a new entity number, and by `destroy` to
  // return an entity number to the pool, ready for reuse.
  private entityPool = newEntityPoolWithStaticComponentsReserved()

  // The systems that are currently running in the world.
  private systems: System[] = []

  // The world clock (public); used for advancing the world's state.
  clock: Clock

  constructor() {
    this.clock = new Clock(() => this.run())
  }

  startRunning() {
    this.clock.startRunning()
  }

  systemFor<T extends ComponentClasses, S extends Partial<System<T>>>(
    componentTypes: T,
    overrides: S,
  ): System<T> & S {
    return Object.assign(new System<T>(componentTypes), overrides)
  }

  create(components?: ComponentClass["prototype"][]): Entity {
    const entity = this.entityPool.alloc()
    if (components) this.set(entity, components)
    return entity
  }

  // Returns a debug-friendly object with the components of the given entity.
  debugInfoFor(entity: Entity) {
    const info: { [key: string]: unknown } = {}
    this.storage.forEach((componentStorage, componentId) => {
      const component = componentStorage?.[entity]
      if (!component) return

      const componentName =
        getComponentClassById(componentId)?.name ?? `${componentId}`
      info[componentName] = component
    })
    return info
  }

  destroy(entity: Entity): void {
    // Any system that was tracking this entity must drop it.
    this.systems.forEach((system) => system.removeEntityIfPresent(entity))
    // Any component that was attached to this entity must be dropped.
    const bitMask = this.entityBitMasks[entity]
    if (bitMask) {
      // Remove each component that is marked in the bit mask.
      for (const componentId of bitMask.oneBits()) {
        // Remove the component from component->entity storage.
        const componentStorage = this.storage[componentId]!
        const removedComponent = componentStorage[entity]!
        delete componentStorage[entity]

        // If the removed component is a collection relationship component,
        // remove the entity from the collection set it was being tracked in.
        if (removedComponent.collectionEntity !== undefined) {
          this.collectedStorage[removedComponent.collectionEntity]
            ?.get(componentId)
            ?.delete(entity)
        }
      }
      bitMask.clear()
    }
    // If this entity had any collected entities, remove those relationship
    // components from each of the collected entites.
    const collectedStorage = this.collectedStorage[entity]
    if (collectedStorage) {
      for (const [
        componentId,
        collectedEntities,
      ] of collectedStorage.entries()) {
        for (const collectedEntity of collectedEntities) {
          this.remove(collectedEntity, [getComponentClassById(componentId)!])
        }
      }
      delete this.collectedStorage[entity]
    }
    // The entity number is now free to be reused.
    this.entityPool.free(entity)
  }

  get<T extends ComponentClass>(
    entity: Entity,
    componentType: T,
  ): T["prototype"] | undefined {
    return this.storage[componentType.componentId]?.[entity] as
      | T["prototype"]
      | undefined
  }

  set(entity: Entity, components: ComponentClass["prototype"][]) {
    const bitMask = (this.entityBitMasks[entity] ??= new BitMask(62))

    for (const component of components) {
      const { componentId } = (
        component as unknown as { constructor: ComponentClass }
      ).constructor

      // Track which components are being added in the entity.
      bitMask.set(componentId, true)

      // Store the component in the entity's component storage.
      // This allows us to retrieve the component later with `get`.
      const componentStorage = (this.storage[componentId] ??=
        new ComponentStorage())
      const removedComponent = componentStorage[entity]
      componentStorage[entity] = component

      // Deal with tracking collection membership if this is a collection
      // relationship component (i.e. one with the `collectionEntity` set).
      const removedCollectionEntity = removedComponent?.collectionEntity
      const { collectionEntity } = component
      if (collectionEntity !== removedCollectionEntity) {
        // Remove the entity from the old collection (if applicable).
        if (removedCollectionEntity !== undefined)
          this.collectedStorage[removedCollectionEntity]
            ?.get(componentId)
            ?.delete(entity)
        // Add the entity to the new collection (if applicable).
        if (collectionEntity !== undefined) {
          const collectedStorage = (this.collectedStorage[collectionEntity] ??=
            new CollectedEntityStorage(Set<Entity>))
          collectedStorage.getOrCreate(componentId).add(entity)
        }
      }
    }

    this.updateSystemsForEntity(entity, bitMask)
  }

  remove(entity: Entity, componentTypes: ComponentClasses) {
    const bitMask = this.entityBitMasks[entity]
    if (!bitMask) return

    for (const componentType of componentTypes) {
      const { componentId } = componentType

      // Track which components are being removed from the entity.
      bitMask.set(componentId, false)

      // Remove the component from the entity's component storage.
      const componentStorage = this.storage[componentId]
      const removedComponent = componentStorage?.[entity]
      if (removedComponent) {
        delete componentStorage[entity]

        // If the component is a collection relationship component, remove the
        // entity from the collection it was in.
        const removedCollectionEntity = removedComponent?.collectionEntity
        if (removedCollectionEntity !== undefined) {
          this.collectedStorage[removedCollectionEntity]
            ?.get(componentId)
            ?.delete(entity)
        }
      }
    }

    this.updateSystemsForEntity(entity, bitMask)
  }

  getCollected(entity: Entity, componentType: ComponentClass): Set<Entity> {
    const { componentId } = componentType
    return this.collectedStorage[entity]?.get(componentId) ?? new Set()
  }

  addSystem(system: System) {
    this.systems.push(system)
    system.componentTypes.forEach(({ componentId }) => {
      system._requiredBits.set(componentId, true)
    })
    this.entityBitMasks.forEach((bitMask, entity) => {
      this.updateSystemForEntity(system, entity, bitMask)
    })
  }

  addSystems(systems: System[] = []) {
    for (const system of systems) this.addSystem(system)
  }

  run() {
    for (const system of this.systems) system.run(system._entities)
  }

  private updateSystemsForEntity(entity: Entity, bits: BitMask) {
    for (const system of this.systems) {
      this.updateSystemForEntity(system, entity, bits)
    }
  }

  private updateSystemForEntity(system: System, entity: Entity, bits: BitMask) {
    if (bits.isSuperSetOf(system._requiredBits)) {
      system.setEntityComponents(
        entity,
        system.componentTypes.map((component) => this.get(entity, component)!),
      )
    } else {
      system.removeEntityIfPresent(entity)
    }
  }
}
