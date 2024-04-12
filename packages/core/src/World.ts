import {
  Component,
  ComponentClass,
  ComponentClasses,
  getComponentClassById,
  getComponentPrerequisiteIds,
  newEntityPoolWithStaticComponentsReserved,
} from "./Component"
import { Entity } from "./Entity"
import { System, SystemContext, SystemFactory } from "./System"
import { Clock } from "./Clock"
import { BitMask } from "./BitMask"
import { AutoMap } from "./AutoMap"
import { Phase, PhaseGraph } from "./Phase"
import { OrderedListAddOpts } from "./OrderedList"

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
  private phases: PhaseGraph

  // The world clock (public); used for advancing the world's state.
  readonly clock: Clock

  constructor() {
    this.phases = new PhaseGraph()
    this.clock = new Clock(() => this.run())

    // Set up the core phases.

    this.phases.declarePhase(Phase.Load)
    this.phases.declarePhase(Phase.Impetus)
    this.phases.declarePhase(Phase.Action)
    this.phases.declarePhase(Phase.Reaction)
    this.phases.declarePhase(Phase.Correction)
    this.phases.declarePhase(Phase.PreRender)
    this.phases.declarePhase(Phase.Render)
    this.phases.declarePhase(Phase.Advance)
  }

  startRunning() {
    this.clock.startRunning()
  }

  create(...components: Component[]): Entity {
    const entity = this.entityPool.alloc()
    if (components.length !== 0) this.set(entity, components)
    return entity
  }

  // Log some information about the given entity (if given) to the console.
  // Also look for any warnings that may be useful for debugging.
  debug(entity?: Entity) {
    if (entity !== undefined) console.debug(this.debugInfoFor(entity))
    this.debugScanForWarnings().forEach((warning) => console.warn(warning))
  }

  // Returns a debug-friendly object with the components of the given entity.
  debugInfoFor(entity: Entity) {
    const info: { [key: string]: unknown } = { id: entity }
    this.storage.forEach((componentStorage, componentId) => {
      const component = componentStorage?.[entity]
      if (!component) return

      const componentClass = getComponentClassById(componentId)
      const componentName = componentClass?.name ?? `${componentId}`
      info[componentName] =
        "world" in component
          ? true
          : "collectionEntities" in component
            ? {
                ...component,
                collectionEntities: [...component.collectionEntities!],
              }
            : component
    })
    return info
  }

  // Log warnings that may be useful for debugging every `seconds` seconds.
  //
  // This is a potentially slow operation when used in a large world,
  // so this is only recommended to enable when debugging.
  debugScanForWarningsEvery(options: { seconds: number }) {
    return setInterval(() => {
      this.debugScanForWarnings().forEach((warning) => console.warn(warning))
    }, options.seconds * 1000)
  }

  // Scan across the whole world for warnings that may be useful for debugging.
  debugScanForWarnings(): Array<unknown> {
    const missingPrerequisites = new AutoMap<number, string[]>(Array)

    this.storage.forEach((componentStorage, componentId) => {
      const componentClass = getComponentClassById(componentId)
      if (!componentClass) return

      const prerequisiteComponentIds =
        getComponentPrerequisiteIds(componentClass)
      if (prerequisiteComponentIds) {
        componentStorage.forEach((component, entity) => {
          if (!component) return

          const entityBitMask = this.entityBitMasks[entity]
          if (!entityBitMask) return

          if (!entityBitMask.isSuperSetOf(prerequisiteComponentIds)) {
            for (const prerequisiteId of prerequisiteComponentIds.oneBits()) {
              if (!entityBitMask.get(prerequisiteId)) {
                const prerequisiteClass = getComponentClassById(prerequisiteId)
                missingPrerequisites
                  .getOrCreate(entity)
                  .push(prerequisiteClass?.name ?? `${prerequisiteId}`)
              }
            }
          }
        })
      }
    })

    return [...missingPrerequisites.entries()].map(([entity, missing]) => {
      return {
        "entity is missing prerequisite components": {
          entity: this.debugInfoFor(entity),
          missing,
        },
      }
    })
  }

  destroy(entity: Entity): void {
    // Any system that was tracking this entity must drop it.
    for (const system of this.phases.systems()) {
      system.removeEntityIfPresent(entity)
    }
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
          const { collectionEntity } = removedComponent
          this._removeCollected(collectionEntity, componentId, entity)
        }
        if (removedComponent.collectionEntities !== undefined) {
          for (const collectionEntity of removedComponent.collectionEntities.values()) {
            this._removeCollected(collectionEntity, componentId, entity)
          }
        }
      }
      bitMask.clear()
    }
    // If this entity had any collected entities, remove one-to-many
    // relationship components from each of the collected entites,
    // and update any many-to-many relationship components.
    const collectedStorage = this.collectedStorage[entity]
    if (collectedStorage) {
      for (const [
        componentId,
        collectedEntities,
      ] of collectedStorage.entries()) {
        for (const collectedEntity of collectedEntities) {
          const componentType = getComponentClassById(componentId)!
          const component = this.get(collectedEntity, componentType)
          if (component?.collectionEntity === entity)
            this.remove(collectedEntity, [componentType])
          component?.collectionEntities?.remove(entity)
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

  getForMany<T extends ComponentClass>(
    entities: { values: () => Iterable<Entity> },
    componentType: T,
  ): Map<Entity, T["prototype"]> {
    const map = new Map<Entity, T["prototype"]>()

    const storage = this.storage[componentType.componentId]
    if (!storage) return map

    for (const entity of entities.values()) {
      const component = storage[entity]
      if (component) map.set(entity, component)
    }

    return map
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
      const removedCollectionEntities = removedComponent?.collectionEntities
      const { collectionEntity, collectionEntities } = component
      if (collectionEntity !== removedCollectionEntity) {
        // Remove the entity from the old collection (if applicable).
        if (removedCollectionEntity !== undefined)
          this.collectedStorage[removedCollectionEntity]
            ?.get(componentId)
            ?.delete(entity)
        // Add the entity to the new collection (if applicable).
        if (collectionEntity !== undefined)
          this._addCollected(collectionEntity, componentId, entity)
      }
      if (collectionEntities !== removedCollectionEntities) {
        if (collectionEntities !== undefined) {
          collectionEntities._setTracking(this, componentId, entity)
          // Add new collection membership links which weren't tracked yet.
          for (const collectionEntity of collectionEntities.values()) {
            if (removedCollectionEntities?.has(collectionEntity)) continue
            this._addCollected(collectionEntity, componentId, entity)
          }
          // Remove old collection membership links which are no longer tracked.
          if (removedCollectionEntities !== undefined) {
            for (const collectionEntity of removedCollectionEntities.values()) {
              if (collectionEntities.has(collectionEntity)) continue
              this._removeCollected(collectionEntity, componentId, entity)
            }
          }
        } else {
          // Remove any old collection membership links.
          if (removedCollectionEntities !== undefined) {
            for (const collectionEntity of removedCollectionEntities.values()) {
              this._removeCollected(collectionEntity, componentId, entity)
            }
          }
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
        // entity from the collection(s) it was in.
        const removedCollectionEntity = removedComponent?.collectionEntity
        if (removedCollectionEntity !== undefined) {
          this._removeCollected(removedCollectionEntity, componentId, entity)
        }
        const removedCollectionEntities = removedComponent?.collectionEntities
        if (removedCollectionEntities !== undefined) {
          for (const collectionEntity of removedCollectionEntities.values()) {
            this._removeCollected(collectionEntity, componentId, entity)
          }
        }
      }
    }

    this.updateSystemsForEntity(entity, bitMask)
  }

  // TODO: Use a truly private symbol for this method name
  _addCollected(collection: Entity, componentId: Entity, collected: Entity) {
    const collectedStorage = (this.collectedStorage[collection] ??= new AutoMap(
      Set<number>,
    ))
    collectedStorage.getOrCreate(componentId).add(collected)
  }

  // TODO: Use a truly private symbol for this method name
  _removeCollected(collection: Entity, componentId: Entity, collected: Entity) {
    const collectedStorage = this.collectedStorage[collection]
    if (!collectedStorage) return
    collectedStorage.get(componentId)?.delete(collected)
  }

  getCollected(
    entity: Entity,
    componentType: ComponentClass,
  ): ReadonlySet<Entity> {
    const { componentId } = componentType
    const collectedStorage = (this.collectedStorage[entity] ??= new AutoMap(
      Set<number>,
    ))
    return collectedStorage.getOrCreate(componentId)
  }

  addSystem<
    C extends SystemContext = SystemContext,
    T extends ComponentClasses = ComponentClass[],
  >(
    phase: Phase,
    systemFactory: SystemFactory<C, T>,
    context: C,
    opts: OrderedListAddOpts<SystemFactory<C, T>> = {},
  ) {
    if (context.world !== this)
      throw new Error("System context is not associated to this world")
    const system = systemFactory(context)
    this.phases.addSystem<C, T>(phase, systemFactory, context, system, opts)
    system._requiredBits.set(system._contextComponentType.componentId, true)
    system.componentTypes.forEach(({ componentId }) => {
      system._requiredBits.set(componentId, true)
    })
    this.entityBitMasks.forEach((bitMask, entity) => {
      this.updateSystemForEntity(system, entity, bitMask)
    })
  }

  public *phasesAndSystemFactories() {
    for (const info of this.phases.phasesAndSystemFactories()) {
      yield info
    }
  }

  run() {
    for (const system of this.phases.systems()) {
      if (system.context.isPaused) continue
      system.run(system._entities)
    }
  }

  private updateSystemsForEntity(entity: Entity, bits: BitMask) {
    for (const system of this.phases.systems()) {
      this.updateSystemForEntity(system, entity, bits)
    }
  }

  private updateSystemForEntity(system: System, entity: Entity, bits: BitMask) {
    if (
      bits.isSuperSetOf(system._requiredBits) &&
      this.get(entity, system._contextComponentType) === system.context
    ) {
      system.setEntityComponents(
        entity,
        system.componentTypes.map((component) => this.get(entity, component)!),
      )
    } else {
      system.removeEntityIfPresent(entity)
    }
  }
}
